
from django.db import models
from django.utils import timezone
from .models import UserAPIKey

class KeyModelUsage(models.Model):
    """
    Tracks usage quotas for a specific model under a key.
    This allows us to track independent quotas for different Gemini models
    using the same API key.
    """
    key = models.ForeignKey(UserAPIKey, on_delete=models.CASCADE, related_name='model_usages')
    model = models.CharField(max_length=100, db_index=True)
    
    # Quota limits (can override key defaults)
    daily_quota = models.IntegerField(default=1500)
    minute_quota = models.IntegerField(default=15)
    
    # Usage counters
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
