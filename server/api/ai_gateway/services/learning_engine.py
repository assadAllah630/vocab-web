"""
Learning Engine Service - AI Gateway v2.0

Records outcomes and updates model health based on feedback.
Learns from every success and failure to improve future selection.

Key Features:
- Updates quota counters after each request
- Classifies errors and applies appropriate penalties
- Blocks problematic models temporarily or permanently
- Tracks statistics for analytics

Usage:
    from api.ai_gateway.services.learning_engine import learning_engine
    
    # After successful request
    learning_engine.record_success(instance, latency_ms=150, tokens_used=500)
    
    # After failed request
    learning_engine.record_failure(instance, error_type='QUOTA_EXCEEDED', error_message='429 Too Many Requests')
"""

import logging
from datetime import timedelta
from typing import Optional

from django.utils import timezone
from django.db import transaction
from django.db.models import F, Case, When, Value

from api.ai_gateway.models import ModelInstance, FailureLog, UserAPIKey

logger = logging.getLogger(__name__)


class LearningEngine:
    """
    Updates ModelInstance state after each request.
    Learns from failures to prevent future mistakes.
    """
    
    # Error type mappings for auto-classification
    ERROR_PATTERNS = {
        '429': 'QUOTA_EXCEEDED',
        'quota': 'QUOTA_EXCEEDED',
        'rate limit': 'RATE_LIMITED',
        'rate_limit': 'RATE_LIMITED',
        'invalid api key': 'INVALID_KEY',
        'invalid_api_key': 'INVALID_KEY',
        'api key not valid': 'INVALID_KEY',
        'model not found': 'MODEL_NOT_FOUND',
        'model_not_found': 'MODEL_NOT_FOUND',
        'does not exist': 'MODEL_NOT_FOUND',
        'content filter': 'CONTENT_FILTER',
        'blocked': 'CONTENT_FILTER',
        'safety': 'CONTENT_FILTER',
        'timeout': 'TIMEOUT',
        'timed out': 'TIMEOUT',
        '500': 'SERVER_ERROR',
        '502': 'SERVER_ERROR',
        '503': 'SERVER_ERROR',
        'internal server error': 'SERVER_ERROR',
        'service unavailable': 'SERVER_ERROR',
    }
    
    def record_success(
        self,
        instance: ModelInstance,
        latency_ms: int = 0,
        tokens_used: int = 0,
    ) -> None:
        """
        Record a successful API call.
        
        Updates:
        - Decrements remaining quota
        - Resets consecutive failures
        - Improves health score
        - Updates latency average
        """
        with transaction.atomic():
            # Lock the instance for update
            instance = ModelInstance.objects.select_for_update().get(pk=instance.pk)
            
            # Update quota
            instance.remaining_daily = max(0, instance.remaining_daily - 1)
            instance.remaining_minute = max(0, instance.remaining_minute - 1)
            if tokens_used > 0:
                instance.remaining_tokens_minute = max(0, instance.remaining_tokens_minute - tokens_used)
            
            # Update success metrics
            instance.total_requests += 1
            instance.total_successes += 1
            instance.last_success_at = timezone.now()
            instance.consecutive_failures = 0
            
            # Improve health (cap at 100)
            instance.health_score = min(100, instance.health_score + 2)
            
            # Update latency (exponential moving average)
            if latency_ms > 0:
                instance.avg_latency_ms = int(0.9 * instance.avg_latency_ms + 0.1 * latency_ms)
            
            # Recalculate confidence
            instance.confidence_score = self._calculate_confidence(instance)
            
            # Clear any blocks (in case it was a soft block)
            if instance.is_blocked and instance.block_until and instance.block_until < timezone.now():
                instance.is_blocked = False
                instance.block_until = None
                instance.block_reason = ''
            
            # Clear key-level failures on success
            if instance.api_key.consecutive_failures > 0:
                instance.api_key.consecutive_failures = 0
                instance.api_key.save(update_fields=['consecutive_failures'])
            
            instance.save()
            
            logger.debug(
                f"Recorded success for {instance.model.model_id}: "
                f"latency={latency_ms}ms, remaining_daily={instance.remaining_daily}"
            )
    
    def record_failure(
        self,
        instance: ModelInstance,
        error_type: str = 'UNKNOWN',
        error_message: str = '',
        error_code: str = '',
        tokens_attempted: int = 0,
        latency_ms: int = 0,
        request_type: str = 'text',
        retry_after_seconds: int = None,
    ) -> None:
        """
        Record a failed API call and apply appropriate penalties.
        """
        # Auto-classify error if not specified
        if error_type == 'UNKNOWN' or not error_type:
            error_type = self._classify_error(error_message, error_code)
        
        with transaction.atomic():
            instance = ModelInstance.objects.select_for_update().get(pk=instance.pk)
            
            # Always update request stats
            instance.total_requests += 1
            instance.total_failures += 1
            instance.consecutive_failures += 1
            instance.last_failure_at = timezone.now()
            instance.last_failure_reason = error_type
            
            # Update Key-Level Failures (for valid keys)
            if error_type != 'INVALID_KEY':
                instance.api_key.consecutive_failures += 1
                instance.api_key.save(update_fields=['consecutive_failures'])
            
            # Apply error-specific handling
            if error_type == 'QUOTA_EXCEEDED':
                self._handle_quota_exceeded(instance, retry_after_seconds)
            
            elif error_type == 'RATE_LIMITED':
                self._handle_rate_limited(instance)
            
            elif error_type == 'INVALID_KEY':
                self._handle_invalid_key(instance)
            
            elif error_type == 'MODEL_NOT_FOUND':
                self._handle_model_not_found(instance)
            
            elif error_type == 'CONTENT_FILTER':
                # Content was blocked, not model's fault
                instance.consecutive_failures = max(0, instance.consecutive_failures - 1)
                # Revert key failure increase for content filter
                instance.api_key.consecutive_failures = max(0, instance.api_key.consecutive_failures - 1)
                instance.api_key.save(update_fields=['consecutive_failures'])
            
            elif error_type == 'TIMEOUT':
                self._handle_timeout(instance, latency_ms)
            
            elif error_type == 'SERVER_ERROR':
                self._handle_server_error(instance)
            
            else:
                # Unknown error: moderate penalty
                instance.health_score = max(0, instance.health_score - 10)
            
            # Recalculate confidence
            instance.confidence_score = self._calculate_confidence(instance)
            
            instance.save()
            
            # Log failure for analytics
            FailureLog.objects.create(
                model_instance=instance,
                error_type=error_type,
                error_code=error_code,
                error_message=error_message[:2000],
                request_type=request_type,
                tokens_attempted=tokens_attempted,
                latency_ms=latency_ms,
            )
            
            logger.warning(
                f"Recorded failure for {instance.model.model_id}: "
                f"type={error_type}, blocked={instance.is_blocked}, "
                f"health={instance.health_score}"
            )

    def _classify_error(self, error_message: str, error_code: str = '') -> str:
        """Auto-classify error based on message patterns."""
        message_lower = (error_message + ' ' + error_code).lower()
        
        for pattern, error_type in self.ERROR_PATTERNS.items():
            if pattern in message_lower:
                return error_type
        
        return 'UNKNOWN'
    
    def _handle_quota_exceeded(self, instance: ModelInstance, retry_after_seconds: int = None) -> None:
        """
        Handle daily quota exceeded error with Provider-Aware Circuit Breaker.
        
        Strategy:
        1. If Retry-After provided -> Use it.
        2. If Gemini -> Reset at Midnight Pacific Time (UTC-7/8).
        3. Else -> Exponential Backoff (Probe).
        """
        now = timezone.now()
        provider = instance.api_key.provider
        
        # Strategy 1: Use Retry-After if provided
        if retry_after_seconds and retry_after_seconds > 0:
            block_duration = timedelta(seconds=min(retry_after_seconds, 86400))
            block_reason = f'Quota exceeded (retry in {retry_after_seconds}s)'
            log_msg = f"Blocked Key {instance.api_key.id} using Retry-After: {retry_after_seconds}s"
            block_until = now + block_duration
            
        elif provider == 'gemini':
            # Strategy 2: Gemini Fixed Reset (Midnight PT)
            # PT is UTC-7 (PDT) or UTC-8 (PST). To be safe, use UTC-7 (8 AM UTC).
            # If we are before 8 AM UTC, reset is today 8 AM. If after, tomorrow 8 AM.
            
            # Calculate next 8 AM UTC
            next_reset = now.replace(hour=8, minute=0, second=0, microsecond=0)
            if now >= next_reset:
                next_reset += timedelta(days=1)
                
            block_until = next_reset
            block_reason = 'Quota exceeded (resets at Midnight PT)'
            log_msg = f"Blocked Key {instance.api_key.id} until Midnight PT ({block_until.isoformat()})"
            
        else:
            # Strategy 3: Exponential backoff (Probe) for others
            backoff_hours = min(2 ** (instance.api_key.consecutive_failures), 24)
            block_duration = timedelta(hours=backoff_hours)
            block_reason = f'Quota exceeded (backoff: {backoff_hours}h)'
            log_msg = f"Blocked Key {instance.api_key.id} with exponential backoff: {backoff_hours}h"
            block_until = now + block_duration

        # CRITICAL: Quotas are Project-Level (share across models on the same key)
        # Block the KEY entity directly (migration complete)
        key = instance.api_key
        key.is_blocked = True
        key.block_until = block_until
        key.block_reason = block_reason
        # Also increment failures on the key if not already done
        # (Though record_failure does this, we ensure backoff logic used it)
        key.save(update_fields=['is_blocked', 'block_until', 'block_reason'])
        
        # We ALSO block the instances just to be safe (redundancy for old selectors)
        # But the primary source of truth is now the Key.
        updated_count = ModelInstance.objects.filter(api_key=key).update(
            remaining_daily=0,
            is_blocked=True,
            block_until=block_until,
            block_reason=block_reason,
            # Penalize health score (prevent rapid flapping)
            health_score=Case(
                When(health_score__gt=20, then=F('health_score') - 20),
                default=0,
                output_field=models.IntegerField()
            )
        )
        
        logger.info(f"{log_msg} -> Blocked Key {key.id} and {updated_count} models")
    
    def _handle_rate_limited(self, instance: ModelInstance) -> None:
        """Handle rate limit (minute quota) error."""
        instance.remaining_minute = 0
        instance.is_blocked = True
        instance.block_until = timezone.now() + timedelta(seconds=60)
        instance.block_reason = 'Rate limited (60s cooldown)'
        instance.health_score = max(0, instance.health_score - 5)
    
    def _handle_invalid_key(self, instance: ModelInstance) -> None:
        """Handle invalid API key error."""
        # Deactivate the key itself
        instance.api_key.is_active = False
        instance.api_key.save(update_fields=['is_active'])
        
        # Block all instances for this key
        ModelInstance.objects.filter(api_key=instance.api_key).update(
            is_blocked=True,
            block_reason='Invalid API key',
        )
        
        logger.error(
            f"Deactivated API key {instance.api_key.id} (invalid key error)"
        )
    
    def _handle_model_not_found(self, instance: ModelInstance) -> None:
        """Handle model not available error."""
        instance.is_blocked = True
        instance.block_reason = 'Model not available on this provider'
        # No time limit - needs manual unblock
        
        logger.warning(
            f"Blocked {instance.model.model_id} permanently (model not found)"
        )
    
    def _handle_timeout(self, instance: ModelInstance, latency_ms: int) -> None:
        """Handle request timeout error."""
        # Increase latency estimate significantly
        instance.avg_latency_ms = int(instance.avg_latency_ms * 1.5)
        instance.health_score = max(0, instance.health_score - 10)
        
        # If too many timeouts, temporary block
        if instance.consecutive_failures >= 3:
            instance.is_blocked = True
            instance.block_until = timezone.now() + timedelta(minutes=5)
            instance.block_reason = 'Multiple timeouts'
    
    def _handle_server_error(self, instance: ModelInstance) -> None:
        """Handle provider server error."""
        instance.health_score = max(0, instance.health_score - 15)
        
        # Block if too many consecutive failures
        if instance.consecutive_failures >= 3:
            instance.is_blocked = True
            instance.block_until = timezone.now() + timedelta(minutes=5)
            instance.block_reason = 'Multiple server errors'
    
    def _calculate_confidence(self, instance: ModelInstance) -> float:
        """Calculate confidence score based on current state."""
        # If blocked, confidence is 0
        if instance.is_blocked and (not instance.block_until or instance.block_until > timezone.now()):
            return 0.0
        
        # If no daily quota, confidence is 0
        if instance.remaining_daily <= 0:
            return 0.0
        
        # Base confidence from health
        confidence = instance.health_score / 100.0
        
        # Reduce for consecutive failures
        confidence *= max(0, 1 - (instance.consecutive_failures * 0.2))
        
        # Reduce for low quota
        if instance.remaining_daily < 10:
            confidence *= 0.5
        
        return max(0.0, min(1.0, confidence))
    
    def _get_quota_reset_time(self, instance: ModelInstance = None):
        """
        Get next quota reset time based on provider configuration.
        
        Handles:
        - 'fixed': Reset at specific hour UTC (e.g., midnight)
        - 'rolling': Reset 24 hours from first use each day
        - 'first_use': Reset approximately 24h after first daily use
        """
        now = timezone.now()
        
        if instance is None:
            # Fallback to midnight UTC
            tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            return tomorrow
        
        model = instance.model
        reset_type = getattr(model, 'quota_reset_type', 'fixed')
        reset_hour = getattr(model, 'quota_reset_hour', 0)
        
        if reset_type == 'rolling':
            # Rolling: Reset in 24 hours from now
            return now + timedelta(hours=24)
        
        elif reset_type == 'first_use':
            # First use: Reset approximately at the configured hour
            # If we're before the reset hour, reset today; otherwise tomorrow
            reset_today = now.replace(hour=reset_hour, minute=0, second=0, microsecond=0)
            
            if now < reset_today:
                return reset_today
            else:
                return reset_today + timedelta(days=1)
        
        else:  # 'fixed' or default
            # Fixed: Reset at specific hour UTC
            reset_today = now.replace(hour=reset_hour, minute=0, second=0, microsecond=0)
            
            if now < reset_today:
                return reset_today
            else:
                return reset_today + timedelta(days=1)
    
    # =========================================================================
    # MAINTENANCE METHODS (called by background jobs)
    # =========================================================================
    
    def refresh_blocked_instances(self) -> int:
        """
        Unblock instances whose block period has expired.
        Should be called every 10-30 seconds.
        
        Returns:
            Number of instances unblocked
        """
        unblocked = ModelInstance.objects.filter(
            is_blocked=True,
            block_until__lt=timezone.now()
        ).update(
            is_blocked=False,
            block_until=None,
            block_reason='',
        )
        
        if unblocked > 0:
            logger.info(f"Unblocked {unblocked} model instances (block expired)")
        
        return unblocked
    
    def reset_minute_quotas(self) -> int:
        """
        Reset minute-level quotas.
        Should be called every 60 seconds.
        
        Returns:
            Number of instances updated
        """
        updated = ModelInstance.objects.all().update(
            remaining_minute=F('minute_quota'),
            remaining_tokens_minute=F('tokens_per_minute'),
        )
        
        logger.debug(f"Reset minute quotas for {updated} instances")
        return updated
    
    def reset_daily_quotas(self) -> int:
        """
        Reset daily quotas and recover health scores.
        Should be called at midnight.
        
        Returns:
            Number of instances updated
        """
        # Reset quotas
        updated = ModelInstance.objects.all().update(
            remaining_daily=F('daily_quota'),
            remaining_minute=F('minute_quota'),
            remaining_tokens_minute=F('tokens_per_minute'),
        )
        
        # Recover unhealthy models (give them another chance)
        ModelInstance.objects.filter(health_score__lt=50).update(health_score=75)
        
        # Unblock quota-related blocks
        ModelInstance.objects.filter(
            is_blocked=True,
            block_reason__icontains='quota'
        ).update(
            is_blocked=False,
            block_until=None,
            block_reason='',
        )
        
        logger.info(f"Reset daily quotas for {updated} instances")
        return updated


# Singleton instance
learning_engine = LearningEngine()
