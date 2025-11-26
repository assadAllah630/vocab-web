from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates a test user'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='testuser').exists():
            User.objects.create_user('testuser', 'test@example.com', 'testpassword123')
            self.stdout.write(self.style.SUCCESS('Successfully created testuser'))
        else:
            self.stdout.write(self.style.SUCCESS('testuser already exists'))
