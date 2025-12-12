"""
Create ModelInstances for all existing UserAPIKeys.

This command ensures every API key has ModelInstance records
for each model its provider supports.

Usage:
    python manage.py create_model_instances
    python manage.py create_model_instances --user=admin  # For specific user
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from api.ai_gateway.models import UserAPIKey, ModelDefinition, ModelInstance


class Command(BaseCommand):
    help = 'Create ModelInstances for existing API keys'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Create instances only for this username',
        )
    
    def handle(self, *args, **options):
        username = options.get('user')
        
        # Get keys to process
        if username:
            try:
                user = User.objects.get(username=username)
                keys = UserAPIKey.objects.filter(user=user, is_active=True)
                self.stdout.write(f"Processing keys for user: {username}")
            except User.DoesNotExist:
                self.stderr.write(f"User '{username}' not found")
                return
        else:
            keys = UserAPIKey.objects.filter(is_active=True)
            self.stdout.write(f"Processing all active keys")
        
        total_created = 0
        total_existing = 0
        
        for key in keys:
            # Get all models for this provider
            models = ModelDefinition.objects.filter(
                provider=key.provider,
                is_active=True
            )
            
            self.stdout.write(f"\n{key.provider} key {key.id} ({key.key_nickname or 'unnamed'}):")
            
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
                        'health_score': 100,
                        'confidence_score': 1.0,
                    }
                )
                
                if created:
                    total_created += 1
                    self.stdout.write(f"  ✅ Created: {model.model_id}")
                else:
                    total_existing += 1
                    self.stdout.write(f"  ⏭️  Exists: {model.model_id}")
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! Created {total_created} new instances, {total_existing} already existed."
            )
        )
