"""
Cache Manager Service for AI Gateway.
Provides response caching to reduce API calls and latency.
"""

import json
import hashlib
import logging
from typing import Optional, Any, Dict, List

from ..utils.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Response cache using Redis.
    
    Key format: ai_cache:{sha256_hash}
    Value: JSON-serialized response
    TTL: 3600 seconds (1 hour)
    """
    
    DEFAULT_TTL = 3600  # 1 hour
    KEY_PREFIX = "ai_cache:"
    
    def __init__(self):
        self.redis = get_redis_client()
    
    def _generate_cache_key(
        self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        provider: Optional[str] = None
    ) -> str:
        """
        Generate a cache key from request parameters.
        
        Uses SHA256 hash of normalized request data.
        """
        # Normalize and serialize the request
        cache_data = {
            "messages": [
                {"role": m.get("role", ""), "content": m.get("content", "")}
                for m in messages
            ],
        }
        
        if model:
            cache_data["model"] = model
        if provider:
            cache_data["provider"] = provider
        
        # Sort keys for consistent hashing
        serialized = json.dumps(cache_data, sort_keys=True, ensure_ascii=False)
        hash_digest = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
        
        return f"{self.KEY_PREFIX}{hash_digest}"
    
    async def get(
        self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        provider: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached response if exists.
        
        Returns:
            Cached response dict, or None if not found
        """
        cache_key = self._generate_cache_key(messages, model, provider)
        
        try:
            cached = await self.redis.get(cache_key)
            if cached:
                logger.debug(f"Cache HIT for key {cache_key[:20]}...")
                return json.loads(cached)
            else:
                logger.debug(f"Cache MISS for key {cache_key[:20]}...")
                return None
        except Exception as e:
            logger.warning(f"Cache GET error: {e}")
            return None
    
    async def set(
        self, 
        messages: List[Dict[str, str]], 
        response: Dict[str, Any],
        model: Optional[str] = None,
        provider: Optional[str] = None,
        ttl: int = DEFAULT_TTL
    ) -> bool:
        """
        Cache a response.
        
        Args:
            messages: The request messages
            response: The response to cache
            model: Optional model name for key
            provider: Optional provider for key
            ttl: Time to live in seconds
            
        Returns:
            True if cached successfully
        """
        cache_key = self._generate_cache_key(messages, model, provider)
        
        try:
            serialized = json.dumps(response, ensure_ascii=False)
            await self.redis.set(cache_key, serialized, ex=ttl)
            logger.debug(f"Cached response for key {cache_key[:20]}...")
            return True
        except Exception as e:
            logger.warning(f"Cache SET error: {e}")
            return False
    
    async def invalidate(
        self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        provider: Optional[str] = None
    ) -> bool:
        """Invalidate a cached response."""
        cache_key = self._generate_cache_key(messages, model, provider)
        
        try:
            await self.redis.delete(cache_key)
            return True
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        Note: Limited stats without full Redis SCAN.
        """
        return {
            "enabled": True,
            "ttl_seconds": self.DEFAULT_TTL,
            "key_prefix": self.KEY_PREFIX,
        }


# Singleton
_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Get cache manager singleton."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager
