#!/usr/bin/env python3
"""Test local signup endpoint"""
import requests
import json

url = "http://localhost:8000/api/auth/signup/"
data = {
    "username": "testlocal",
    "password": "test123",
    "email": "test@local.com",
    "native_language": "en",
    "target_language": "de"
}

print(f"Testing: {url}")
print(f"Payload: {json.dumps(data, indent=2)}\n")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    
    if response.status_code in [200, 201]:
        print("\n✅ SUCCESS! Signup endpoint works locally!")
        exit(0)
    elif response.status_code == 400:
        print("\n⚠️ 400 error (might be expected if user exists)")
        exit(0)
    else:
        print(f"\n❌ FAILED with status {response.status_code}")
        exit(1)
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    exit(1)
