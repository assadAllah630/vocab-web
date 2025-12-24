#!/usr/bin/env python3
"""List all recent deployments for vocab-web"""
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

print(f"[*] Fetching ALL deployments for vocab-web...")
response = requests.get(
    f"{BASE_URL}/services/{service_id}/deploys",
    headers=get_headers()
)

if response.status_code != 200:
    print(f"[ERROR] Failed to fetch: {response.status_code}")
    print(response.text)
    exit(1)

deploys = response.json()
print(f"\n[OK] Found {len(deploys)} deployments\n")

for i, item in enumerate(deploys[:10]):  # Show last 10
    deploy = item.get('deploy', {})
    deploy_id = deploy.get('id')
    status = deploy.get('status')
    commit = deploy.get('commit', {})
    created_at = deploy.get('createdAt')
    finished_at = deploy.get('finishedAt', 'In progress')
    
    print(f"[{i+1}] Deploy ID: {deploy_id}")
    print(f"    Status: {status}")
    print(f"    Commit: {commit.get('message', 'N/A')[:60]}")
    print(f"    Created: {created_at}")
    print(f"    Finished: {finished_at}")
    print()
