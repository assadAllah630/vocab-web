"""
Redis client utilities for AI Gateway.
Provides async Redis operations for quota tracking, circuit breaker, and caching.
"""

import os
import json
import logging
from typing import Optional, Any
from datetime import datetime, timedelta
from functools import lru_cache

logger = logging.getLogger(__name__)

# Try to use async redis, fall back to sync with async wrapper
try:
    import redis.asyncio as aioredis
    ASYNC_REDIS_AVAILABLE = True
except ImportError:
    import redis
    ASYNC_REDIS_AVAILABLE = False
    logger.warning("redis.asyncio not available, using sync redis with async wrapper")


def get_redis_url() -> str:
    """Get Redis URL from environment or use default."""
    return os.environ.get('REDIS_URL', 'redis://localhost:6379/1')


class RedisClient:
    """
    Redis client wrapper for AI Gateway operations.
    Supports both async and sync operations.
    Falls back to in-memory storage if Redis is unavailable.
    """
    
    _instance: Optional['RedisClient'] = None
    
    def __init__(self):
        self._client = None
        self._fallback_storage = {}  # In-memory fallback
        self._use_fallback = False
        
    @classmethod
    def get_instance(cls) -> 'RedisClient':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def _get_client(self):
        """Get or create Redis client."""
        if self._client is None and not self._use_fallback:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    self._client = aioredis.from_url(
                        get_redis_url(),
                        encoding='utf-8',
                        decode_responses=True
                    )
                    # Test connection
                    await self._client.ping()
                else:
                    # Sync redis with manual async handling
                    self._client = redis.from_url(
                        get_redis_url(),
                        encoding='utf-8',
                        decode_responses=True
                    )
                    self._client.ping()
                logger.info("Redis connection established for AI Gateway")
            except Exception as e:
                logger.warning(f"Redis unavailable, using in-memory fallback: {e}")
                self._use_fallback = True
                self._client = None
        return self._client
    
    async def get(self, key: str) -> Optional[str]:
        """Get a value from Redis."""
        if self._use_fallback:
            return self._fallback_storage.get(key)
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    return await client.get(key)
                else:
                    return client.get(key)
            except Exception as e:
                logger.error(f"Redis GET error: {e}")
                return self._fallback_storage.get(key)
        return None
    
    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set a value in Redis with optional expiration (seconds)."""
        if self._use_fallback:
            self._fallback_storage[key] = value
            return True
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    await client.set(key, value, ex=ex)
                else:
                    client.set(key, value, ex=ex)
                return True
            except Exception as e:
                logger.error(f"Redis SET error: {e}")
                self._fallback_storage[key] = value
        return False
    
    async def incr(self, key: str) -> int:
        """Atomically increment a counter."""
        if self._use_fallback:
            current = int(self._fallback_storage.get(key, 0))
            self._fallback_storage[key] = str(current + 1)
            return current + 1
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    return await client.incr(key)
                else:
                    return client.incr(key)
            except Exception as e:
                logger.error(f"Redis INCR error: {e}")
                return 0
        return 0
    
    async def decr(self, key: str) -> int:
        """Atomically decrement a counter."""
        if self._use_fallback:
            current = int(self._fallback_storage.get(key, 0))
            new_val = max(0, current - 1)
            self._fallback_storage[key] = str(new_val)
            return new_val
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    return await client.decr(key)
                else:
                    return client.decr(key)
            except Exception as e:
                logger.error(f"Redis DECR error: {e}")
                return 0
        return 0
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on a key."""
        if self._use_fallback:
            return True  # No-op for fallback
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    await client.expire(key, seconds)
                else:
                    client.expire(key, seconds)
                return True
            except Exception as e:
                logger.error(f"Redis EXPIRE error: {e}")
        return False
    
    async def delete(self, *keys: str) -> int:
        """Delete one or more keys."""
        if self._use_fallback:
            count = 0
            for key in keys:
                if key in self._fallback_storage:
                    del self._fallback_storage[key]
                    count += 1
            return count
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    return await client.delete(*keys)
                else:
                    return client.delete(*keys)
            except Exception as e:
                logger.error(f"Redis DELETE error: {e}")
        return 0
    
    async def exists(self, key: str) -> bool:
        """Check if a key exists."""
        if self._use_fallback:
            return key in self._fallback_storage
        
        client = await self._get_client()
        if client:
            try:
                if ASYNC_REDIS_AVAILABLE:
                    return await client.exists(key) > 0
                else:
                    return client.exists(key) > 0
            except Exception as e:
                logger.error(f"Redis EXISTS error: {e}")
        return False
    
    async def setex(self, key: str, seconds: int, value: str) -> bool:
        """Set a value with expiration."""
        return await self.set(key, value, ex=seconds)


# Convenience function
def get_redis_client() -> RedisClient:
    """Get the Redis client singleton."""
    return RedisClient.get_instance()
