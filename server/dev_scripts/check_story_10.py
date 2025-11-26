from api.models import GeneratedContent
import json

try:
    story = GeneratedContent.objects.get(pk=10)
    print(f"Story ID: {story.id}")
    print(f"Title: {story.title}")
    print(f"Image Status: {story.image_generation_status}")
    print(f"Generated Count: {story.images_generated_count}/{story.total_images_count}")
    
    events = story.content_data.get('events', [])
    for i, event in enumerate(events):
        status = event.get('image_status')
        provider = event.get('image_provider')
        error = event.get('error')
        print(f"Event {i+1}: Status={status}, Provider={provider}, Error={error}")
        
except GeneratedContent.DoesNotExist:
    print("Story 10 not found")
