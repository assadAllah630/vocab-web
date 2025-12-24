#!/usr/bin/env python3
"""Monitor deployment status"""
import requests
import time

API_KEY = "rnd_JQVOEon4Pq96K7Ykda0h1aZiiYe7"
BASE_URL = "https://api.render.com/v1"

def get_headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }

service_id = "srv-d4jmik6mcj7s73blejj0"

print("[*] Monitoring deployment status...")
print("[*] Press Ctrl+C to stop\n")

last_status = None
while True:
    response = requests.get(
        f"{BASE_URL}/services/{service_id}/deploys",
        headers=get_headers()
    )
    
    if response.status_code != 200:
        print(f"[ERROR] Failed to fetch: {response.status_code}")
        break
    
    deploys = response.json()
    if not deploys:
        print("[ERROR] No deployments found")
        break
    
    latest = deploys[0].get('deploy', {})
    status = latest.get('status')
    deploy_id = latest.get('id')
    
    if status != last_status:
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] Status: {status} (ID: {deploy_id})")
        last_status = status
        
        if status in ['live', 'build_failed', 'update_failed']:
            print(f"\n[FINAL] Deployment finished with status: {status}")
            break
    
    time.sleep(5)  # Check every 5 seconds
