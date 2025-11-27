#!/usr/bin/env python3
"""Simple Render API wrapper to check deployment status"""
import requests
import json
import sys

API_KEY = "rnd_JQVOEon4Pq96K7Ykda0h1aZiiYe7"
BASE_URL = "https://api.render.com/v1"

def get_headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }

def get_service_by_name(name):
    """Find service by name"""
    response = requests.get(f"{BASE_URL}/services", headers=get_headers())
    if response.status_code != 200:
        print(f"Error fetching services: {response.status_code}")
        return None
    
    services = response.json()
    for svc in services:
        service = svc.get('service', {})
        if service.get('name') == name:
            return service
    return None

def get_latest_deploy(service_id):
    """Get latest deployment for a service"""
    response = requests.get(
        f"{BASE_URL}/services/{service_id}/deploys",
        headers=get_headers()
    )
    if response.status_code != 200:
        return None
    
    deploys = response.json()
    if deploys and len(deploys) > 0:
        return deploys[0].get('deploy', {})
    return None

def get_deploy_logs(service_id, deploy_id):
    """Get logs for a specific deployment"""
    response = requests.get(
        f"{BASE_URL}/services/{service_id}/deploys/{deploy_id}/logs",
        headers=get_headers()
    )
    if response.status_code != 200:
        return None
    return response.text

def main():
    service_name = "vocab-web"
    
    print(f"[*] Looking for service: {service_name}")
    service = get_service_by_name(service_name)
    
    if not service:
        print(f"[ERROR] Service '{service_name}' not found")
        return
    
    service_id = service.get('id')
    print(f"[OK] Found service: {service_id}")
    print(f"     URL: {service.get('serviceDetails', {}).get('url', 'N/A')}")
    
    print(f"\n[*] Fetching latest deployment...")
    deploy = get_latest_deploy(service_id)
    
    if not deploy:
        print("[ERROR] No deployments found")
        return
    
    deploy_id = deploy.get('id')
    status = deploy.get('status')
    commit = deploy.get('commit', {})
    created_at = deploy.get('createdAt')
    finished_at = deploy.get('finishedAt', 'In progress')
    
    print(f"\n[DEPLOY] Latest Deployment:")
    print(f"         ID: {deploy_id}")
    print(f"         Status: {status}")
    print(f"         Commit: {commit.get('message', 'N/A')}")
    print(f"         Created: {created_at}")
    print(f"         Finished: {finished_at}")
    
    if status == 'build_failed' or status == 'update_failed':
        print(f"\n[ERROR] DEPLOYMENT FAILED!")
        print(f"\n[*] Fetching error logs...")
        logs = get_deploy_logs(service_id, deploy_id)
        if logs:
            # Print ALL logs for failed deployments
            print("\n" + "="*80)
            print("FULL DEPLOYMENT LOGS:")
            print("="*80)
            print(logs)
            print("="*80)
        else:
            print("[ERROR] Could not fetch logs")
    elif status == 'live':
        print(f"\n[OK] DEPLOYMENT IS LIVE!")
    elif status == 'building':
        print(f"\n[*] DEPLOYMENT IN PROGRESS...")

if __name__ == "__main__":
    main()
