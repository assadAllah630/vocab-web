from api.models import GeneratedContent
s = GeneratedContent.objects.get(pk=10)
events = s.content_data.get('events', [])
print(f"Event 1: {events[0].get('image_status')} | {events[0].get('error')}")
print(f"Event 2: {events[1].get('image_status')} | {events[1].get('error')}")
print(f"Event 3: {events[2].get('image_status')} | {events[2].get('error')}")
print(f"Event 4: {events[3].get('image_status')} | {events[3].get('error')}")
print(f"Event 5: {events[4].get('image_status')} | {events[4].get('error')}")
print(f"Event 6: {events[5].get('image_status')} | {events[5].get('error')}")
