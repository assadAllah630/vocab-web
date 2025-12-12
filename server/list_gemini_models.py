"""
List available Gemini models
"""
import os
import sys

sys.path.insert(0, 'e:/vocab_web/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')

import django
django.setup()

from api.ai_gateway.models import UserAPIKey
from api.ai_gateway.utils.encryption import decrypt_api_key

# Get a gemini key
key = UserAPIKey.objects.filter(provider='gemini', is_active=True).first()
if key:
    api_key = decrypt_api_key(key.api_key_encrypted)
    print(f"Using key ID: {key.id}")
    
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    
    print("\nAvailable models with generateContent:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
else:
    print("No Gemini keys found")
