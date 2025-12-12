import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.ai_gateway.models import UserAPIKey
from django.contrib.auth.models import User

def debug_keys():
    print("Debugging Key Status...")
    # Assuming user is the first/main user since it's local dev
    user = User.objects.first() 
    print(f"User: {user.username}")
    
    keys = UserAPIKey.objects.filter(user=user)
    print(f"Total Keys Found: {keys.count()}")
    
    for key in keys:
        print(f"Key {key.id} ({key.provider}): Active={key.is_active}, Blocked={key.is_blocked}, ReqToday={key.requests_today}, Quota={key.daily_quota}")

if __name__ == '__main__':
    debug_keys()
