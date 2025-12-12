"""
Base Adapter for AI Providers.
Defines the interface that all provider adapters must implement.
"""

import logging
import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass 
class AdapterResponse:
    """Standardized response from any adapter."""
    success: bool
    content: str
    model: str
    provider: str
    tokens_input: int
    tokens_output: int
    latency_ms: int
    error: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None
    retry_after_seconds: Optional[int] = None  # From Retry-After header on 429


class BaseAdapter(ABC):
    """
    Abstract base class for AI provider adapters.
    
    All adapters must implement:
    - complete(): Buffered completion
    - validate_key(): Test if the API key is valid
    """
    
    # Override in subclasses
    PROVIDER_NAME: str = "base"
    DEFAULT_MODEL: str = ""
    BASE_URL: str = ""
    
    # Rate limits (for reference)
    RATE_LIMIT_MINUTE: int = 10
    RATE_LIMIT_DAILY: int = 1000
    
    def __init__(self, api_key: str, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model or self.DEFAULT_MODEL
    
    @abstractmethod
    async def complete(
        self, 
        messages: List[Dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.7,
        **kwargs
    ) -> AdapterResponse:
        """
        Send a chat completion request and return the full response.
        
        Args:
            messages: List of messages with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-2)
            
        Returns:
            AdapterResponse with the completion
        """
        pass
    
    @abstractmethod
    async def validate_key(self) -> tuple[bool, str]:
        """
        Validate that the API key is working.
        
        Returns:
            (is_valid, message)
        """
        pass
    
    def _format_messages_openai(
        self, 
        messages: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """Format messages in OpenAI style (most common)."""
        return [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in messages
        ]
    
    def _get_headers(self) -> Dict[str, str]:
        """Get default headers with auth. Override in subclasses."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
