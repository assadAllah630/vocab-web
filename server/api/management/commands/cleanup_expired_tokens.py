"""
Management command to clean up expired tokens
Run this periodically (e.g., daily cron job) to remove old unused tokens
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Remove tokens for users who have been inactive for more than 30 days'

    def handle(self, *args, **options):
        cutoff_date = timezone.now() - timedelta(days=30)
        
        # Find users who haven't logged in for 30+ days
        inactive_users = User.objects.filter(
            last_login__lt=cutoff_date
        ) | User.objects.filter(last_login__isnull=True)
        
        # Delete their tokens
        tokens_deleted = 0
        for user in inactive_users:
            try:
                token = Token.objects.get(user=user)
                token.delete()
                tokens_deleted += 1
            except Token.DoesNotExist:
                pass
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully cleaned up {tokens_deleted} expired tokens'
            )
        )
