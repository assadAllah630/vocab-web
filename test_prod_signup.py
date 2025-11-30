#!/usr/bin/env python3
"""Test production signup endpoint"""
import requests
import json

url = "https://vocab-web-03t1.onrender.com/api/auth/signup/"
data = {
    "username": "testprod123",
    "password": "test123",
    "email": "testprod123@example.com",
    "native_language": "en",
    "target_language": "de"
}

print(f"Testing: {url}")
print(f"Payload: {json.dumps(data, indent=2)}\n")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 401:
        print("\n❌ STILL GETTING 401! Fix didn't work.")
        exit(1)
    elif response.status_code in [200, 201]:
        print("\n✅ SUCCESS! Signup works!")
        exit(0)
    elif response.status_code == 400:
        error = response.json().get('error', '')
        if 'already exists' in error:
            print("\n✅ Endpoint works! (User already exists)")
            exit(0)
        else:
            print(f"\n⚠️ 400 error: {error}")
            exit(0)
    else:
        print(f"\n⚠️ Got status {response.status_code}")
        exit(1)
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    exit(1)
