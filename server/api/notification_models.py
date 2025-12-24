"""
Push Notification Models

Stores push subscription data and notification preferences for users.
"""

from django.db import models
from django.contrib.auth.models import User


class PushSubscription(models.Model):
    """
    Stores Web Push API subscriptions for each user device.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh_key = models.CharField(max_length=500)  # Public key
    auth_key = models.CharField(max_length=500)  # Auth secret
    user_agent = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.endpoint[:50]}..."


class NotificationPreferences(models.Model):
    """
    User preferences for different notification types.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_prefs')
    
    # Notification types
    daily_reminder = models.BooleanField(default=True)
    streak_warning = models.BooleanField(default=True)  # About to lose streak
    new_content = models.BooleanField(default=True)  # New stories/articles available
    practice_reminder = models.BooleanField(default=True)  # Words need review
    achievement = models.BooleanField(default=True)  # Unlocked achievement
    
    # Timing preferences
    reminder_hour = models.IntegerField(default=9)  # Default 9 AM
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Quiet hours
    quiet_start = models.IntegerField(default=22)  # 10 PM
    quiet_end = models.IntegerField(default=7)  # 7 AM
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s notification preferences"


class NotificationLog(models.Model):
    """
    Log of sent notifications for analytics and debugging.
    """
    NOTIFICATION_TYPES = [
        ('daily_reminder', 'Daily Reminder'),
        ('streak_warning', 'Streak Warning'),
        ('new_content', 'New Content'),
        ('practice_reminder', 'Practice Reminder'),
        ('achievement', 'Achievement'),
        ('custom', 'Custom'),
        # Classroom notifications
        ('assignment_new', 'New Assignment'),
        ('assignment_due', 'Assignment Due Soon'),
        ('assignment_graded', 'Assignment Graded'),
        ('session_reminder', 'Session Reminder'),
        ('session_starting', 'Session Starting'),
        ('join_approved', 'Join Approved'),
        ('streak_risk', 'Streak at Risk'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_logs')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # {classroom_id, assignment_id, etc.}
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered = models.BooleanField(default=False)
    clicked = models.BooleanField(default=False)
    error = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['user', '-sent_at']),
            models.Index(fields=['notification_type', '-sent_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type}: {self.title[:50]}"
