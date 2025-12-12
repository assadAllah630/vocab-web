"""
Circuit Breaker Service for AI Gateway.
Prevents cascading failures by tracking provider health.
"""

import logging
import time
from enum import Enum
from typing import Optional
from dataclasses import dataclass

from ..utils.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Blocking requests
    HALF_OPEN = "half_open"  # Testing if recovered


@dataclass
class CircuitStatus:
    state: CircuitState
    failure_count: int
    last_failure_time: Optional[float]
    last_success_time: Optional[float]


class CircuitBreaker:
    """
    Circuit breaker for AI providers.
    
    States:
    - CLOSED: Normal operation, requests go through
    - OPEN: Provider is down, requests fail fast (after 5 failures in 1 min)
    - HALF_OPEN: Testing recovery after 30s timeout
    
    Redis Keys:
    - circuit:{provider}:state - Current state
    - circuit:{provider}:failures - Failure count in window
    - circuit:{provider}:last_failure - Timestamp of last failure
    - circuit:{provider}:last_success - Timestamp of last success
    """
    
    FAILURE_THRESHOLD = 5  # Failures to trip circuit
    FAILURE_WINDOW = 60    # Seconds to count failures
    RECOVERY_TIMEOUT = 30  # Seconds before trying again
    
    def __init__(self):
        self.redis = get_redis_client()
    
    def _state_key(self, provider: str) -> str:
        return f"circuit:{provider}:state"
    
    def _failures_key(self, provider: str) -> str:
        return f"circuit:{provider}:failures"
    
    def _last_failure_key(self, provider: str) -> str:
        return f"circuit:{provider}:last_failure"
    
    def _last_success_key(self, provider: str) -> str:
        return f"circuit:{provider}:last_success"
    
    async def get_state(self, provider: str) -> CircuitState:
        """Get current circuit state for a provider."""
        state = await self.redis.get(self._state_key(provider))
        
        if state == CircuitState.OPEN.value:
            # Check if recovery timeout has passed
            last_failure = await self.redis.get(self._last_failure_key(provider))
            if last_failure:
                elapsed = time.time() - float(last_failure)
                if elapsed >= self.RECOVERY_TIMEOUT:
                    # Transition to half-open
                    await self.redis.set(
                        self._state_key(provider), 
                        CircuitState.HALF_OPEN.value,
                        ex=self.FAILURE_WINDOW
                    )
                    logger.info(f"Circuit breaker for {provider} transitioning to HALF_OPEN")
                    return CircuitState.HALF_OPEN
            return CircuitState.OPEN
        
        if state == CircuitState.HALF_OPEN.value:
            return CircuitState.HALF_OPEN
        
        return CircuitState.CLOSED
    
    async def is_available(self, provider: str) -> bool:
        """Check if provider is available (circuit not open)."""
        state = await self.get_state(provider)
        return state != CircuitState.OPEN
    
    async def record_success(self, provider: str):
        """Record a successful request - reset circuit if was open."""
        state = await self.get_state(provider)
        
        # Reset on success
        await self.redis.set(self._state_key(provider), CircuitState.CLOSED.value)
        await self.redis.set(self._failures_key(provider), "0", ex=self.FAILURE_WINDOW)
        await self.redis.set(self._last_success_key(provider), str(time.time()))
        
        if state != CircuitState.CLOSED:
            logger.info(f"Circuit breaker for {provider} reset to CLOSED after success")
    
    async def record_failure(self, provider: str) -> CircuitState:
        """
        Record a failed request.
        
        Returns:
            New circuit state after recording failure
        """
        now = time.time()
        
        # Increment failure count
        failures = await self.redis.incr(self._failures_key(provider))
        await self.redis.expire(self._failures_key(provider), self.FAILURE_WINDOW)
        await self.redis.set(self._last_failure_key(provider), str(now))
        
        current_state = await self.get_state(provider)
        
        # Trip circuit if threshold exceeded
        if failures >= self.FAILURE_THRESHOLD:
            await self.redis.set(
                self._state_key(provider), 
                CircuitState.OPEN.value,
                ex=self.FAILURE_WINDOW + self.RECOVERY_TIMEOUT
            )
            logger.warning(
                f"Circuit breaker for {provider} OPENED after {failures} failures"
            )
            return CircuitState.OPEN
        
        # If was half-open, single failure re-opens
        if current_state == CircuitState.HALF_OPEN:
            await self.redis.set(
                self._state_key(provider), 
                CircuitState.OPEN.value,
                ex=self.FAILURE_WINDOW + self.RECOVERY_TIMEOUT
            )
            logger.warning(
                f"Circuit breaker for {provider} re-OPENED from HALF_OPEN"
            )
            return CircuitState.OPEN
        
        return current_state
    
    async def get_status(self, provider: str) -> CircuitStatus:
        """Get full circuit status for monitoring."""
        state = await self.get_state(provider)
        
        failures = await self.redis.get(self._failures_key(provider))
        last_failure = await self.redis.get(self._last_failure_key(provider))
        last_success = await self.redis.get(self._last_success_key(provider))
        
        return CircuitStatus(
            state=state,
            failure_count=int(failures) if failures else 0,
            last_failure_time=float(last_failure) if last_failure else None,
            last_success_time=float(last_success) if last_success else None,
        )
    
    async def force_open(self, provider: str):
        """Manually open circuit (for emergencies)."""
        await self.redis.set(
            self._state_key(provider), 
            CircuitState.OPEN.value,
            ex=self.FAILURE_WINDOW + self.RECOVERY_TIMEOUT
        )
        await self.redis.set(self._last_failure_key(provider), str(time.time()))
        logger.warning(f"Circuit breaker for {provider} manually OPENED")
    
    async def force_close(self, provider: str):
        """Manually close circuit (for recovery)."""
        await self.redis.set(self._state_key(provider), CircuitState.CLOSED.value)
        await self.redis.set(self._failures_key(provider), "0")
        logger.info(f"Circuit breaker for {provider} manually CLOSED")


# Singleton
_circuit_breaker: Optional[CircuitBreaker] = None


def get_circuit_breaker() -> CircuitBreaker:
    """Get circuit breaker singleton."""
    global _circuit_breaker
    if _circuit_breaker is None:
        _circuit_breaker = CircuitBreaker()
    return _circuit_breaker
