import logging
import time
from typing import Optional, Dict, Any, List
import httpx
from .base import BaseAdapter, AdapterResponse

logger = logging.getLogger(__name__)


class GroqAdapter(BaseAdapter):
    """
    Groq API adapter. 
    Limits: 30 req/min, 14400/day
    
    Automatic fallback: If a model returns 429/404/503,
    automatically tries the next model in the fallback chain.
    """
    
    PROVIDER_NAME = "groq"
    DEFAULT_MODEL = "llama-3.1-70b-versatile"
    BASE_URL = "https://api.groq.com/openai/v1"
    
    # Fallback chain - ordered by capability
    FALLBACK_MODELS = [
        "llama-3.1-70b-versatile",  # Best quality
        "llama-3.1-8b-instant",     # Fastest
        "mixtral-8x7b-32768",       # Good balance
        "gemma2-9b-it",             # Google's model
    ]
    
    RATE_LIMIT_MINUTE = 30
    RATE_LIMIT_DAILY = 14400
    
    async def complete(self, messages: List[Dict[str, str]], max_tokens: int = 1024, temperature: float = 0.7, **kwargs) -> AdapterResponse:
        """Send completion request to Groq with automatic model fallback."""
        
        # Build fallback chain starting from current model
        models_to_try = [self.model]
        for m in self.FALLBACK_MODELS:
            if m != self.model and m not in models_to_try:
                models_to_try.append(m)
        
        last_error = None
        start_time = time.time()
        
        for model in models_to_try:
            url = f"{self.BASE_URL}/chat/completions"
            payload = {
                "model": model,
                "messages": self._format_messages_openai(messages),
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(url, headers=self._get_headers(), json=payload)
                    latency_ms = int((time.time() - start_time) * 1000)
                    
                    # If quota exceeded, model not found, or service overloaded
                    if response.status_code in (429, 404, 503):
                        logger.info(f"Groq model {model} returned {response.status_code}, trying next...")
                        last_error = f"Model {model}: {response.status_code}"
                        continue
                    
                    if response.status_code != 200:
                        return AdapterResponse(
                            success=False, content="", model=model, provider=self.PROVIDER_NAME,
                            tokens_input=0, tokens_output=0, latency_ms=latency_ms,
                            error=f"API error {response.status_code}: {response.text[:200]}"
                        )
                    
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "") if data.get("choices") else ""
                    usage = data.get("usage", {})
                    
                    return AdapterResponse(
                        success=True, content=content, model=model, provider=self.PROVIDER_NAME,
                        tokens_input=usage.get("prompt_tokens", 0),
                        tokens_output=usage.get("completion_tokens", 0),
                        latency_ms=latency_ms, raw_response=data
                    )
            except Exception as e:
                logger.warning(f"Error on model {model}: {e}, trying next...")
                last_error = str(e)
                continue
                
        # All models failed
        latency_ms = int((time.time() - start_time) * 1000)
        return AdapterResponse(
            success=False, content="", model=self.model, provider=self.PROVIDER_NAME,
            tokens_input=0, tokens_output=0, latency_ms=latency_ms,
            error=f"All models failed. Last error: {last_error}"
        )
    
    async def validate_key(self) -> bool:
        """Validate Groq API key (200 OK or 429 Quota Exceeded = Valid)."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers=self._get_headers(),
                    json={"model": self.DEFAULT_MODEL, "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}
                )
                return response.status_code in (200, 429)
        except:
            return False
