#!/usr/bin/env python3
"""Fetch runtime logs for vocab-web"""
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

print(f"[*] Fetching logs for vocab-web...")
response = requests.get(
    f"{BASE_URL}/services/{service_id}/logs?limit=100",
    headers=get_headers()
)

if response.status_code != 200:
    print(f"[ERROR] Failed to fetch logs: {response.status_code}")
    print(response.text)
    exit(1)

logs = response.json()
print(f"\n[OK] Found {len(logs)} log entries\n")

for entry in logs:
    timestamp = entry.get('timestamp', '')
    message = entry.get('message', '')
    print(f"[{timestamp}] {message}")
