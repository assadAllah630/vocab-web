from api.models import UserProfile
from django.contrib.auth.models import User

try:
    # Assuming user ID 1 is the main user
    user = User.objects.get(pk=1)
    profile = user.profile
    
    print(f"User: {user.username}")
    print(f"Horde Key: {profile.stable_horde_api_key}")
    print(f"HF Token: {profile.huggingface_api_token}")
    
except Exception as e:
    print(f"Error: {e}")
