from django.contrib.auth.models import User
from api.models import UserProfile
admin = User.objects.get(username='admin')
profile, created = UserProfile.objects.get_or_create(user=admin)
profile.is_email_verified = True
profile.save()
print('Admin email verified! You can now login.')
print('Username: admin')
print('Password: admin123')
