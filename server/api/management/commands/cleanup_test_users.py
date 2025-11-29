"""
Management command to clean up test/seed users
Removes users created during development testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Remove test users created during development (user_XX_XXXX pattern)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find test users (pattern: user_XX_XXXX)
        test_users = User.objects.filter(username__startswith='user_')
        
        count = test_users.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {count} test users:'
                )
            )
            for user in test_users:
                self.stdout.write(f'  - {user.username} ({user.email})')
        else:
            # Delete the users
            deleted_users = []
            for user in test_users:
                deleted_users.append(user.username)
                user.delete()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {count} test users:'
                )
            )
            for username in deleted_users:
                self.stdout.write(f'  - {username}')
