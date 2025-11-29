import os
import sys
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.models import UserProfile, Vocabulary, GeneratedContent
from api.analytics_service import AnalyticsService
from api.admin_models import SystemMetrics

User = get_user_model()

def create_users(count=50):
    print(f"Creating {count} users...")
    users = []
    for i in range(count):
        username = f"user_{i}_{random.randint(1000, 9999)}"
        email = f"{username}@example.com"
        
        # Random join date within last 30 days
        days_ago = random.randint(0, 30)
        date_joined = timezone.now() - timedelta(days=days_ago)
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password="password123"
        )
        user.date_joined = date_joined
        user.last_login = date_joined + timedelta(hours=random.randint(1, 24))
        user.save()
        
        # Update profile (automatically created by signal)
        if hasattr(user, 'profile'):
            profile = user.profile
            profile.target_language = random.choice(['de', 'fr', 'es', 'ja'])
            profile.save()
            
        users.append(user)
    return users

def create_activity(users):
    print("Generating activity...")
    for user in users:
        # Create vocabulary
        for _ in range(random.randint(5, 20)):
            Vocabulary.objects.create(
                created_by=user,
                word=f"word_{random.randint(1, 1000)}",
                translation=f"translation_{random.randint(1, 1000)}",
                language=user.profile.target_language,
                created_at=user.date_joined + timedelta(days=random.randint(0, 5))
            )
            
        # Create generated content
        for _ in range(random.randint(1, 5)):
            GeneratedContent.objects.create(
                user=user,
                title=f"Story about {random.choice(['cats', 'dogs', 'travel', 'food'])}",
                topic=random.choice(['Travel', 'Food', 'Animals', 'Technology']),
                level=random.choice(['A1', 'A2', 'B1', 'B2']),
                target_language=user.profile.target_language,
                content_data={"text": "Lorem ipsum content..."},
                content_type=random.choice(['story', 'article', 'dialogue']),
                created_at=user.date_joined + timedelta(days=random.randint(0, 5))
            )

def backfill_metrics(days=30):
    print(f"Backfilling metrics for last {days} days...")
    today = timezone.now().date()
    for i in range(days):
        date = today - timedelta(days=i)
        print(f"Processing {date}...")
        
        # Calculate metrics for that specific day
        total_users = User.objects.filter(date_joined__date__lte=date).count()
        new_signups = User.objects.filter(date_joined__date=date).count()
        active_users = User.objects.filter(last_login__date=date).count()
        
        # For demo purposes, generate some random active users if 0
        if active_users == 0:
            active_users = random.randint(5, total_users) if total_users > 0 else 0
            
        vocab_added = Vocabulary.objects.filter(created_at__date=date).count()
        content_generated = GeneratedContent.objects.filter(created_at__date=date).count()
        
        SystemMetrics.objects.update_or_create(
            date=date,
            defaults={
                'total_users': total_users,
                'new_signups': new_signups,
                'active_users_day': active_users,
                'vocabulary_added': vocab_added,
                'content_generated': content_generated,
                'api_calls_total': random.randint(10, 100),
                'api_calls_gemini': random.randint(5, 50),
            }
        )

if __name__ == '__main__':
    print("Starting seed process...")
    try:
        users = create_users(50)
        create_activity(users)
        backfill_metrics(30)
        print("Seed completed successfully!")
    except Exception as e:
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
