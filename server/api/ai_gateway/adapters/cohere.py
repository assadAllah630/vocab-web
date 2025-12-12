import logging
import time
from typing import Optional, Dict, Any, List
import httpx
from .base import BaseAdapter, AdapterResponse

logger = logging.getLogger(__name__)


class CohereAdapter(BaseAdapter):
    """
    Cohere API adapter. 
    Limits: 100 req/min, ~333/day (10k/month)
    
    Automatic fallback: If a model returns 429 (rate limit),
    automatically tries the next model in the fallback chain.
    """
    
    PROVIDER_NAME = "cohere"
    DEFAULT_MODEL = "command"
    BASE_URL = "https://api.cohere.ai/v1"
    
    # Fallback chain
    FALLBACK_MODELS = [
        "command",      # Powerful, default
        "command-nightly", # Latest
        "command-light", # Faster, cheaper
        "command-light-nightly"
    ]
    
    RATE_LIMIT_MINUTE = 100
    RATE_LIMIT_DAILY = 333
    
    def _format_messages_cohere(self, messages: List[Dict[str, str]]) -> tuple:
        preamble, chat_history, current_message = "", [], ""
        for i, msg in enumerate(messages):
            role, content = msg.get("role", "user"), msg.get("content", "")
            if role == "system":
                preamble = content
            elif i == len(messages) - 1 and role == "user":
                current_message = content
            else:
                chat_history.append({"role": "CHATBOT" if role == "assistant" else "USER", "message": content})
        if not current_message and messages:
            current_message = messages[-1].get("content", "")
        return preamble, current_message, chat_history
    
    async def complete(self, messages: List[Dict[str, str]], max_tokens: int = 1024, temperature: float = 0.7, **kwargs) -> AdapterResponse:
        """Send completion request to Cohere with automatic model fallback."""
        
        # Build fallback chain
        models_to_try = [self.model]
        for m in self.FALLBACK_MODELS:
            if m != self.model and m not in models_to_try:
                models_to_try.append(m)
                
        last_error = None
        start_time = time.time()
        
        preamble, message, chat_history = self._format_messages_cohere(messages)
        
        for model in models_to_try:
            url = f"{self.BASE_URL}/chat"
            payload = {
                "model": model, 
                "message": message, 
                "max_tokens": max_tokens, 
                "temperature": temperature
            }
            if preamble: payload["preamble"] = preamble
            if chat_history: payload["chat_history"] = chat_history
            
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(url, headers=self._get_headers(), json=payload)
                    latency_ms = int((time.time() - start_time) * 1000)
                    
                    # 429 = Rate limit
                    if response.status_code in (429, 503, 404):
                        logger.info(f"Cohere model {model} returned {response.status_code}, trying next...")
                        last_error = f"Model {model}: {response.status_code}"
                        continue
                    
                    if response.status_code != 200:
                        return AdapterResponse(
                            success=False, content="", model=model, provider=self.PROVIDER_NAME,
                            tokens_input=0, tokens_output=0, latency_ms=latency_ms,
                            error=f"API error {response.status_code}: {response.text[:200]}"
                        )
                    
                    data = response.json()
                    content = data.get("text", "")
                    meta = data.get("meta", {}).get("tokens", {})
                    
                    return AdapterResponse(
                        success=True, content=content, model=model, provider=self.PROVIDER_NAME,
                        tokens_input=meta.get("input_tokens", 0),
                        tokens_output=meta.get("output_tokens", 0),
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
                    f"{self.BASE_URL}/chat",
                    headers=self._get_headers(),
                    json={"model": self.DEFAULT_MODEL, "message": "hi", "max_tokens": 5}
                )
                return response.status_code in (200, 429)
        except:
            return False
