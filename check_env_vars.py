#!/usr/bin/env python3
"""Check environment variables on Render service"""
import requests
import json

API_KEY = "rnd_JQVOEon4Pq96K7Ykda0h1aZiiYe7"
BASE_URL = "https://api.render.com/v1"

def get_headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }

service_id = "srv-d4jmik6mcj7s73blejj0"

print("[*] Fetching environment variables for vocab-web...")
response = requests.get(
    f"{BASE_URL}/services/{service_id}/env-vars",
    headers=get_headers()
)

if response.status_code != 200:
    print(f"[ERROR] Failed to fetch: {response.status_code}")
    print(response.text)
    exit(1)

env_vars = response.json()
print(f"\n[OK] Found {len(env_vars)} environment variables:\n")

for item in env_vars:
    env_var = item.get('envVar', {})
    key = env_var.get('key')
    value = env_var.get('value', '[HIDDEN]')
    
    # Hide sensitive values
    if any(secret in key.lower() for secret in ['secret', 'password', 'key']):
        value = '[HIDDEN]'
    
    print(f"  {key}: {value}")

# Check for missing required vars
required_vars = [
    'FRONTEND_URL',
    'ALLOWED_HOSTS',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET'
]

existing_keys = [item.get('envVar', {}).get('key') for item in env_vars]
missing = [var for var in required_vars if var not in existing_keys]

if missing:
    print(f"\n[WARNING] Missing environment variables:")
    for var in missing:
        print(f"  - {var}")
