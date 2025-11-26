from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
u = User.objects.get(username='testuser')
t, _ = Token.objects.get_or_create(user=u)
print(f"TOKEN:{t.key}")
