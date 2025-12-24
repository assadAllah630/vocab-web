import requests
import os

API_KEY = "rnd_iUK6bZ5ewSFUGwQj07GU1DWBVXQV"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def get_services():
    url = "https://api.render.com/v1/services"
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error listing services: {e}")
        return []

def get_latest_deploy(service_id):
    url = f"https://api.render.com/v1/services/{service_id}/deploys?limit=1"
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        if data:
            return data[0]
        return None
    except Exception as e:
        print(f"Error getting deploy for {service_id}: {e}")
        return None

def main():
    print("Checking Render Services...")
    services = get_services()
    
    # Target "vocab-web" specifically or assume the first one is it if multiple
    target_service = None
    for service in services:
        name = service.get('service', {}).get('name')
        if name == 'vocab-web':
            target_service = service
            break

    if target_service:
        s_id = target_service.get('service', {}).get('id')
        s_name = target_service.get('service', {}).get('name')
        print(f"Found Target Service: {s_name} ({s_id})")
        
        deploy = get_latest_deploy(s_id)
        if deploy:
            status = deploy.get('status')
            commit = deploy.get('commit', {}).get('message', 'No commit msg')
            finished = deploy.get('finishedAt')
            print(f"  Latest Deploy Status: {status}")
            print(f"  Commit: {commit}")
            print(f"  Finished At: {finished}")
        else:
            print("  No deploys found.")
    else:
        print("Service 'vocab-web' not found.")
        # fallback print all
        for service in services:
             print(f"- {service.get('service', {}).get('name')} ({service.get('type')})")

if __name__ == "__main__":
    main()
