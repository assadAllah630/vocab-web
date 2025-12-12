import logging
import time
from typing import Optional, Dict, Any, List
import httpx
from .base import BaseAdapter, AdapterResponse

logger = logging.getLogger(__name__)


class OpenRouterAdapter(BaseAdapter):
    """
    OpenRouter API adapter. 
    Limits: 20 req/min, 10000/day
    
    Automatic fallback: If a model returns 429/404/503,
    automatically tries the next model in the fallback chain.
    """
    
    PROVIDER_NAME = "openrouter"
    DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free"
    BASE_URL = "https://openrouter.ai/api/v1"
    
    # Fallback chain - correct free model IDs from OpenRouter
    FALLBACK_MODELS = [
        "mistralai/mistral-7b-instruct:free",     # Fast & reliable
        "meta-llama/llama-3.3-70b-instruct:free", # Powerful Llama 3.3
        "qwen/qwen3-235b-a22b:free",              # Qwen 3 large
        "openai/gpt-oss-120b:free",               # GPT-OSS (supports reasoning)
        "openai/gpt-oss-20b:free",                # GPT-OSS smaller
        "tngtech/tng-r1t-chimera:free",           # Good for stories
    ]
    
    RATE_LIMIT_MINUTE = 20
    RATE_LIMIT_DAILY = 10000
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vocabmaster.app",
            "X-Title": "VocabMaster AI Gateway"
        }
    
    async def complete(self, messages: List[Dict[str, str]], max_tokens: int = 1024, temperature: float = 0.7, **kwargs) -> AdapterResponse:
        """Send completion request to OpenRouter with automatic model fallback."""
        
        # Build fallback chain
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
                    
                    # 429 = Rate limit, 503 = Overloaded, 404 = Model pulled
                    # 402 = Payment Required (No credits), 401/403 = Auth issue (Maybe model restricted)
                    if response.status_code in (429, 503, 404, 402, 401, 403):
                        logger.info(f"OpenRouter model {model} returned {response.status_code}, trying next...")
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
        """Validate key (200 OK or 429 Exceeded = Valid)"""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers=self._get_headers(),
                    json={"model": self.DEFAULT_MODEL, "messages": [{"role": "user", "content": "hi"}], "max_tokens": 5}
                )
                return response.status_code in (200, 429)
        except:
            return False
