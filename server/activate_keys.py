
import os
import sys
import django

sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.ai_gateway.models import UserAPIKey, ModelInstance

User = get_user_model()
username = 'assad.allah630'
user = User.objects.get(username=username)

print(f"Activating Keys for {user.username}...")

# 1. Activate ALL Gemini Keys
keys = UserAPIKey.objects.filter(user=user, provider='gemini')
count = keys.update(is_active=True, is_blocked=False, health_score=100)
print(f"Activated {count} Gemini keys.")

# 2. Reset Instances again just to be safe
instances = ModelInstance.objects.filter(api_key__user=user, model__provider='gemini')
instances.update(is_blocked=False, block_until=None)

print("Done.")
