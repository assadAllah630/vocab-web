
import os
import sys
import django
import time

sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.ai_gateway.models import ModelInstance, ModelDefinition
from api.ai_gateway.adapters import get_adapter
from api.ai_gateway.utils.encryption import decrypt_api_key
import asyncio

User = get_user_model()
username = 'assad.allah630'
user = User.objects.get(username=username)


print(f"--- Connectivity Test for {user.username} ---")

# DB operations (Sync)
instances = list(ModelInstance.objects.filter(api_key__user=user, is_blocked=False).select_related('model', 'api_key'))
print(f"Found {len(instances)} active instances.")

async def test_instance(instance):
    model_id = instance.model.model_id
    provider = instance.model.provider
    print(f"\nTesting {model_id} ({provider})...")
    
    try:
        # Decrypt can be sync, that's fine
        decrypted_key = decrypt_api_key(instance.api_key.api_key_encrypted)
        adapter = get_adapter(provider, decrypted_key)
        
        messages = [{"role": "user", "content": "Hello"}]
        
        start = time.time()
        # This is the async part
        response = await adapter.complete(messages, max_tokens=10, model=model_id)
        duration = time.time() - start
        
        if response.success:
            print(f"✅ SUCCESS: {model_id} confirmed in {duration:.2f}s")
            print(f"   Response: {response.content[:500]}...") # Print more
        else:
            print(f"❌ FAILED: {model_id}")
            print(f"   Error: {response.error}")
            
    except Exception as e:
         print(f"💀 CRASH: {model_id} - {e}")

async def main():
    for i in instances:
        await test_instance(i)


if __name__ == "__main__":
    asyncio.run(main())
