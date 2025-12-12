"""
Smart Key Selector Service for AI Gateway.
Implements scoring algorithm to select the best API key for each request.
"""

import logging
from typing import Optional, List, Tuple
from dataclasses import dataclass
from django.db.models import QuerySet

from ..models import UserAPIKey
from ..utils.encryption import decrypt_api_key
from .quota_tracker import get_quota_tracker
from .circuit_breaker import get_circuit_breaker, CircuitState

logger = logging.getLogger(__name__)


@dataclass
class ScoredKey:
    """A key with its calculated score and metadata."""
    key: UserAPIKey
    score: float
    decrypted_key: str
    quota_remaining_daily: int
    quota_remaining_minute: int


class KeySelector:
    """
    Intelligent key selection based on multiple factors.
    
    Score = (quota_remaining/quota_total × 1000) 
          + (1000 - avg_latency_ms) 
          - (error_count_hour × 50) 
          + (health_score × 5)
    
    Higher score = better key
    """
    
    # Weights for scoring
    QUOTA_WEIGHT = 1000  # Max contribution from quota
    LATENCY_WEIGHT = 1000  # Max contribution from latency (lower is better)
    ERROR_PENALTY = 50  # Penalty per error
    HEALTH_WEIGHT = 5  # Multiplier for health score (0-100 → 0-500)
    
    def __init__(self):
        self.quota_tracker = get_quota_tracker()
        self.circuit_breaker = get_circuit_breaker()
    
    def _calculate_score(
        self, 
        key: UserAPIKey, 
        quota_remaining: int, 
        quota_total: int
    ) -> float:
        """
        Calculate key score based on multiple factors.
        
        Formula:
        Score = (quota_remaining/quota_total × 1000) 
              + (1000 - avg_latency_ms) 
              - (error_count_hour × 50) 
              + (health_score × 5)
        """
        # Quota score: 0-1000 based on remaining quota percentage
        quota_ratio = quota_remaining / max(quota_total, 1)
        quota_score = quota_ratio * self.QUOTA_WEIGHT
        
        # Latency score: 0-1000, lower latency is better
        # Clamp latency to 0-1000ms range
        clamped_latency = min(max(key.avg_latency_ms, 0), 1000)
        latency_score = self.LATENCY_WEIGHT - clamped_latency
        
        # Error penalty: reduce score for recent errors
        error_penalty = key.error_count_last_hour * self.ERROR_PENALTY
        
        # Health bonus: 0-500 based on health score (0-100)
        health_bonus = key.health_score * self.HEALTH_WEIGHT
        
        total_score = quota_score + latency_score - error_penalty + health_bonus
        
        return max(0, total_score)  # Ensure non-negative
    
    async def select_best_key(
        self, 
        user_id: int, 
        provider: Optional[str] = None,
        exclude_key_ids: Optional[List[int]] = None
    ) -> Optional[ScoredKey]:
        """
        Select the best available API key for a user.
        
        Args:
            user_id: The user's ID
            provider: Optional specific provider to filter by
            exclude_key_ids: Keys to exclude (e.g., already tried)
            
        Returns:
            ScoredKey with the best key, or None if no keys available
        """
        # Build query for user's active keys
        queryset = UserAPIKey.objects.filter(
            user_id=user_id,
            is_active=True
        )
        
        if provider:
            queryset = queryset.filter(provider=provider)
        
        if exclude_key_ids:
            queryset = queryset.exclude(id__in=exclude_key_ids)
        
        # Get all candidate keys
        keys = list(queryset.order_by('-health_score', 'avg_latency_ms'))
        
        if not keys:
            logger.warning(f"No active keys found for user {user_id}, provider={provider}")
            return None
        
        scored_keys: List[Tuple[ScoredKey, float]] = []
        
        for key in keys:
            # Check circuit breaker
            if not await self.circuit_breaker.is_available(key.provider):
                logger.debug(f"Skipping key {key.id} - circuit open for {key.provider}")
                continue
            
            # Get quota usage
            quota = await self.quota_tracker.get_quota_remaining(
                key.id,
                key.minute_quota,
                key.daily_quota
            )
            
            # Skip if quota exhausted
            if quota['minute_remaining'] <= 0:
                logger.debug(f"Skipping key {key.id} - minute quota exhausted")
                continue
            
            if quota['daily_remaining'] <= 0:
                logger.debug(f"Skipping key {key.id} - daily quota exhausted")
                continue
            
            # Calculate score using daily remaining as primary metric
            score = self._calculate_score(
                key,
                quota['daily_remaining'],
                key.daily_quota
            )
            
            # Decrypt the API key
            try:
                decrypted = decrypt_api_key(key.api_key_encrypted)
            except Exception as e:
                logger.error(f"Failed to decrypt key {key.id}: {e}")
                continue
            
            scored_key = ScoredKey(
                key=key,
                score=score,
                decrypted_key=decrypted,
                quota_remaining_daily=quota['daily_remaining'],
                quota_remaining_minute=quota['minute_remaining']
            )
            
            scored_keys.append((scored_key, score))
        
        if not scored_keys:
            logger.warning(f"No available keys for user {user_id} after filtering")
            return None
        
        # Sort by score descending and return best
        scored_keys.sort(key=lambda x: x[1], reverse=True)
        best = scored_keys[0][0]
        
        logger.debug(
            f"Selected key {best.key.id} ({best.key.provider}) with score {best.score:.1f}"
        )
        
        return best
    
    async def get_fallback_chain(
        self, 
        user_id: int,
        preferred_provider: Optional[str] = None,
        max_keys: int = 5
    ) -> List[ScoredKey]:
        """
        Get an ordered list of keys to try as fallback chain.
        
        Args:
            user_id: The user's ID
            preferred_provider: Provider to try first
            max_keys: Maximum number of keys to return
            
        Returns:
            List of ScoredKeys ordered by preference
        """
        chain: List[ScoredKey] = []
        exclude_ids: List[int] = []
        
        # First, try preferred provider if specified
        if preferred_provider:
            key = await self.select_best_key(
                user_id, 
                provider=preferred_provider,
                exclude_key_ids=exclude_ids
            )
            if key:
                chain.append(key)
                exclude_ids.append(key.key.id)
        
        # Fill remaining slots with best available keys from any provider
        while len(chain) < max_keys:
            key = await self.select_best_key(
                user_id,
                exclude_key_ids=exclude_ids
            )
            if not key:
                break
            
            chain.append(key)
            exclude_ids.append(key.key.id)
        
        return chain
    
    async def get_provider_keys(
        self,
        user_id: int,
        provider: str
    ) -> List[ScoredKey]:
        """
        Get all available keys for a specific provider, sorted by score.
        
        Useful for debugging or showing key stats to user.
        """
        keys = []
        exclude_ids = []
        
        while True:
            key = await self.select_best_key(
                user_id,
                provider=provider,
                exclude_key_ids=exclude_ids
            )
            if not key:
                break
            
            keys.append(key)
            exclude_ids.append(key.key.id)
        
        return keys


# Singleton
_key_selector: Optional[KeySelector] = None


def get_key_selector() -> KeySelector:
    """Get key selector singleton."""
    global _key_selector
    if _key_selector is None:
        _key_selector = KeySelector()
    return _key_selector
