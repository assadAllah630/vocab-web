import requests
import json
from datetime import datetime

API_KEY = "rnd_JQVOEon4Pq96K7Ykda0h1aZiiYe7"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json"
}

def check_services():
    print("🔍 Fetching Render Services...")
    response = requests.get("https://api.render.com/v1/services", headers=HEADERS)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None
    
    services = response.json()
    return services

def check_deploys(service_id):
    print(f"\n📦 Fetching Deployments for {service_id}...")
    response = requests.get(
        f"https://api.render.com/v1/services/{service_id}/deploys",
        headers=HEADERS
    )
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return None
    
    return response.json()

def main():
    output_lines = []
    
    # Get services
    services = check_services()
    if not services:
        return
    
    msg = f"\n✅ Found {len(services)} service(s)\n"
    print(msg)
    output_lines.append(msg)
    
    for service in services:
        name = service.get('service', {}).get('name', 'Unknown')
        service_id = service.get('service', {}).get('id', 'Unknown')
        service_type = service.get('service', {}).get('type', 'Unknown')
        
        msg = f"\n📌 Service: {name}\n   ID: {service_id}\n   Type: {service_type}\n"
        print(msg)
        output_lines.append(msg)
        
        # Get latest deploys
        deploys = check_deploys(service_id)
        if deploys and len(deploys) > 0:
            latest = deploys[0].get('deploy', {})
            status = latest.get('status', 'Unknown')
            commit_info = latest.get('commit', {})
            commit_msg = commit_info.get('message', 'N/A')
            created_at = latest.get('createdAt', 'Unknown')
            
            msg = f"\n   🚀 Latest Deploy:\n"
            msg += f"      Status: {status}\n"
            msg += f"      Commit: {commit_msg}\n"
            msg += f"      Created: {created_at}\n"
            
            if status == 'build_failed':
                msg += f"      ❌ BUILD FAILED!\n"
            elif status == 'live':
                msg += f"      ✅ LIVE\n"
            elif status == 'building':
                msg += f"      🏗️ BUILDING...\n"
            
            print(msg)
            output_lines.append(msg)
        
        sep = "\n" + "="*60 + "\n"
        print(sep)
        output_lines.append(sep)
    
    # Save to file
    with open('render_status.txt', 'w', encoding='utf-8') as f:
        f.write(''.join(output_lines))
    
    print("\n✅ Full output saved to render_status.txt")

if __name__ == "__main__":
    main()
