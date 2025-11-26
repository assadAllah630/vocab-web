from django.conf import settings
print(f"DB Engine: {settings.DATABASES['default']['ENGINE']}")
print(f"DB Name: {settings.DATABASES['default']['NAME']}")
print(f"DB Host: {settings.DATABASES['default']['HOST']}")
