from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
if User.objects.filter(username='api_test_user').exists():
    u = User.objects.get(username='api_test_user')
else:
    u = User.objects.create_user('api_test_user', 'test@api.com', 'pass123')

t, _ = Token.objects.get_or_create(user=u)
print(f"TOKEN:{t.key}")
