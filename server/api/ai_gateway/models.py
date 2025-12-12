"""
Database Models for AI Gateway

Stores encrypted API keys, usage logs, and analytics data.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserAPIKey(models.Model):
    """
    User's API keys for various AI providers.
    Users can add unlimited keys per provider.
    Keys are encrypted using Fernet symmetric encryption.
    """
    
    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('groq', 'Groq'),
        ('huggingface', 'HuggingFace'),
        ('openrouter', 'OpenRouter'),
        ('cohere', 'Cohere'),
        ('deepinfra', 'DeepInfra'),
    ]
    
    # Default rate limits per provider (requests)
    PROVIDER_LIMITS = {
        'gemini': {'minute': 15, 'daily': 1500},
        'groq': {'minute': 30, 'daily': 14400},
        'huggingface': {'minute': 100, 'daily': 100000},  # Effectively unlimited
        'openrouter': {'minute': 20, 'daily': 10000},
        'cohere': {'minute': 100, 'daily': 10000},  # 10k/month, simplified to daily
        'deepinfra': {'minute': 60, 'daily': 20000},
    }
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_api_keys')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, db_index=True)
    api_key_encrypted = models.TextField(help_text="Fernet-encrypted API key")
    key_nickname = models.CharField(max_length=100, blank=True, help_text="User-friendly name for this key")
    
    # Quota settings (can be customized per key)
    daily_quota = models.IntegerField(default=1000, help_text="Max requests per day")
    minute_quota = models.IntegerField(default=15, help_text="Max requests per minute")
    
    # Real-time counters (updated atomically via Redis, synced to DB)
    requests_today = models.IntegerField(default=0)
    tokens_used_today = models.IntegerField(default=0)
    requests_this_month = models.IntegerField(default=0)
    tokens_used_month = models.IntegerField(default=0)
    requests_last_minute = models.IntegerField(default=0)
    
    # Performance metrics
    avg_latency_ms = models.IntegerField(default=500)
    error_count_last_hour = models.IntegerField(default=0)
    health_score = models.IntegerField(default=100, help_text="0-100, higher is healthier")
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_health_check = models.DateTimeField(null=True, blank=True)
    consecutive_failures = models.IntegerField(default=0)
    
    # Circuit Breaker (Key-Level Blocking)
    is_blocked = models.BooleanField(default=False, db_index=True)
    block_until = models.DateTimeField(null=True, blank=True)
    block_reason = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-health_score', '-created_at']
        indexes = [
            models.Index(fields=['user', 'provider', 'is_active']),
            models.Index(fields=['user', 'is_active', '-health_score']),
            models.Index(fields=['provider', 'is_active']),
        ]
        verbose_name = "User API Key"
        verbose_name_plural = "User API Keys"
    
    def __str__(self):
        nickname = self.key_nickname or f"Key {self.id}"
        return f"{self.user.username} - {self.provider} - {nickname}"
    
    def get_default_limits(self):
        """Get default rate limits for this key's provider."""
        return self.PROVIDER_LIMITS.get(self.provider, {'minute': 10, 'daily': 1000})
    
    def save(self, *args, **kwargs):
        # Set default quotas based on provider if not set
        if not self.pk:  # New key
            limits = self.get_default_limits()
            if self.daily_quota == 1000:  # Default value, update to provider default
                self.daily_quota = limits['daily']
            if self.minute_quota == 15:  # Default value
                self.minute_quota = limits['minute']
        super().save(*args, **kwargs)


class UsageLog(models.Model):
    """
    Log each API request for analytics and debugging.
    """
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('error', 'Error'),
        ('quota_exceeded', 'Quota Exceeded'),
        ('timeout', 'Timeout'),
        ('rate_limited', 'Rate Limited'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_usage_logs')
    key = models.ForeignKey(UserAPIKey, on_delete=models.SET_NULL, null=True, related_name='usage_logs')
    provider = models.CharField(max_length=20, db_index=True)
    model = models.CharField(max_length=100, blank=True)
    
    # Request details
    tokens_input = models.IntegerField(default=0)
    tokens_output = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    
    # Response
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, db_index=True)
    error_message = models.TextField(blank=True)
    
    # Metadata
    cached = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['provider', 'timestamp']),
            models.Index(fields=['key', 'timestamp']),
            models.Index(fields=['status', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.provider} - {self.status} - {self.timestamp}"


class DailyAnalytics(models.Model):
    """
    Aggregated daily analytics per key.
    Populated hourly by background job.
    """
    
    date = models.DateField(db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_daily_analytics')
    key = models.ForeignKey(UserAPIKey, on_delete=models.SET_NULL, null=True, related_name='daily_analytics')
    provider = models.CharField(max_length=20, db_index=True)
    
    # Aggregated stats
    requests_count = models.IntegerField(default=0)
    tokens_total = models.IntegerField(default=0)
    avg_latency = models.IntegerField(default=0)
    success_rate = models.FloatField(default=100.0)
    error_count = models.IntegerField(default=0)
    cache_hit_count = models.IntegerField(default=0)
    
    # Cost tracking (estimated)
    estimated_cost_saved = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['date', 'key']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['provider', 'date']),
        ]
        verbose_name = "Daily Analytics"
        verbose_name_plural = "Daily Analytics"
    
    def __str__(self):
        return f"{self.date} - {self.provider} - {self.requests_count} requests"


