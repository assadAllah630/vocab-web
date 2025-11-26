from api.models import UserProfile
from django.contrib.auth.models import User
import requests

print("--- CHECKING HORDE ---")
user = User.objects.get(pk=1)
# key = user.profile.stable_horde_api_key
key = "h12LWLSzEYCWVXYYIFbCpQ"
print(f"Key: {key[:5]}...")

headers = {"apikey": key}
resp = requests.get("https://stablehorde.net/api/v2/find_user", headers=headers)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"User: {data.get('username')}")
    print(f"Kudos: {data.get('kudos')}")
else:
    print(f"Error: {resp.text}")
print("--- END CHECK ---")
