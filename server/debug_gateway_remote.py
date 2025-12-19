"""
Debug script to check the state of AI Gateway tables in production.
"""

import os
os.environ['DATABASE_URL'] = "postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')

import django
django.setup()

from api.ai_gateway.models import ModelDefinition, ModelInstance, UserAPIKey
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 60)
print("AI GATEWAY DATABASE STATE")
print("=" * 60)

# Check ModelDefinitions
print(f"\n📋 ModelDefinitions: {ModelDefinition.objects.count()}")
for md in ModelDefinition.objects.filter(is_active=True, is_text=True)[:10]:
    print(f"   - {md.provider}/{md.model_id} (active={md.is_active})")

# Check UserAPIKeys
print(f"\n🔑 UserAPIKeys (active): {UserAPIKey.objects.filter(is_active=True).count()}")
for key in UserAPIKey.objects.filter(is_active=True):
    print(f"   - User: {key.user.username}, Provider: {key.provider}, Health: {key.health_score}")

# Check ModelInstances
print(f"\n🔗 ModelInstances: {ModelInstance.objects.count()}")
for mi in ModelInstance.objects.select_related('api_key', 'model')[:20]:
    print(f"   - {mi.model.provider}/{mi.model.model_id} (user: {mi.api_key.user.username}, blocked: {mi.is_blocked})")

# Check for user nooralebrahim43 specifically
print(f"\n🎯 Checking user 'nooralebrahim43'...")
try:
    user = User.objects.get(username='nooralebrahim43')
    user_keys = UserAPIKey.objects.filter(user=user, is_active=True)
    print(f"   Keys: {user_keys.count()}")
    for key in user_keys:
        print(f"   - Provider: {key.provider}")
        
        # Check ModelDefinitions for this provider
        defs = ModelDefinition.objects.filter(provider=key.provider, is_active=True, is_text=True)
        print(f"     ModelDefinitions for {key.provider}: {defs.count()}")
        
        # Check ModelInstances for this key
        instances = ModelInstance.objects.filter(api_key=key)
        print(f"     ModelInstances for this key: {instances.count()}")
        
except User.DoesNotExist:
    print("   User not found!")

print("\n" + "=" * 60)
