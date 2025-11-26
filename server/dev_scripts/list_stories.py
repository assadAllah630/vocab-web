from api.models import GeneratedContent
print("Latest 5 stories:")
for s in GeneratedContent.objects.all().order_by('-id')[:5]:
    print(f"ID: {s.id}, Title: {s.title}, Has Images: {s.has_images}, User: {s.user.username}")
