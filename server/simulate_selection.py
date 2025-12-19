"""
Simulate the exact model selection flow to find why it's failing.
"""

import os
os.environ['DATABASE_URL'] = "postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')

import django
django.setup()

from api.ai_gateway.models import ModelDefinition, ModelInstance, UserAPIKey
from api.ai_gateway.services.model_selector import model_selector
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 60)
print("SIMULATING MODEL SELECTION FOR nooralebrahim43")
print("=" * 60)

try:
    user = User.objects.get(username='nooralebrahim43')
    print(f"\n✅ Found user: {user.username} (ID: {user.id})")
    
    # Get user's keys
    keys = UserAPIKey.objects.filter(user=user, is_active=True)
    print(f"\n🔑 User has {keys.count()} active API keys:")
    for key in keys:
        print(f"   - ID: {key.id}, Provider: {key.provider}, Health: {key.health_score}")
        
        # Check if ModelDefinitions exist for this provider
        defs = ModelDefinition.objects.filter(provider=key.provider, is_active=True, is_text=True)
        print(f"     → ModelDefinitions for '{key.provider}': {defs.count()}")
        for d in defs[:3]:
            print(f"       - {d.model_id}")
        
        # Check if ModelInstances exist for this key
        instances = ModelInstance.objects.filter(api_key=key)
        print(f"     → ModelInstances for this key: {instances.count()}")
        for inst in instances:
            print(f"       [{inst.model.provider}/{inst.model.model_id}]")
            print(f"         - blocked: {inst.is_blocked} (until: {inst.block_until})")
            print(f"         - remaining_daily: {inst.remaining_daily}/{inst.daily_quota}")
            print(f"         - remaining_minute: {inst.remaining_minute}/{inst.minute_quota}")
            print(f"         - health: {inst.health_score}")
    
    # Now simulate the actual selection
    print("\n" + "=" * 60)
    print("🎯 SIMULATING find_best_model()")
    print("=" * 60)
    
    result = model_selector.find_best_model(
        user=user,
        request_type='text',
    )
    
    print(f"\n📊 Selection Result:")
    print(f"   Success: {result.success}")
    print(f"   Confidence: {result.confidence}")
    print(f"   Warning: {result.warning}")
    
    if result.model:
        print(f"   Selected Model: {result.model.model.provider}/{result.model.model.model_id}")
        print(f"   Key ID: {result.model.api_key.id}")
    else:
        print("   ❌ NO MODEL SELECTED!")
        
    if result.alternatives:
        print(f"   Alternatives: {len(result.alternatives)}")
        for alt in result.alternatives[:3]:
            print(f"     - {alt.model.provider}/{alt.model.model_id}")

except User.DoesNotExist:
    print("❌ User not found!")
except Exception as e:
    import traceback
    print(f"\n❌ ERROR: {e}")
    print(traceback.format_exc())

print("\n" + "=" * 60)
