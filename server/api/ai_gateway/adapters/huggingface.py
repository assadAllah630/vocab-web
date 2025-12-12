import logging
import time
from typing import Optional, Dict, Any, List
import httpx
from .base import BaseAdapter, AdapterResponse

logger = logging.getLogger(__name__)


class HuggingFaceAdapter(BaseAdapter):
    """
    HuggingFace Inference API adapter. 
    Limits: 100 req/min
    
    Automatic fallback: If a model returns 503 (loading) or 429 (rate limit),
    automatically tries the next model in the fallback chain.
    """
    
    PROVIDER_NAME = "huggingface"
    DEFAULT_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
    BASE_URL = "https://api-inference.huggingface.co/models"
    
    # Fallback chain for reliability
    FALLBACK_MODELS = [
        "meta-llama/Llama-3.2-3B-Instruct",      # Fast & Good
        "mistralai/Mistral-7B-Instruct-v0.3",    # Reliable
        "google/flan-t5-xxl",                    # Default fallback
        "bigscience/bloom"                       # Last resort
    ]
    
    RATE_LIMIT_MINUTE = 100
    RATE_LIMIT_DAILY = 100000
    
    def _format_prompt(self, messages: List[Dict[str, str]]) -> str:
        parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                parts.append(f"System: {content}")
            elif role == "assistant":
                parts.append(f"Assistant: {content}")
            else:
                parts.append(f"User: {content}")
        parts.append("Assistant: ")
        return "\n\n".join(parts)
    
    async def complete(self, messages: List[Dict[str, str]], max_tokens: int = 1024, temperature: float = 0.7, **kwargs) -> AdapterResponse:
        """Send completion request to HuggingFace with automatic model fallback."""
        
        # Build fallback chain
        models_to_try = [self.model]
        for m in self.FALLBACK_MODELS:
            if m != self.model and m not in models_to_try:
                models_to_try.append(m)
                
        last_error = None
        start_time = time.time()
        
        for model in models_to_try:
            url = f"{self.BASE_URL}/{model}"
            prompt = self._format_prompt(messages)
            payload = {
                "inputs": prompt, 
                "parameters": {
                    "max_new_tokens": max_tokens, 
                    "temperature": temperature, 
                    "return_full_text": False
                }
            }
            
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(url, headers=self._get_headers(), json=payload)
                    latency_ms = int((time.time() - start_time) * 1000)
                    
                    # 503 = Model loading (common on free tier), 429 = Rate limit
                    if response.status_code in (503, 429, 404):
                        logger.info(f"HuggingFace model {model} returned {response.status_code}, trying next...")
                        last_error = f"Model {model}: {response.status_code}"
                        continue
                    
                    if response.status_code != 200:
                        return AdapterResponse(
                            success=False, content="", model=model, provider=self.PROVIDER_NAME,
                            tokens_input=0, tokens_output=0, latency_ms=latency_ms,
                            error=f"API error {response.status_code}: {response.text[:200]}"
                        )
                    
                    data = response.json()
                    content = data[0].get("generated_text", "") if isinstance(data, list) and data else data.get("generated_text", "") if isinstance(data, dict) else ""
                    
                    return AdapterResponse(
                        success=True, content=content, model=model, provider=self.PROVIDER_NAME,
                        tokens_input=int(len(prompt.split()) * 1.3),
                        tokens_output=int(len(content.split()) * 1.3),
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
        """Validate key (200 OK or 503 Loading = Valid)"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{self.BASE_URL}/{self.DEFAULT_MODEL}",
                    headers=self._get_headers(),
                    json={"inputs": "Hello", "parameters": {"max_new_tokens": 5}}
                )
                return response.status_code in [200, 503, 429]
        except:
            return False
