import os
import django
import sys

# Setup Django
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.ai_gateway.models import ModelDefinition, UserAPIKey
from django.contrib.auth.models import User

print("--- Model Definitions ---")
for m in ModelDefinition.objects.all():
    print(f"Provider: {m.provider:<12} | Model ID: {m.model_id:<25} | Active: {m.is_active}")

print("\n--- User Keys ---")
# Assuming we are looking for the user who made the request.
# I will list keys for all users or try to find a specific one.
for u in User.objects.all():
    keys = UserAPIKey.objects.filter(user=u)
    if keys.exists():
        print(f"User: {u.username}")
        for k in keys:
            print(f"  Provider: {k.provider:<12} | Instances: {k.model_instances.count()} | Active: {k.is_active}")
            if k.model_instances.count() == 0:
                print("    WARNING: No ModelInstances linked to this key! (This is likely the bug)")

