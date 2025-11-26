from api.advanced_text_models import GeneratedContent

print('=== Database Stories ===')
print(f'Total stories: {GeneratedContent.objects.count()}')
print(f'Stories with images enabled: {GeneratedContent.objects.filter(has_images=True).count()}')
print()

print('=== Recent Stories ===')
for story in GeneratedContent.objects.all().order_by('-created_at')[:10]:
    print(f'ID: {story.id}')
    print(f'  Title: {story.title}')
    print(f'  User: {story.user.username}')
    print(f'  Has Images: {story.has_images}')
    print(f'  Image Status: {story.image_generation_status}')
    print(f'  Created: {story.created_at}')
    print()
