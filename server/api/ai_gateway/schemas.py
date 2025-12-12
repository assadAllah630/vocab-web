"""
Pydantic schemas for AI Gateway request/response validation.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ProviderEnum(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    HUGGINGFACE = "huggingface"
    OPENROUTER = "openrouter"
    COHERE = "cohere"
    DEEPINFRA = "deepinfra"


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    """A single message in the conversation."""
    role: MessageRole
    content: str


class ChatCompletionRequest(BaseModel):
    """Request body for chat completion endpoint."""
    messages: List[ChatMessage]
    stream: bool = False
    provider: Optional[ProviderEnum] = None  # Preferred provider, optional
    model: Optional[str] = None  # Specific model, optional
    max_tokens: Optional[int] = Field(default=1024, ge=1, le=8192)
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2)


class ChatCompletionChoice(BaseModel):
    """A single choice in the response."""
    index: int
    message: ChatMessage
    finish_reason: Optional[str] = None


class UsageStats(BaseModel):
    """Token usage statistics."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    """Response body for chat completion endpoint."""
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    provider: str
    choices: List[ChatCompletionChoice]
    usage: UsageStats
    cached: bool = False


# === API Key Management Schemas ===

class AddKeyRequest(BaseModel):
    """Request to add a new API key."""
    provider: ProviderEnum
    api_key: str = Field(..., min_length=10)
    nickname: Optional[str] = Field(default=None, max_length=100)
    daily_quota: Optional[int] = Field(default=None, ge=1)
    minute_quota: Optional[int] = Field(default=None, ge=1)


class KeyResponse(BaseModel):
    """Response for a single API key (without exposing the actual key)."""
    id: int
    provider: str
    nickname: Optional[str]
    daily_quota: int
    minute_quota: int
    requests_today: int
    requests_this_month: int
    avg_latency_ms: int
    error_count_last_hour: int
    health_score: int
    is_active: bool
    last_used_at: Optional[str]
    created_at: str


class KeyListResponse(BaseModel):
    """Response for listing user's keys."""
    keys: List[KeyResponse]
    total: int


# === Stats Schemas ===

class ProviderStats(BaseModel):
    """Stats for a single provider."""
    provider: str
    total_keys: int
    active_keys: int
    requests_today: int
    avg_health_score: float
    avg_latency_ms: float


class UserStatsResponse(BaseModel):
    """Overall stats for a user."""
    total_requests_today: int
    total_requests_month: int
    total_keys: int
    active_keys: int
    providers: List[ProviderStats]
    cache_hit_rate: float
    estimated_cost_saved: float
