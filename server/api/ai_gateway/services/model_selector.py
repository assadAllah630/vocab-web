"""
Model Selector Service - AI Gateway v2.0

Intelligent model selection based on:
- Quota availability
- Health scores
- Recent failure history
- Capability matching

Usage:
    from api.ai_gateway.services.model_selector import ModelSelector
    
    selector = ModelSelector()
    result = selector.find_best_model(user=request.user, request_type='text')
    
    if result.model:
        # Use result.model.api_key and result.model.model
        pass
"""

import logging
from dataclasses import dataclass
from typing import List, Optional
from datetime import timedelta

from django.utils import timezone
from django.db.models import Q, F

from api.ai_gateway.models import ModelInstance, ModelDefinition, UserAPIKey

logger = logging.getLogger(__name__)


@dataclass
class ModelSelectionResult:
    """Result of model selection."""
    model: Optional[ModelInstance]
    confidence: float
    alternatives: List[ModelInstance]
    warning: Optional[str] = None
    
    @property
    def success(self) -> bool:
        return self.model is not None


class NoAvailableModelError(Exception):
    """Raised when no models are available for a request."""
    pass


class ModelSelector:
    """
    Selects the best available model for a request.
    
    Uses a scoring algorithm that considers:
    1. Quota availability (remaining daily/minute)
    2. Health score (recent reliability)
    3. Recency score (penalize recent failures)
    4. Success rate (historical performance)
    5. Failure penalty (consecutive failures)
    """
    
    # Minimum confidence to avoid warning
    HIGH_CONFIDENCE_THRESHOLD = 0.99
    
    # Weights for different factors
    QUOTA_WEIGHT = 0.25
    HEALTH_WEIGHT = 0.25
    RECENCY_WEIGHT = 0.20
    SUCCESS_RATE_WEIGHT = 0.15
    FAILURE_PENALTY_WEIGHT = 0.15
    
    def find_best_model(
        self,
        user,
        request_type: str = 'text',
        required_capabilities: List[str] = None,
        quality_tier: str = None,
        exclude_providers: List[str] = None,
        min_context_window: int = 0,
    ) -> ModelSelectionResult:
        """
        Find the best available model for a request.
        
        Args:
            user: Django User object
            request_type: 'text' or 'image'
            required_capabilities: List of required features
            quality_tier: 'low', 'medium', 'high', 'premium', or None for any
            exclude_providers: Providers to skip
            min_context_window: Minimum context window size
            
        Returns:
            ModelSelectionResult with best model and alternatives
        """
        required_capabilities = required_capabilities or []
        exclude_providers = exclude_providers or []
        
        # Step 1: Get eligible model instances
        eligible = self._get_eligible_instances(
            user=user,
            request_type=request_type,
            required_capabilities=required_capabilities,
            quality_tier=quality_tier,
            exclude_providers=exclude_providers,
            min_context_window=min_context_window,
        )
        
        if not eligible:
            # Try to auto-create instances for user's keys
            self._ensure_model_instances(user)
            
            eligible = self._get_eligible_instances(
                user=user,
                request_type=request_type,
                required_capabilities=required_capabilities,
                quality_tier=quality_tier,
                exclude_providers=exclude_providers,
                min_context_window=min_context_window,
            )
        
        if not eligible:
            logger.warning(f"No eligible models for user {user.id}, type={request_type}")
            return ModelSelectionResult(
                model=None,
                confidence=0.0,
                alternatives=[],
                warning="No models available. Add API keys or wait for quota reset."
            )
        
        # Step 2: Score each model
        scored_models = []
        for instance in eligible:
            score = self.calculate_availability_score(instance)
            if score > 0:
                scored_models.append((instance, score))
        
        if not scored_models:
            return ModelSelectionResult(
                model=None,
                confidence=0.0,
                alternatives=[],
                warning="All available models have exhausted quotas or are blocked."
            )
        
        # Step 3: Sort by score (highest first)
        scored_models.sort(key=lambda x: x[1], reverse=True)
        
        # Step 4: Return best model
        best_instance, best_score = scored_models[0]
        alternatives = [m for m, s in scored_models[1:5]]
        
        warning = None
        if best_score < self.HIGH_CONFIDENCE_THRESHOLD:
            warning = f"Best model has {best_score:.1%} confidence. Consider adding more API keys."
        
        logger.info(
            f"Selected model: {best_instance.model.model_id} "
            f"(confidence: {best_score:.3f}, provider: {best_instance.model.provider})"
        )
        
        return ModelSelectionResult(
            model=best_instance,
            confidence=best_score,
            alternatives=alternatives,
            warning=warning,
        )
    
    def calculate_availability_score(self, instance: ModelInstance) -> float:
        """
        Calculate probability (0.0-1.0) that this model will succeed.
        
        Formula:
        score = (quota × W1) + (health × W2) + (recency × W3) + (success_rate × W4) - (failure_penalty × W5)
        
        Returns:
            Float between 0.0 (unavailable) and 1.0 (definitely available)
        """
        # Check hard limits first
        if instance.is_blocked:
            if instance.block_until and instance.block_until > timezone.now():
                return 0.0
            # Block expired, should be available
        
        if instance.remaining_daily <= 0:
            return 0.0
        
        # Quota Score (0-1): How much quota headroom do we have?
        if instance.remaining_minute <= 0:
            quota_score = 0.3  # Might recover in next minute
        else:
            # Prefer models with more quota remaining
            quota_ratio = min(1.0, instance.remaining_daily / max(1, instance.daily_quota))
            minute_ratio = min(1.0, instance.remaining_minute / max(1, instance.minute_quota))
            quota_score = (quota_ratio * 0.7) + (minute_ratio * 0.3)
        
        # Health Score (0-1): Based on health_score field
        health_score = instance.health_score / 100.0
        
        # Recency Score (0-1): Penalize recent failures
        recency_score = 1.0
        if instance.last_failure_at:
            time_since_failure = (timezone.now() - instance.last_failure_at).total_seconds()
            if time_since_failure < 60:  # Failed in last minute
                recency_score = 0.2
            elif time_since_failure < 300:  # Failed in last 5 min
                recency_score = 0.5
            elif time_since_failure < 900:  # Failed in last 15 min
                recency_score = 0.8
            else:
                recency_score = 1.0
        
        # Success Rate (0-1): Historical performance
        if instance.total_requests >= 10:
            success_rate = instance.total_successes / instance.total_requests
        else:
            # Not enough data, assume good
            success_rate = 0.9
        
        # Failure Penalty (0-1): Consecutive failures
        # Each consecutive failure reduces score by 20%
        failure_penalty = min(1.0, instance.consecutive_failures * 0.2)
        
        # Calculate weighted score
        score = (
            (quota_score * self.QUOTA_WEIGHT) +
            (health_score * self.HEALTH_WEIGHT) +
            (recency_score * self.RECENCY_WEIGHT) +
            (success_rate * self.SUCCESS_RATE_WEIGHT) -
            (failure_penalty * self.FAILURE_PENALTY_WEIGHT)
        )
        
        # Clamp to 0-1
        return max(0.0, min(1.0, score))
    
    def _get_eligible_instances(
        self,
        user,
        request_type: str,
        required_capabilities: List[str],
        quality_tier: str,
        exclude_providers: List[str],
        min_context_window: int,
    ) -> List[ModelInstance]:
        """Get all model instances that could handle this request."""
        
        # Base query: user's active keys, not blocked
        queryset = ModelInstance.objects.select_related('api_key', 'model').filter(
            api_key__user=user,
            api_key__is_active=True,
            model__is_active=True,
        ).filter(
            Q(is_blocked=False) | Q(block_until__lt=timezone.now())
        )
        
        # Filter by request type
        if request_type == 'text':
            queryset = queryset.filter(model__is_text=True)
        elif request_type == 'image':
            queryset = queryset.filter(model__is_image=True)
        
        # Filter by capabilities
        if 'json_mode' in required_capabilities:
            queryset = queryset.filter(model__supports_json_mode=True)
        if 'function_calling' in required_capabilities:
            queryset = queryset.filter(model__supports_function_calling=True)
        if 'vision' in required_capabilities:
            queryset = queryset.filter(model__supports_vision=True)
        
        # Filter by quality tier
        if quality_tier:
            queryset = queryset.filter(model__quality_tier=quality_tier)
        
        # Exclude providers
        if exclude_providers:
            queryset = queryset.exclude(model__provider__in=exclude_providers)
        
        # Filter by context window
        if min_context_window > 0:
            queryset = queryset.filter(model__context_window__gte=min_context_window)
        
        # Order by confidence score (best first)
        queryset = queryset.order_by('-confidence_score', '-health_score')
        
        return list(queryset[:20])  # Limit for performance
    
    def _ensure_model_instances(self, user) -> int:
        """
        Auto-create ModelInstances for user's API keys.
        
        When a user adds a new API key, we need to create ModelInstance
        records for each model that provider supports.
        
        Returns:
            Number of instances created
        """
        created_count = 0
        
        # Get user's active keys
        keys = UserAPIKey.objects.filter(user=user, is_active=True)
        
        for key in keys:
            # Get models for this provider
            models = ModelDefinition.objects.filter(
                provider=key.provider,
                is_active=True
            )
            
            for model in models:
                instance, created = ModelInstance.objects.get_or_create(
                    api_key=key,
                    model=model,
                    defaults={
                        'daily_quota': model.default_daily_quota,
                        'remaining_daily': model.default_daily_quota,
                        'minute_quota': model.default_minute_quota,
                        'remaining_minute': model.default_minute_quota,
                        'tokens_per_minute': model.default_tokens_per_minute,
                        'remaining_tokens_minute': model.default_tokens_per_minute,
                    }
                )
                if created:
                    created_count += 1
                    logger.info(f"Created ModelInstance: {key.provider}/{model.model_id} for user {user.id}")
        
        return created_count


# Singleton instance
model_selector = ModelSelector()
