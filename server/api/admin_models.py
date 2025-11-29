from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class AdminRole(models.Model):
    ROLES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('CONTENT_MODERATOR', 'Content Moderator'),
        ('USER_SUPPORT', 'User Support'),
        ('ANALYST', 'Analyst'),
        ('SYSTEM_ADMIN', 'System Admin'),
    ]
    
    # Granular permissions
    PERMISSIONS = {
        'SUPER_ADMIN': [
            'view_users', 'edit_users', 'delete_users', 'bulk_user_actions',
            'view_content', 'edit_content', 'delete_content', 'moderate_content',
            'view_analytics', 'export_data',
            'view_system', 'edit_system', 'manage_admins',
            'view_audit_logs', 'send_emails'
        ],
        'CONTENT_MODERATOR': [
            'view_users', 'view_content', 'edit_content', 'delete_content', 
            'moderate_content', 'view_analytics'
        ],
        'USER_SUPPORT': [
            'view_users', 'edit_users', 'view_content', 'view_analytics',
            'send_emails'
        ],
        'ANALYST': [
            'view_users', 'view_content', 'view_analytics', 'export_data',
            'view_system'
        ],
        'SYSTEM_ADMIN': [
            'view_users', 'view_content', 'view_analytics', 'view_system',
            'edit_system', 'view_audit_logs'
        ],
    }
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_role')
    role = models.CharField(max_length=50, choices=ROLES)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_admins')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    custom_permissions = models.JSONField(default=list, blank=True)  # Override default permissions

    def __str__(self):
        return f"{self.user.username} - {self.role}"
    
    def has_permission(self, permission):
        """Check if this admin role has a specific permission"""
        if not self.is_active:
            return False
        
        # Custom permissions override defaults
        if self.custom_permissions:
            return permission in self.custom_permissions
        
        # Use default role permissions
        return permission in self.PERMISSIONS.get(self.role, [])
    
    def get_permissions(self):
        """Get all permissions for this role"""
        if self.custom_permissions:
            return self.custom_permissions
        return self.PERMISSIONS.get(self.role, [])


class AdminAuditLog(models.Model):
    admin_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)  # 'user_suspended', 'content_deleted', etc.
    resource_type = models.CharField(max_length=50)  # 'user', 'vocabulary', 'content', etc.
    resource_id = models.IntegerField(null=True)
    details = models.JSONField(default=dict)  # Additional context
    ip_address = models.GenericIPAddressField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    def __str__(self):
        return f"{self.admin_user} - {self.action} - {self.timestamp}"

class SystemMetrics(models.Model):
    date = models.DateField(unique=True, db_index=True)
    total_users = models.IntegerField(default=0)
    active_users_day = models.IntegerField(default=0)
    new_signups = models.IntegerField(default=0)
    practice_sessions = models.IntegerField(default=0)
    vocabulary_added = models.IntegerField(default=0)
    content_generated = models.IntegerField(default=0)
    api_calls_total = models.IntegerField(default=0)
    api_calls_gemini = models.IntegerField(default=0)
    api_calls_stable_horde = models.IntegerField(default=0)
    api_calls_huggingface = models.IntegerField(default=0)
    api_calls_openrouter = models.IntegerField(default=0)
    errors_count = models.IntegerField(default=0)
    raw_data = models.JSONField(default=dict)  # For flexible metrics

    def __str__(self):
        return f"Metrics for {self.date}"

class APIUsageLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    provider = models.CharField(max_length=50)  # 'gemini', 'stable_horde', etc.
    endpoint = models.CharField(max_length=200)
    request_data = models.JSONField(default=dict)
    response_status = models.IntegerField()  # HTTP status
    response_time_ms = models.IntegerField()  # Milliseconds
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.provider} - {self.timestamp}"

class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)  # 'login', 'vocabulary_added', etc.
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"

class SystemConfiguration(models.Model):
    maintenance_mode = models.BooleanField(default=False)
    allow_signups = models.BooleanField(default=True)
    admin_ip_whitelist = models.TextField(blank=True, help_text="Comma-separated list of allowed IPs for admin access")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return "System Configuration"

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
