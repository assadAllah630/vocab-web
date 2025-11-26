from api.models import GeneratedContent
import sys

print("--- START DEBUG ---")
s = GeneratedContent.objects.get(pk=10)
print(f"Story: {s.title} ({s.image_generation_status})")
for e in s.content_data.get('events', []):
    print(f"Event {e.get('event_number')}: {e.get('image_status')} | Err: {e.get('error')}")
print("--- END DEBUG ---")
