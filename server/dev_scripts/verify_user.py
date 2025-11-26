from django.contrib.auth.models import User
from api.models import UserProfile
u = User.objects.get(username='testuser')
p, _ = UserProfile.objects.get_or_create(user=u)
p.is_email_verified = True
p.save()
print("User verified successfully")
