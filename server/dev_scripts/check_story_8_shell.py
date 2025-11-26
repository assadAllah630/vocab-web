from api.models import GeneratedContent
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
    
    if not story.has_images:
        print("\n⚠️  WARNING: This story does NOT have images enabled.")
        print("   The endpoint returns 404 if has_images=False (which is incorrect behavior, should be 200 with status='none')")
        print("   BUT wait, the code says:")
        print("   if not content.has_images: return Response({'status': 'none'})")
        print("   So the 404 must be from get_object_or_404 meaning user mismatch or not found.")
        
except GeneratedContent.DoesNotExist:
    print("❌ Story ID 8 does NOT exist in the database.")
    
    print("\nExisting Stories:")
    for s in GeneratedContent.objects.all().order_by('-created_at')[:5]:
        print(f"- ID {s.id}: {s.title} (User: {s.user.username})")

print("=" * 60)
