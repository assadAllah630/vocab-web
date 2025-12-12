"""
Quota Tracker Service for AI Gateway.
Manages rate limiting using Redis with atomic operations.
"""

import logging
from datetime import datetime, date
from typing import Optional, Tuple

from ..utils.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class QuotaTracker:
    """
    Tracks API request quotas per key using Redis.
    
    Redis Keys:
    - quota:minute:{key_id} - Requests in current minute (TTL: 60s)
    - quota:daily:{key_id}:{YYYY-MM-DD} - Requests today (TTL: 86400s)
    - quota:concurrent:{key_id} - Current concurrent requests
    """
    
    MINUTE_TTL = 60
    DAILY_TTL = 86400
    
    def __init__(self):
        self.redis = get_redis_client()
    
    def _minute_key(self, key_id: int) -> str:
        return f"quota:minute:{key_id}"
    
    def _daily_key(self, key_id: int, dt: Optional[date] = None) -> str:
        if dt is None:
            dt = date.today()
        return f"quota:daily:{key_id}:{dt.isoformat()}"
    
    def _concurrent_key(self, key_id: int) -> str:
        return f"quota:concurrent:{key_id}"
    
    async def check_and_reserve(
        self, 
        key_id: int, 
        minute_limit: int, 
        daily_limit: int
    ) -> Tuple[bool, str]:
        """
        Check if request can proceed and atomically reserve quota.
        
        Returns:
            Tuple of (allowed: bool, reason: str)
        """
        # Check minute quota
        minute_key = self._minute_key(key_id)
        current_minute = await self.redis.get(minute_key)
        current_minute = int(current_minute) if current_minute else 0
        
        if current_minute >= minute_limit:
            return False, f"Minute quota exceeded ({current_minute}/{minute_limit})"
        
        # Check daily quota
        daily_key = self._daily_key(key_id)
        current_daily = await self.redis.get(daily_key)
        current_daily = int(current_daily) if current_daily else 0
        
        if current_daily >= daily_limit:
            return False, f"Daily quota exceeded ({current_daily}/{daily_limit})"
        
        # Reserve quota atomically
        new_minute = await self.redis.incr(minute_key)
        if new_minute == 1:
            await self.redis.expire(minute_key, self.MINUTE_TTL)
        
        new_daily = await self.redis.incr(daily_key)
        if new_daily == 1:
            await self.redis.expire(daily_key, self.DAILY_TTL)
        
        return True, "OK"
    
    async def release_quota(self, key_id: int):
        """
        Release reserved quota (on request failure/cancellation).
        Call this if request fails before reaching the provider.
        """
        minute_key = self._minute_key(key_id)
        daily_key = self._daily_key(key_id)
        
        await self.redis.decr(minute_key)
        await self.redis.decr(daily_key)
    
    async def get_usage(self, key_id: int) -> dict:
        """Get current usage stats for a key."""
        minute_key = self._minute_key(key_id)
        daily_key = self._daily_key(key_id)
        
        minute_usage = await self.redis.get(minute_key)
        daily_usage = await self.redis.get(daily_key)
        
        return {
            'minute': int(minute_usage) if minute_usage else 0,
            'daily': int(daily_usage) if daily_usage else 0,
        }
    
    async def acquire_concurrent(self, key_id: int, max_concurrent: int = 10) -> bool:
        """
        Try to acquire a concurrent request slot.
        
        Returns:
            True if slot acquired, False if at max concurrent requests
        """
        key = self._concurrent_key(key_id)
        current = await self.redis.incr(key)
        
        if current > max_concurrent:
            await self.redis.decr(key)
            return False
        
        return True
    
    async def release_concurrent(self, key_id: int):
        """Release a concurrent request slot."""
        key = self._concurrent_key(key_id)
        await self.redis.decr(key)
    
    async def reset_daily(self, key_id: int, dt: Optional[date] = None):
        """Reset daily quota for a key (called at midnight)."""
        daily_key = self._daily_key(key_id, dt)
        await self.redis.delete(daily_key)
    
    async def get_quota_remaining(
        self, 
        key_id: int, 
        minute_limit: int, 
        daily_limit: int
    ) -> dict:
        """Get remaining quota for a key."""
        usage = await self.get_usage(key_id)
        
        return {
            'minute_remaining': max(0, minute_limit - usage['minute']),
            'daily_remaining': max(0, daily_limit - usage['daily']),
            'minute_total': minute_limit,
            'daily_total': daily_limit,
        }


# Singleton instance
_quota_tracker: Optional[QuotaTracker] = None


def get_quota_tracker() -> QuotaTracker:
    """Get the quota tracker singleton."""
    global _quota_tracker
    if _quota_tracker is None:
        _quota_tracker = QuotaTracker()
    return _quota_tracker
