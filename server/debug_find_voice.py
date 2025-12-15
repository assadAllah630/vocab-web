
import os
import requests
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User

def find_german_female():
    user = User.objects.get(id=1)
    api_key = user.profile.speechify_api_key
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    print("\n--- Searching for German Female Voices ---")
    v_res = requests.get("https://api.sws.speechify.com/v1/voices", headers=headers)
    if v_res.status_code == 200:
        voices = v_res.json()
        
        # Strategy: Search for 'German' or 'Deutsch' in language fields
        candidates = []
        for v in voices:
            # Check JSON dump string for 'german' to be safe
            s = json.dumps(v).lower()
            if 'german' in s or 'deutsch' in s:
                candidates.append(v)
        
        print(f"Found {len(candidates)} German-related voices.")
        for v in candidates:
            # Print ID, Name, Gender
            print(f"ID: {v.get('id')} | Name: {v.get('display_name')} | Gender: {v.get('gender')}")
            
    else:
        print(f"Failed to list voices: {v_res.status_code}")

if __name__ == '__main__':
    find_german_female()
