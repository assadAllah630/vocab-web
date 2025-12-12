"""
Debug script to test unified_ai gateway
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, 'e:/vocab_web/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.ai_gateway.models import UserAPIKey
from api.unified_ai import generate_ai_content, get_ai_status

# Get the user (assuming there's at least one)
user = User.objects.first()
print(f"Testing with user: {user.username}")

# Check AI status
status = get_ai_status(user)
print(f"AI Status: {status}")

# List all gateway keys
keys = UserAPIKey.objects.filter(user=user, is_active=True)
print(f"\nGateway keys ({keys.count()}):")
for key in keys:
    print(f"  - ID: {key.id}, Provider: {key.provider}, Health: {key.health_score}")

# Try generating
print("\n--- Attempting generation ---")
try:
    response = generate_ai_content(user, "Say hello in German", max_tokens=50)
    print(f"SUCCESS: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")
