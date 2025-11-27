#!/usr/bin/env python3
"""Trigger a manual deployment on Render"""
import requests
import json

API_KEY = "rnd_JQVOEon4Pq96K7Ykda0h1aZiiYe7"
BASE_URL = "https://api.render.com/v1"

def get_headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

service_id = "srv-d4jmik6mcj7s73blejj0"

print(f"[*] Triggering manual deployment for vocab-web...")
response = requests.post(
    f"{BASE_URL}/services/{service_id}/deploys",
    headers=get_headers(),
    json={"clearCache": "clear"}  # Clear cache to force fresh build
)

if response.status_code not in [200, 201]:
    print(f"[ERROR] Failed to trigger deploy: {response.status_code}")
    print(response.text)
    exit(1)

deploy = response.json().get('deploy', {})
deploy_id = deploy.get('id')
status = deploy.get('status')

print(f"\n[OK] Deployment triggered!")
print(f"     Deploy ID: {deploy_id}")
print(f"     Status: {status}")
print(f"\n[*] Monitor at: https://dashboard.render.com/web/{service_id}")