class KeyModelUsage(models.Model):
    """
    Tracks usage quotas for a specific model under a key.
    This allows tracking independent quotas for different models (e.g. Gemini variants)
    using the same API key.
    """
    key = models.ForeignKey(UserAPIKey, on_delete=models.CASCADE, related_name='model_usages')
    model = models.CharField(max_length=100, db_index=True)
    
    # Quota limits (defaults match Gemini free tier)
    daily_quota = models.IntegerField(default=1500)
    minute_quota = models.IntegerField(default=15)
    
    # Usage counters (reset periodically)
    requests_today = models.IntegerField(default=0)
    requests_last_minute = models.IntegerField(default=0)
    
    # Stats
    last_used_at = models.DateTimeField(auto_now=True)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['key', 'model']
        indexes = [
            models.Index(fields=['key', 'model']),
        ]
        
    def __str__(self):
        return f"{self.key.key_nickname} - {self.model}"


# =============================================================================
# AI GATEWAY v2.0 - MODEL-CENTRIC MODELS
# =============================================================================

class ModelDefinition(models.Model):
    """
    Static metadata about each AI model.
    Populated via seed command, rarely changes.
    """
    
    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('openrouter', 'OpenRouter'),
        ('groq', 'Groq'),
        ('huggingface', 'HuggingFace'),
        ('cohere', 'Cohere'),
        ('deepinfra', 'DeepInfra'),
        ('pollinations', 'Pollinations'),
    ]
    
    QUALITY_TIERS = [
        ('low', 'Low - Fast, cheap'),
        ('medium', 'Medium - Balanced'),
        ('high', 'High - Quality focused'),
        ('premium', 'Premium - Best available'),
    ]
    
    # Identity
    provider = models.CharField(max_length=30, choices=PROVIDER_CHOICES, db_index=True)
    model_id = models.CharField(max_length=100, db_index=True, help_text="e.g. gemini-2.0-flash")
    display_name = models.CharField(max_length=150, help_text="Human-readable name")
    
    # Capabilities
    is_text = models.BooleanField(default=True, help_text="Can generate text")
    is_image = models.BooleanField(default=False, help_text="Can generate images")
    supports_json_mode = models.BooleanField(default=False)
    supports_function_calling = models.BooleanField(default=False)
    supports_vision = models.BooleanField(default=False, help_text="Can analyze images")
    
    # Limits
    context_window = models.IntegerField(default=8192, help_text="Max input tokens")
    max_output_tokens = models.IntegerField(default=2048, help_text="Max output tokens")
    
    # Default quotas (can be overridden per ModelInstance)
    default_daily_quota = models.IntegerField(default=1000)
    default_minute_quota = models.IntegerField(default=15)
    default_tokens_per_minute = models.IntegerField(default=100000)
    
    # Performance
    typical_latency_ms = models.IntegerField(default=500)
    cost_per_1k_input_tokens = models.DecimalField(
        max_digits=10, decimal_places=6, default=0,
        help_text="Cost in USD per 1K input tokens"
    )
    cost_per_1k_output_tokens = models.DecimalField(
        max_digits=10, decimal_places=6, default=0,
        help_text="Cost in USD per 1K output tokens"
    )
    
    # Quality & Status
    quality_tier = models.CharField(max_length=20, choices=QUALITY_TIERS, default='medium')
    is_active = models.BooleanField(default=True, db_index=True)
    is_free = models.BooleanField(default=False, help_text="No cost to use")
    
    # Quota Reset Configuration
    RESET_TYPE_CHOICES = [
        ('fixed', 'Fixed time (e.g., midnight UTC)'),
        ('rolling', 'Rolling window (last 24 hours)'),
        ('first_use', 'Resets 24h after first use each day'),
    ]
    
    quota_reset_type = models.CharField(
        max_length=20, 
        choices=RESET_TYPE_CHOICES, 
        default='fixed',
        help_text="How this provider resets quotas"
    )
    quota_reset_hour = models.IntegerField(
        default=0, 
        help_text="Hour (0-23 UTC) when daily quota resets. Only used for 'fixed' type."
    )
    
    # Metadata
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['provider', 'model_id']
        unique_together = ['provider', 'model_id']
        indexes = [
            models.Index(fields=['provider', 'is_active']),
            models.Index(fields=['is_text', 'is_active']),
            models.Index(fields=['is_image', 'is_active']),
        ]
        verbose_name = "Model Definition"
        verbose_name_plural = "Model Definitions"
    
    def __str__(self):
        return f"{self.provider}/{self.model_id}"


