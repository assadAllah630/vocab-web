"""
Unified AI Helper - Integrates AI Gateway with Legacy Profile Keys

This module provides backwards-compatible AI generation that:
1. First tries AI Gateway keys (multi-provider, smart selection)
2. Falls back to user.profile.gemini_api_key if no gateway keys

Usage:
    from api.unified_ai import generate_ai_content
    response = generate_ai_content(user, prompt)
"""

import asyncio
import logging
from typing import Optional
from django.utils import timezone
from django.db.models import F

logger = logging.getLogger(__name__)


class GatewayResponse:
    """Standardized response from AI Gateway."""
    def __init__(self, text, usage=None):
        self.text = text
        self.usage = usage or {}


def run_async(coro):
    """Run async coroutine from sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result(timeout=120)
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


def generate_ai_content(user, prompt: str, max_tokens: int = 2048, temperature: float = 0.7, required_capabilities: list = None, quality_tier: str = None, json_mode: bool = False, tools: list = None):
    """
    Generate AI content using the best available method.
    
    Priority:
    1. AI Gateway keys (multi-provider with smart selection)
    2. Profile Gemini key (legacy fallback)
    
    Args:
        user: Django User object
        prompt: The prompt to send
        max_tokens: Maximum tokens to generate
        temperature: Creativity setting (0-1)
        required_capabilities: List of required capabilities (e.g. ['json_mode'])
        quality_tier: Minimum quality tier (low, medium, high, premium)
        json_mode: Whether to enforce JSON output
        tools: List of tools to pass to the model
        
    Returns:
        Object with .text attribute containing the response
        
    Raises:
        Exception if all methods fail
    """
    
    # Try AI Gateway first
    try:
        # Auto-add json_mode capability if requested
        if json_mode:
            if required_capabilities is None:
                required_capabilities = []
            if 'json_mode' not in required_capabilities:
                required_capabilities.append('json_mode')

        gateway_result = _try_gateway(user, prompt, max_tokens, temperature, required_capabilities, quality_tier, json_mode, tools)
        if gateway_result:
            return gateway_result
    except Exception as e:
        logger.warning(f"[UnifiedAI] Gateway attempt failed: {str(e)}")
        # Don't raise yet, try fallback
        pass
    
    # Fallback: Legacy Profile Gemini Key
    try:
        # Check if user is provided and has a profile
        if user and hasattr(user, 'profile'):
            profile_key = getattr(user.profile, 'gemini_api_key', None)
            if profile_key:
                logger.info(f"[UnifiedAI] Falling back to Legacy Profile Key for user {user.username}")
            from .ai_gateway.adapters.gemini import GeminiAdapter
            
            # Use a default model for legacy fallback
            adapter = GeminiAdapter(api_key=profile_key, model="gemini-1.5-flash")
            
            # Run async adapter synchronously
            import asyncio
            import concurrent.futures
             
            messages = [{"role": "user", "content": prompt}]
            
            async def call_legacy():
                return await adapter.complete(
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    json_mode=json_mode,
                    tools=tools
                )
                
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, call_legacy())
                response = future.result(timeout=60)
                
            if response.success:
                return GatewayResponse(response.content)
            else:
                logger.warning(f"[UnifiedAI] Legacy fallback failed: {response.error}")
                
    except Exception as e:
        logger.error(f"[UnifiedAI] Legacy fallback error: {e}")

    raise Exception("AI Gateway & Fallback failed. Please check your API keys.")


def _try_gateway(user, prompt: str, max_tokens: int, temperature: float, required_capabilities: list = None, quality_tier: str = None, json_mode: bool = False, tools: list = None):
    """
    Try to generate using AI Gateway with model-centric selection (v2.0).
    
    Uses ModelSelector to find the best available model based on:
    - Quota availability
    - Health scores
    - Recent failure history
    - Capability matching
    
    Then uses LearningEngine to update state after the call.
    """
    import asyncio
    import concurrent.futures
    import time
    
    try:
        from .ai_gateway.models import UserAPIKey, UsageLog, ModelInstance
        from .ai_gateway.adapters import get_adapter
        from .ai_gateway.utils.encryption import decrypt_api_key
        from .ai_gateway.services.model_selector import model_selector
        from .ai_gateway.services.learning_engine import learning_engine
        
        # STEP 1: Use ModelSelector to find best model
        selection_result = model_selector.find_best_model(
            user=user,
            request_type='text',
            required_capabilities=required_capabilities,
            quality_tier=quality_tier,
        )
        
        if not selection_result.success:
            logger.debug(f"[UnifiedAI v2] No models available: {selection_result.warning}")
            return None
        
        # Try selected model + alternatives if needed
        # CRITICAL: Ensure cross-provider failover by grouping alternatives by provider
        
        # Collect all models to try, prioritizing diversity across providers
        primary_models = [selection_result.model]
        alternatives = selection_result.alternatives[:4]  # Get more alternatives
        
        # Group alternatives by provider for cross-provider failover
        seen_providers = {selection_result.model.model.provider} if selection_result.model else set()
        cross_provider_fallbacks = []
        same_provider_fallbacks = []
        
        for alt in alternatives:
            if alt is None:
                continue
            if alt.model.provider in seen_providers:
                same_provider_fallbacks.append(alt)
            else:
                cross_provider_fallbacks.append(alt)
                seen_providers.add(alt.model.provider)
        
        # Order: primary → cross-provider fallbacks → same-provider fallbacks
        models_to_try = primary_models + cross_provider_fallbacks + same_provider_fallbacks[:1]
        
        logger.debug(f"[UnifiedAI v2] Failover order: {[m.model.provider + '/' + m.model.model_id for m in models_to_try if m]}")
        
        last_error = None
        failed_providers = set()  # Track providers that failed completely
        quota_blocked_providers = set()  # Track providers with quota issues
        
        for instance in models_to_try:
            if instance is None:
                continue
            
            provider = instance.model.provider
            
            # SMART SKIP: If this provider has quota issues, skip all its models
            if provider in quota_blocked_providers:
                logger.debug(f"[UnifiedAI v2] Skipping {instance.model.model_id} - provider {provider} has quota issues")
                continue
                
            start_time = time.time()
            
            try:
                # Get decrypted API key
                decrypted_key = decrypt_api_key(instance.api_key.api_key_encrypted)
                
                # Get adapter for this provider
                adapter = get_adapter(instance.model.provider, decrypted_key, model=instance.model.model_id)
                
                # Prepare messages
                messages = [{"role": "user", "content": prompt}]
                
                # Call adapter async
                async def call_adapter():
                    return await adapter.complete(
                        messages=messages, 
                        max_tokens=max_tokens, 
                        temperature=temperature,
                        model=instance.model.model_id,  # Specify exact model
                        json_mode=json_mode,
                        tools=tools
                    )
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, call_adapter())
                    response = future.result(timeout=120)
                
                latency_ms = int((time.time() - start_time) * 1000)
                
                if response.success and response.content and response.content.strip():
                    # STEP 2: Record success with LearningEngine
                    tokens_used = response.tokens_input + response.tokens_output
                    learning_engine.record_success(
                        instance=instance,
                        latency_ms=latency_ms,
                        tokens_used=tokens_used,
                    )
                    
                    # Log for analytics
                    if user:
                        UsageLog.objects.create(
                            user=user,
                            key=instance.api_key,
                            provider=instance.model.provider,
                            model=instance.model.model_id,
                            status='success',
                            latency_ms=latency_ms,
                            tokens_input=response.tokens_input,
                            tokens_output=response.tokens_output,
                        )
                    
                    # Update Key Usage Stats (Missing Step Fix)
                    instance.api_key.requests_today = (instance.api_key.requests_today or 0) + 1
                    instance.api_key.requests_this_month = (instance.api_key.requests_this_month or 0) + 1
                    instance.api_key.last_used_at = timezone.now()
                    instance.api_key.save(update_fields=['requests_today', 'requests_this_month', 'last_used_at'])

                    logger.info(
                        f"[UnifiedAI v2] SUCCESS: {instance.model.provider}/{instance.model.model_id} "
                        f"(conf: {instance.confidence_score:.2f}, latency: {latency_ms}ms)"
                    )
                    
                    return GatewayResponse(response.content)
                
                else:
                    # STEP 3: Record failure with LearningEngine
                    error_message = str(response.error)
                    learning_engine.record_failure(
                        instance=instance,
                        error_message=error_message,
                        latency_ms=latency_ms,
                        request_type='text',
                        retry_after_seconds=getattr(response, 'retry_after_seconds', None),
                    )
                    
                    UsageLog.objects.create(
                        user=user,
                        key=instance.api_key,
                        provider=instance.model.provider,
                        model=instance.model.model_id,
                        status='error',
                        error_message=error_message[:500],
                        latency_ms=latency_ms,
                    )
                    
                    last_error = response.error
                    error_message = str(response.error)
                    
                    # SMART TRACKING: Check if this was a quota error
                    if '429' in error_message or 'Quota' in error_message or 'quota' in error_message:
                        logger.warning(f"[UnifiedAI v2] Provider {instance.model.provider} has quota issues. Skipping remaining models.")
                        quota_blocked_providers.add(instance.model.provider)
                    
                    failed_providers.add(instance.model.provider)
                    
                    logger.warning(
                        f"[UnifiedAI v2] FAILED: {instance.model.model_id}: {error_message[:100]}"
                    )
                    
            except Exception as e:
                latency_ms = int((time.time() - start_time) * 1000)
                error_message = str(e)
                
                # Record failure
                learning_engine.record_failure(
                    instance=instance,
                    error_message=error_message,
                    latency_ms=latency_ms,
                    request_type='text',
                )
                
                # SMART TRACKING for Exceptions
                if '429' in error_message or 'Quota' in error_message:
                     quota_blocked_providers.add(instance.model.provider)
                failed_providers.add(instance.model.provider)
                
                UsageLog.objects.create(
                    user=user,
                    key=instance.api_key,
                    provider=instance.model.provider,
                    model=instance.model.model_id,
                    status='error',
                    error_message=error_message[:500],
                )
                
                import traceback
                logger.error(f"[UnifiedAI v2] Detailed Traceback for {instance.model.model_id}:\n{traceback.format_exc()}")
                last_error = error_message
                logger.warning(f"[UnifiedAI v2] Exception: {instance.model.model_id}: {e}")
                continue
        
        if last_error:
            raise Exception(f"All AI models failed. Last error: {last_error}")
        raise Exception("All AI models failed.")
        
    except Exception as e:
        # If headers/imports fail, raise error
        raise Exception(f"AI Gateway initialization failed: {e}")



def get_ai_status(user) -> dict:
    """
    Get status of AI capabilities for a user.
    
    Returns dict with:
    - has_gateway_keys: bool
    - gateway_keys_count: int
    - has_legacy_key: bool
    - providers_available: list
    """
    status = {
        'has_gateway_keys': False,
        'gateway_keys_count': 0,
        'has_legacy_key': False,
        'providers_available': [],
    }
    
    try:
        # Check gateway keys
        from .ai_gateway.models import UserAPIKey
        keys = UserAPIKey.objects.filter(user=user, is_active=True)
        status['gateway_keys_count'] = keys.count()
        status['has_gateway_keys'] = status['gateway_keys_count'] > 0
        status['providers_available'] = list(keys.values_list('provider', flat=True).distinct())
    except Exception as e:
        logger.warning(f"Failed to check gateway status: {e}")
    
    return status


def generate_ai_image(user, prompt: str, size: str = "1024x1024", style: str = None):
    """
    Generate an image using multi-provider fallback.
    
    Priority:
    1. Gemini (500/day free)
    2. HuggingFace (1000/day free)
    3. OpenRouter (fallback)
    
    Args:
        user: Django User object
        prompt: Text description of the image
        size: Image dimensions (e.g., "1024x1024")
        style: Optional style modifier (e.g., "cartoon", "realistic")
        
    Returns:
        Dict with 'success', 'image_base64', 'mime_type', 'provider', 'model'
        
    Raises:
        Exception if all providers fail
    """
    import concurrent.futures
    
    # First, try Pollinations.AI - it's FREE and needs NO API key!
    try:
        from .ai_gateway.adapters import image_pollinations
        
        logger.info("[UnifiedAI Image] Trying Pollinations.AI (free, no key needed)")
        
        async def call_pollinations():
            return await image_pollinations.generate_image(prompt=prompt, size=size, style=style)
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(asyncio.run, call_pollinations())
            result = future.result(timeout=120)
        
        if result.get("success"):
            logger.info("[UnifiedAI Image] SUCCESS with Pollinations.AI!")
            return result
        else:
            logger.warning(f"[UnifiedAI Image] Pollinations failed: {result.get('error')}")
    except Exception as e:
        logger.error(f"[UnifiedAI Image] Pollinations error: {e}")
    
    # Fallback: Try providers that need API keys
    try:
        from .ai_gateway.models import UserAPIKey
        from .ai_gateway.utils.encryption import decrypt_api_key
    except ImportError as e:
        logger.error(f"[UnifiedAI] Import error: {e}")
        return {"success": False, "error": "Image generation not available"}
    
    # Provider order for image generation (keyed providers)
    IMAGE_PROVIDERS = [
        ("gemini", "image_gemini"),
        ("huggingface", "image_huggingface"),
    ]
    
    for provider_name, adapter_module in IMAGE_PROVIDERS:
        try:
            # Get keys for this provider
            keys = UserAPIKey.objects.filter(
                user=user, 
                is_active=True, 
                provider=provider_name
            ).order_by('-health_score')
            
            if not keys.exists():
                logger.debug(f"[UnifiedAI Image] No {provider_name} keys")
                continue
            
            # Try each key for this provider
            for key in keys:
                try:
                    api_key = decrypt_api_key(key.api_key_encrypted)
                    
                    # Import the adapter
                    import importlib
                    adapter = importlib.import_module(f".{adapter_module.split('.')[-1]}", 
                                                       package="api.ai_gateway.adapters")
                    
                    logger.info(f"[UnifiedAI Image] Trying {provider_name} key {key.id}")
                    
                    # Run async adapter in thread
                    async def call_adapter():
                        return await adapter.generate_image(api_key, prompt, size=size, style=style)
                    
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future = executor.submit(asyncio.run, call_adapter())
                        result = future.result(timeout=120)
                    
                    if result.get("success"):
                        # Update usage stats
                        key.requests_today = (key.requests_today or 0) + 1
                        key.requests_this_month = (key.requests_this_month or 0) + 1
                        key.last_used_at = timezone.now()
                        key.save(update_fields=['requests_today', 'requests_this_month', 'last_used_at'])
                        
                        logger.info(f"[UnifiedAI Image] SUCCESS: {provider_name} key {key.id}")
                        return result
                    else:
                        logger.warning(f"[UnifiedAI Image] {provider_name} key {key.id} failed: {result.get('error')}")
                        continue
                        
                except Exception as e:
                    logger.error(f"[UnifiedAI Image] Error with {provider_name} key {key.id}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"[UnifiedAI Image] Provider {provider_name} error: {e}")
            continue
    
    # All providers failed
    logger.error("[UnifiedAI Image] All image providers failed")
    return {
        "success": False,
        "error": "All image generation providers failed. Please add API keys for Gemini, HuggingFace, or OpenRouter."
    }

