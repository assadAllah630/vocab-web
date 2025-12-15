
import os
import sys
import django

sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.ai_gateway.models import ModelInstance, UserAPIKey

User = get_user_model()
username = 'assad.allah630'
user = User.objects.get(username=username)

print(f"Resetting quotas/blocks for user: {user.username}")

# 1. Unblock Keys
keys = UserAPIKey.objects.filter(user=user)
keys.update(is_blocked=False, health_score=100)
print(f"Unblocked {keys.count()} keys.")

# 2. Reset Model Instances
instances = ModelInstance.objects.filter(api_key__user=user)
updated = instances.update(
    is_blocked=False,
    block_until=None,
    health_score=100,
    remaining_daily=1500, # Force reset to default
    remaining_minute=15,
    consecutive_failures=0
)
print(f"Reset {updated} model instances.")

print("Done! Gemini should be available now.")
