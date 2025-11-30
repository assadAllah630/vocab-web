#!/usr/bin/env python3
"""Test if signin endpoint works (doesn't return 'relation does not exist' error)"""
import requests
import json

# Test signin endpoint with dummy credentials
url = "https://vocab-web-03t1.onrender.com/api/auth/signin/"
data = {
    "username": "testuser",
    "password": "testpass"
}

print(f"Testing: {url}")
print(f"Payload: {json.dumps(data)}\n")

response = requests.post(url, json=data)

print(f"Status Code: {response.status_code}")
print(f"Response:\n{json.dumps(response.json(), indent=2)}")

if response.status_code == 500:
    error_data = response.json()
    if "relation \"auth_user\" does not exist" in error_data.get("details", ""):
        print("\n❌ MIGRATIONS STILL NOT RUN - auth_user table missing!")
        exit(1)
    else:
        print("\n⚠️ Different 500 error (not migration-related)")
        exit(1)
elif response.status_code == 400:
    print("\n✅ SUCCESS! Endpoint works (returned 400 for invalid credentials)")
    print("This means migrations ran successfully!")
    exit(0)
else:
    print(f"\n✅ Endpoint responding (status {response.status_code})")
    exit(0)
