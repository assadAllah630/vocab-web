import os
import django
import sys
from django.utils import timezone

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vocab_server.settings")
django.setup()

from api.ai_gateway.models import ModelInstance, UserAPIKey

def block_models():
    # Models to block
    MODELS_TO_BLOCK = [
        'gemini-pro', 
        'gemini-1.5-pro', 
        'gemini-1.0-pro', 
        'gemini-1.5-flash', # Block this too as it's unreliable for free tier
        'gemini-2.0-flash'
    ]
    
    print("Blocking broken models...")
    
    count = 0
    instances = ModelInstance.objects.filter(model__model_id__in=MODELS_TO_BLOCK, is_blocked=False)
    
    for instance in instances:
        instance.is_blocked = True
        instance.block_reason = "Manual block: Quota exceeded/Unreliable"
        instance.save()
        print(f"Blocked {instance.model.model_id} for key {instance.api_key.key_nickname}")
        count += 1
        
    print(f"Total blocked: {count}")
    
    # Verify what's left
    active = ModelInstance.objects.filter(is_blocked=False, api_key__is_active=True)
    print("\nRemaining Active Models:")
    for i in active:
        print(f"- {i.model.model_id} (Key: {i.api_key.key_nickname})")

if __name__ == "__main__":
    block_models()
