"""
AI Gateway Module for Multi-Provider AI API Management

This module provides intelligent routing and management of multiple AI provider API keys
with automatic quota tracking, smart key selection, circuit breaking, and caching.
"""

# Note: Models imported lazily to avoid circular imports at app load time
# Use: from api.ai_gateway.models import UserAPIKey, UsageLog, DailyAnalytics

__all__ = [
    'UserAPIKey',
    'UsageLog', 
    'DailyAnalytics',
]


def __getattr__(name):
    """Lazy import for models."""
    if name in ('UserAPIKey', 'UsageLog', 'DailyAnalytics'):
        from .models import UserAPIKey, UsageLog, DailyAnalytics
        return locals()[name]
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
