"""
Django app config for AI Gateway.
"""

from django.apps import AppConfig


class AiGatewayConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api.ai_gateway'
    verbose_name = 'AI Gateway'
    
    def ready(self):
        """Called when Django starts up."""
        # Import models to register them
        from . import models  # noqa
