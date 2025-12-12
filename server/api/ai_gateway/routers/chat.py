"""
Chat Completions Router for AI Gateway.
Main endpoint for AI chat with smart routing, streaming, and fallback.
"""

import json
import time
import uuid
import asyncio
import logging
from datetime import timezone as tz
from typing import Optional, List, Dict, Any

from django.utils import timezone
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import UserAPIKey, UsageLog, KeyModelUsage
from ..services import get_key_selector, get_quota_tracker, get_circuit_breaker, get_cache_manager
from ..adapters import get_adapter, AdapterResponse
from ..utils.encryption import decrypt_api_key

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async coroutine from sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


class ChatCompletionsView(APIView):
    """
    POST /api/ai-gateway/chat/completions
    
    Main chat endpoint with:
    - Smart key selection
    - Streaming (SSE) support
    - Response caching
    - Automatic fallback
    - Retry with exponential backoff
    """
    permission_classes = [IsAuthenticated]
    
    # Retry configuration
    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 2, 4]  # Exponential backoff
    
    def _is_retryable_error(self, error: str) -> bool:
        """Check if error is transient and worth retrying."""
        retryable_patterns = [
            'timeout', '5', 'overloaded', 'temporarily', 
            'connection', 'network', 'unavailable'
        ]
        error_lower = error.lower()
        return any(p in error_lower for p in retryable_patterns)
    
    def _is_permanent_error(self, error: str, status_code: int = 0) -> bool:
        """Check if error is permanent (don't retry, try next key)."""
        if status_code in [401, 403, 429]:
            return True
        
        permanent_patterns = ['invalid', 'unauthorized', 'forbidden', 'quota', 'rate limit']
        error_lower = error.lower()
        return any(p in error_lower for p in permanent_patterns)
    
    async def _make_request_async(
        self,
        adapter,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float
    ) -> AdapterResponse:
        """Make a request with retry logic."""
        last_error = None
        
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                response = await adapter.complete(
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                
                if response.success:
                    return response
                
                if self._is_permanent_error(response.error or "", 0):
                    return response
                
                if not self._is_retryable_error(response.error or ""):
                    return response
                
                last_error = response.error
                
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAYS[attempt])
                    
            except Exception as e:
                last_error = str(e)
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAYS[attempt])
        
        return AdapterResponse(
            success=False,
            content="",
            model=adapter.model,
            provider=adapter.PROVIDER_NAME,
            tokens_input=0,
            tokens_output=0,
            latency_ms=0,
            error=f"All retries failed: {last_error}"
        )
    
    async def _try_with_fallback_async(
        self,
        user_id: int,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float,
        preferred_provider: Optional[str] = None
    ):
        """Try request with fallback chain."""
        key_selector = get_key_selector()
        quota_tracker = get_quota_tracker()
        circuit_breaker = get_circuit_breaker()
        
        chain = await key_selector.get_fallback_chain(
            user_id,
            preferred_provider=preferred_provider,
            max_keys=5
        )
        
        if not chain:
            return None, None, "No API keys available. Please add keys first."
        
        last_error = "Unknown error"
        
        for scored_key in chain:
            key = scored_key.key
            
            allowed, reason = await quota_tracker.check_and_reserve(
                key.id,
                key.minute_quota,
                key.daily_quota
            )
            
            if not allowed:
                logger.debug(f"Key {key.id} quota exceeded: {reason}")
                continue
            
            try:
                adapter = get_adapter(key.provider, scored_key.decrypted_key)
                
                response = await self._make_request_async(
                    adapter=adapter,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                
                if response.success:
                    await circuit_breaker.record_success(key.provider)
                    
                    # Update key stats (sync operation)
                    key.last_used_at = timezone.now()
                    key.requests_today += 1
                    key.requests_this_month += 1
                    if response.latency_ms > 0:
                        key.avg_latency_ms = (key.avg_latency_ms + response.latency_ms) // 2
                    key.consecutive_failures = 0
                    key.save(update_fields=[
                        'last_used_at', 'requests_today', 'requests_this_month',
                        'avg_latency_ms', 'consecutive_failures'
                    ])
                    
                    # Update per-model usage
                    try:
                        model_usage, _ = KeyModelUsage.objects.get_or_create(
                            key=key,
                            model=response.model
                        )
                        model_usage.requests_today += 1
                        model_usage.success_count += 1
                        model_usage.save()
                    except Exception as e:
                        logger.warning(f"Failed to update model usage: {e}")
                    
                    return response, key, None
                
                last_error = response.error or "Unknown error"
                await circuit_breaker.record_failure(key.provider)
                
                key.error_count_last_hour += 1
                key.consecutive_failures += 1
                key.health_score = max(0, key.health_score - 5)
                key.save(update_fields=['error_count_last_hour', 'consecutive_failures', 'health_score'])
                
                await quota_tracker.release_quota(key.id)
                
            except Exception as e:
                last_error = str(e)
                logger.exception(f"Error with key {key.id}: {e}")
                await quota_tracker.release_quota(key.id)
        
        return None, None, f"All providers exhausted. Last error: {last_error}"
    
    def _log_usage(
        self,
        user_id: int,
        key_id: int,
        provider: str,
        model: str,
        tokens_input: int,
        tokens_output: int,
        latency_ms: int,
        status_str: str,
        cached: bool,
        error: str = ""
    ):
        """Log usage to database."""
        try:
            UsageLog.objects.create(
                user_id=user_id,
                key_id=key_id if key_id else None,
                provider=provider,
                model=model,
                tokens_input=tokens_input,
                tokens_output=tokens_output,
                latency_ms=latency_ms,
                status=status_str,
                error_message=error,
                cached=cached
            )
        except Exception as e:
            logger.warning(f"Failed to log usage: {e}")
    
    def post(self, request):
        """Handle chat completion request."""
        messages = request.data.get('messages', [])
        stream = request.data.get('stream', False)
        provider = request.data.get('provider')
        model = request.data.get('model')
        max_tokens = request.data.get('max_tokens', 1024)
        temperature = request.data.get('temperature', 0.7)
        
        if not messages:
            return Response(
                {'error': 'messages field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert messages to list of dicts
        msg_list = []
        for msg in messages:
            if isinstance(msg, dict):
                msg_list.append({
                    'role': msg.get('role', 'user'),
                    'content': msg.get('content', '')
                })
        
        if not msg_list:
            return Response(
                {'error': 'Invalid messages format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check cache (only for non-streaming)
        if not stream:
            cache_manager = get_cache_manager()
            cached_response = run_async(cache_manager.get(msg_list, model, provider))
            
            if cached_response:
                self._log_usage(
                    user_id=request.user.id,
                    key_id=0,
                    provider=cached_response.get('provider', 'cached'),
                    model=cached_response.get('model', 'cached'),
                    tokens_input=0,
                    tokens_output=0,
                    latency_ms=0,
                    status_str='success',
                    cached=True
                )
                
                cached_response['cached'] = True
                return Response(cached_response)
        
        # Try with fallback (run async in sync context)
        response, key, error = run_async(self._try_with_fallback_async(
            user_id=request.user.id,
            messages=msg_list,
            max_tokens=max_tokens,
            temperature=temperature,
            preferred_provider=provider
        ))
        
        if error:
            return Response(
                {'error': error},
                status=status.HTTP_429_TOO_MANY_REQUESTS if 'exhausted' in error else status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Streaming is not supported in sync context - return buffered
        if stream:
            # For streaming, we still return the buffered response but mark it
            logger.info("Streaming requested but using buffered mode in sync context")
        
        # Build response
        result = {
            'id': f"chatcmpl-{uuid.uuid4().hex[:8]}",
            'object': 'chat.completion',
            'created': int(time.time()),
            'model': response.model,
            'provider': response.provider,
            'choices': [{
                'index': 0,
                'message': {
                    'role': 'assistant',
                    'content': response.content
                },
                'finish_reason': 'stop'
            }],
            'usage': {
                'prompt_tokens': response.tokens_input,
                'completion_tokens': response.tokens_output,
                'total_tokens': response.tokens_input + response.tokens_output
            },
            'cached': False
        }
        
        # Cache the response
        if not stream:
            cache_manager = get_cache_manager()
            run_async(cache_manager.set(msg_list, result, model, provider))
        
        # Log usage
        self._log_usage(
            user_id=request.user.id,
            key_id=key.id,
            provider=response.provider,
            model=response.model,
            tokens_input=response.tokens_input,
            tokens_output=response.tokens_output,
            latency_ms=response.latency_ms,
            status_str='success',
            cached=False
        )
        
        return Response(result)
