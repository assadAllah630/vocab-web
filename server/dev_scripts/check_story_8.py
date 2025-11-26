import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_web.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.models import GeneratedContent, UserProfile
from django.contrib.auth.models import User

print("=" * 60)
print("CHECKING STORY ID 8")
print("=" * 60)

try:
    story = GeneratedContent.objects.get(pk=8)
    print(f"✅ Story ID 8 found!")
    print(f"Title: {story.title}")
    print(f"Owner: {story.user.username} (ID: {story.user.id})")
    print(f"Has Images: {story.has_images}")
    print(f"Image Status: {story.image_generation_status}")
    
    # Check all users
    print("\nAll Users:")
    for u in User.objects.all():
        print(f"- {u.username} (ID: {u.id})")
        
except GeneratedContent.DoesNotExist:
    print("❌ Story ID 8 does NOT exist in the database.")
    
    print("\nExisting Stories:")
    for s in GeneratedContent.objects.all().order_by('-created_at')[:5]:
        print(f"- ID {s.id}: {s.title} (User: {s.user.username})")

print("=" * 60)
