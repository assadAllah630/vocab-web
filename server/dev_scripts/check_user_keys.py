
import os
import sys
import django

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import UserProfile
from dev_scripts.test_image_keys import test_stable_horde, test_hugging_face

User = get_user_model()

def check_keys():
    print("Checking user keys from database...")
    
    users = User.objects.all()
    if not users.exists():
        print("No users found.")
        return

    for user in users:
        print(f"\nUser: {user.username}")
        try:
            profile = user.profile
            horde_key = profile.stable_horde_api_key
            hf_token = profile.huggingface_api_token
            
            print(f"  Horde Key: {'Set' if horde_key else 'Not Set'} ({horde_key[:5] if horde_key else ''}...)")
            print(f"  HF Token:  {'Set' if hf_token else 'Not Set'} ({hf_token[:5] if hf_token else ''}...)")
            
            if horde_key:
                test_stable_horde(horde_key)
            
            if hf_token:
                test_hugging_face(hf_token)
                
        except Exception as e:
            print(f"  Error accessing profile: {e}")

if __name__ == "__main__":
    check_keys()
