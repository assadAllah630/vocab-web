import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_web.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.models import UserProfile
from django.contrib.auth.models import User

print("=" * 60)
print("TESTING REAL STABLE HORDE KEY")
print("=" * 60)

try:
    # Get main user
    user = User.objects.get(pk=1)
    # key = user.profile.stable_horde_api_key
    key = "AqxVnxY3itZzZxYpjUq70A"
    
    print(f"User: {user.username}")
    print(f"Key: {key[:5]}...{key[-5:] if key else 'None'}")
    
    if not key:
        print("❌ No API Key found in settings!")
        sys.exit(1)

    # Check User Details on Horde
    headers = {"apikey": key}
    response = requests.get("https://stablehorde.net/api/v2/find_user", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ KEY IS VALID!")
        print(f"Username: {data.get('username')}")
        print(f"Kudos: {data.get('kudos')}")
        print(f"Worker Count: {data.get('worker_count')}")
        print(f"Concurrency: {data.get('concurrency')}")
    else:
        print(f"\n❌ KEY CHECK FAILED: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\n❌ ERROR: {e}")
