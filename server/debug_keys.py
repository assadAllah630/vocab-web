
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

def check_keys():
    try:
        # Get user (assuming ID 1 based on previous logs, or username assad.allah630)
        user = User.objects.get(id=1)
        profile = user.profile
        
        print(f"User: {user.username}")
        print(f"Profile ID: {profile.id}")
        print("-" * 30)
        print(f"OCR Key (User reported OK): '{profile.ocrspace_api_key}'")
        print(f"Speechify Key (User reported GONE): '{profile.speechify_api_key}'")
        print("-" * 30)
        
        # Check if serialization works as expected
        from api.serializers import UserProfileSerializer
        serializer = UserProfileSerializer(profile)
        data = serializer.data
        print(f"Serialized Speechify Key: '{data.get('speechify_api_key')}'")
        
        if 'speechify_api_key' not in data:
            print("ERROR: speechify_api_key is MISSING from serializer output!")
        elif data.get('speechify_api_key') == "":
             print("INFO: Serializer output is empty string (matches DB?)")
        else:
             print("SUCCESS: Serializer returns the key.")

    except User.DoesNotExist:
        print("User ID 1 not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_keys()
