"""
Gemini Adapter for Google's Generative AI API.
"""

import logging
import time
from typing import Optional, Dict, Any, List

import httpx

from .base import BaseAdapter, AdapterResponse

logger = logging.getLogger(__name__)


class GeminiAdapter(BaseAdapter):
    """
    Adapter for Google Gemini API.
    
    Limits: 15 req/min, 1500/day (free tier)
    Auth: x-goog-api-key header
    
    Automatic fallback: If a model returns 429 (quota exceeded),
    automatically tries the next model in the fallback chain.
    """
    
    PROVIDER_NAME = "gemini"
    DEFAULT_MODEL = "gemini-2.0-flash-exp"
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    
    # Fallback chain - ONLY models that exist (verified via list_models)
    FALLBACK_MODELS = [
        "gemini-2.0-flash",          # Primary - fast and reliable
        "gemini-2.0-flash-lite",     # Lighter version
        "gemini-2.5-flash",          # Latest
        "gemini-2.0-flash-exp",      # Experimental
    ]
    
    RATE_LIMIT_MINUTE = 15
    RATE_LIMIT_DAILY = 1500
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
    
    def _format_messages_gemini(
        self, 
        messages: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """Convert OpenAI-style messages to Gemini format."""
        contents = []
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                role = "user"
            elif role == "assistant":
                role = "model"
            else:
                role = "user"
            
            contents.append({
                "role": role,
                "parts": [{"text": content}]
            })
        
        return contents
    
    async def complete(
        self, 
        messages: List[Dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        **kwargs
    ) -> AdapterResponse:
        """Send completion request to Gemini with automatic model fallback."""
        
        # Build fallback chain starting from current model
        models_to_try = [self.model]
        for m in self.FALLBACK_MODELS:
            if m != self.model and m not in models_to_try:
                models_to_try.append(m)
        
        last_error = None
        start_time = time.time()
        
        for model in models_to_try:
            url = f"{self.BASE_URL}/models/{model}:generateContent"
            
            payload = {
                "contents": self._format_messages_gemini(messages),
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": temperature,
                }
            }
            
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(
                        url,
                        headers=self._get_headers(),
                        json=payload
                    )
                    
                    latency_ms = int((time.time() - start_time) * 1000)
                    
                    # If 429 (quota exceeded), extract Retry-After and return immediately
                    if response.status_code == 429:
                        retry_after = None
                        
                        # Method 1: Check Retry-After header
                        if 'Retry-After' in response.headers:
                            try:
                                retry_after = int(response.headers['Retry-After'])
                            except ValueError:
                                pass
                        
                        # Method 2: Check JSON body for retryDelay (common in Google APIs)
                        if not retry_after:
                            try:
                                error_data = response.json()
                                # Google errors often look like:
                                # {"error": {"details": [{"@type": "...", "retryDelay": "9.13s"}]}}
                                if "error" in error_data and "details" in error_data["error"]:
                                    for detail in error_data["error"]["details"]:
                                        if "retryDelay" in detail:
                                            # Format like "10.5s" or just "10s"
                                            delay_str = detail["retryDelay"].rstrip('s')
                                            retry_after = int(float(delay_str)) + 1 # Round up
                                            break
                            except Exception:
                                pass
                        
                        logger.info(
                            f"Gemini model {model} quota exceeded (429). "
                            f"Retry-After: {retry_after}s"
                        )
                        
                        # Return error with retry_after info instead of continuing fallback
                        # (all models share same key quota)
                        return AdapterResponse(
                            success=False,
                            content="",
                            model=model,
                            provider=self.PROVIDER_NAME,
                            tokens_input=0,
                            tokens_output=0,
                            latency_ms=latency_ms,
                            error=f"Quota exceeded (429)",
                            retry_after_seconds=retry_after,
                        )
                    
                    # If 404 (model not found), try next model
                    if response.status_code == 404:
                        logger.info(f"Gemini model {model} not found (404), trying next...")
                        last_error = f"Model {model}: 404"
                        continue
                    
                    if response.status_code != 200:
                        error_text = response.text
                        return AdapterResponse(
                            success=False,
                            content="",
                            model=model,
                            provider=self.PROVIDER_NAME,
                            tokens_input=0,
                            tokens_output=0,
                            latency_ms=latency_ms,
                            error=f"API error {response.status_code}: {error_text[:200]}"
                        )
                    
                    data = response.json()
                    
                    content = ""
                    if "candidates" in data and len(data["candidates"]) > 0:
                        candidate = data["candidates"][0]
                        if "content" in candidate and "parts" in candidate["content"]:
                            parts = candidate["content"]["parts"]
                            content = "".join(p.get("text", "") for p in parts)
                    
                    usage = data.get("usageMetadata", {})
                    tokens_input = usage.get("promptTokenCount", 0)
                    tokens_output = usage.get("candidatesTokenCount", 0)
                    
                    return AdapterResponse(
                        success=True,
                        content=content,
                        model=model,  # Return the model that actually worked
                        provider=self.PROVIDER_NAME,
                        tokens_input=tokens_input,
                        tokens_output=tokens_output,
                        latency_ms=latency_ms,
                        raw_response=data
                    )
                    
            except httpx.TimeoutException:
                logger.warning(f"Timeout on model {model}, trying next...")
                last_error = f"Model {model} timed out"
                continue
            except Exception as e:
                logger.warning(f"Error on model {model}: {e}, trying next...")
                last_error = str(e)
                continue
        
        # All models failed
        latency_ms = int((time.time() - start_time) * 1000)
        return AdapterResponse(
            success=False, content="", model=self.model,
            provider=self.PROVIDER_NAME, tokens_input=0, tokens_output=0,
            latency_ms=latency_ms, error=f"All models failed. Last error: {last_error}"
        )
    
    async def validate_key(self) -> tuple[bool, str]:
        """Validate Gemini API key with a minimal request."""
        try:
            # Use 1.5-flash (Free Tier eligible) - 404s are handled as success
            validation_model = "gemini-1.5-flash"
            url = f"{self.BASE_URL}/models/{validation_model}:generateContent"
            payload = {
                "contents": [{"parts": [{"text": "hi"}]}],
                "generationConfig": {"maxOutputTokens": 5}
            }
            
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(url, headers=self._get_headers(), json=payload)
                
                # 200 = Success
                if response.status_code == 200:
                    return True, "Valid"
                
                # 404 = Valid Key, but Model Not Found (Accepted as Valid)
                if response.status_code == 404:
                    logger.info("Gemini validation: Model 404, but key is valid.")
                    return True, "Valid (Model not found)"

                # 429 = Quota Exceeded
                if response.status_code == 429:
                    logger.warning(f"Gemini key validation: Quota Exceeded (429).")
                    return False, "Quota Exceeded (429)"
                
                # Other errors
                error_msg = f"{response.status_code} - {response.text[:200]}"
                logger.warning(f"Gemini key validation failed: {error_msg}")
                return False, error_msg
                
        except Exception as e:
            logger.warning(f"Gemini key validation error: {e}")
            return False, str(e)