class ModelInstance(models.Model):
    """
    Tracks state for a specific model using a specific API key.
    This is the PRIMARY model for model selection in v2.0.
    
    Each UserAPIKey can have multiple ModelInstances (one per model).
    The ModelSelector queries these to find the best available model.
    """
    
    ERROR_TYPE_CHOICES = [
        ('', 'None'),
        ('QUOTA_EXCEEDED', 'Daily quota exceeded'),
        ('RATE_LIMITED', 'Rate limit hit'),
        ('INVALID_KEY', 'API key invalid'),
        ('MODEL_NOT_FOUND', 'Model not available'),
        ('CONTENT_FILTER', 'Content blocked'),
        ('TIMEOUT', 'Request timed out'),
        ('SERVER_ERROR', 'Provider server error'),
        ('UNKNOWN', 'Unknown error'),
    ]
    
    # Relationships
    api_key = models.ForeignKey(
        UserAPIKey, 
        on_delete=models.CASCADE, 
        related_name='model_instances'
    )
    model = models.ForeignKey(
        ModelDefinition, 
        on_delete=models.CASCADE, 
        related_name='instances'
    )
    
    # Quota Tracking (real-time state)
    daily_quota = models.IntegerField(default=1000, help_text="Max requests per day")
    remaining_daily = models.IntegerField(default=1000, help_text="Remaining today")
    minute_quota = models.IntegerField(default=15, help_text="Max requests per minute")
    remaining_minute = models.IntegerField(default=15, help_text="Remaining this minute")
    tokens_per_minute = models.IntegerField(default=100000)
    remaining_tokens_minute = models.IntegerField(default=100000)
    
    # Scoring (0-100 scale)
    health_score = models.IntegerField(
        default=100, 
        help_text="Overall health 0-100, based on recent performance"
    )
    availability_score = models.IntegerField(
        default=100, 
        help_text="Availability 0-100, based on quota and blocks"
    )
    
    # Confidence (0.0-1.0 probability of success)
    confidence_score = models.FloatField(
        default=1.0, 
        help_text="Probability (0-1) this model will succeed on next request"
    )
    
    # Failure Tracking
    consecutive_failures = models.IntegerField(default=0)
    last_failure_at = models.DateTimeField(null=True, blank=True)
    last_failure_reason = models.CharField(
        max_length=50, 
        choices=ERROR_TYPE_CHOICES, 
        blank=True, 
        default=''
    )
    last_success_at = models.DateTimeField(null=True, blank=True)
    
    # Blocking
    is_blocked = models.BooleanField(default=False, db_index=True)
    block_until = models.DateTimeField(null=True, blank=True)
    block_reason = models.CharField(max_length=200, blank=True)
    
    # Statistics
    total_requests = models.IntegerField(default=0)
    total_successes = models.IntegerField(default=0)
    total_failures = models.IntegerField(default=0)
    avg_latency_ms = models.IntegerField(default=500)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-confidence_score', '-health_score']
        unique_together = ['api_key', 'model']
        indexes = [
            models.Index(fields=['api_key', 'is_blocked', '-confidence_score']),
            models.Index(fields=['model', 'is_blocked', '-confidence_score']),
            models.Index(fields=['is_blocked', 'block_until']),
        ]
        verbose_name = "Model Instance"
        verbose_name_plural = "Model Instances"
    
    def __str__(self):
        key_name = self.api_key.key_nickname or f"Key {self.api_key.id}"
        return f"{key_name} → {self.model.model_id} (conf: {self.confidence_score:.2f})"
    
    @property
    def success_rate(self) -> float:
        """Calculate historical success rate."""
        if self.total_requests == 0:
            return 1.0  # Assume good until proven otherwise
        return self.total_successes / self.total_requests
    
    @property
    def is_available(self) -> bool:
        """Check if this instance can accept requests right now."""
        if self.is_blocked:
            if self.block_until and self.block_until < timezone.now():
                return True  # Block expired
            return False
        if self.remaining_daily <= 0:
            return False
        if self.remaining_minute <= 0:
            return False  # Will recover in next minute
        return True


class FailureLog(models.Model):
    """
    Detailed log of each failure for analytics and learning.
    Used by LearningEngine to improve model selection.
    """
    
    model_instance = models.ForeignKey(
        ModelInstance, 
        on_delete=models.CASCADE, 
        related_name='failure_logs'
    )
    
    error_type = models.CharField(max_length=50, db_index=True)
    error_code = models.CharField(max_length=20, blank=True, help_text="HTTP status or error code")
    error_message = models.TextField()
    
    # Context
    request_type = models.CharField(max_length=20, default='text', help_text="text or image")
    tokens_attempted = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0, help_text="Time until failure")
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_instance', 'timestamp']),
            models.Index(fields=['error_type', 'timestamp']),
        ]
        verbose_name = "Failure Log"
        verbose_name_plural = "Failure Logs"
    
    def __str__(self):
        return f"{self.model_instance} - {self.error_type} - {self.timestamp}"

