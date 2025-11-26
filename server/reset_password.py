from django.contrib.auth.models import User
u = User.objects.get(username='testuser')
u.set_password('testpassword123')
u.save()
print("Password reset successfully")
