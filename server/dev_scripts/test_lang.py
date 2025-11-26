import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile
from api.serializers import UserSerializer

try:
    # Clean up test user
    if User.objects.filter(username='test_lang_user').exists():
        User.objects.get(username='test_lang_user').delete()

    # Create user
    user = User.objects.create_user(username='test_lang_user', password='password')
    print("User created.")

    # Create profile
    profile = UserProfile.objects.create(user=user, native_language='en', target_language='ar')
    print(f"Profile created: Native={profile.native_language}, Target={profile.target_language}")

    # Test Serializer
    serializer = UserSerializer(user)
    print(f"Serializer Output: {serializer.data}")
    
    if serializer.data['native_language'] == 'en' and serializer.data['target_language'] == 'ar':
        print("Serializer verification PASSED")
    else:
        print("Serializer verification FAILED")

    # Update profile
    profile.target_language = 'ru'
    profile.save()
    print(f"Profile updated: Target={profile.target_language}")

except Exception as e:
    print(f"Test failed: {e}")
    import traceback
    traceback.print_exc()
