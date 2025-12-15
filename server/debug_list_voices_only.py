
import os
import requests
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User

def list_voices():
    user = User.objects.get(id=1)
    api_key = user.profile.speechify_api_key
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    print("\n--- Listing German Voices ---")
    v_res = requests.get("https://api.sws.speechify.com/v1/voices", headers=headers)
    if v_res.status_code == 200:
        voices = v_res.json()
        de_voices = [v for v in voices if 'de' in v.get('language_codes', []) or v.get('language') == 'de-DE']
        print(f"Found {len(de_voices)} German voices:")
        for v in de_voices:
            print(f"- {v.get('id')} ({v.get('name')}) - {v.get('gender')}")
    else:
        print(f"Failed to list voices: {v_res.status_code}")

if __name__ == '__main__':
    list_voices()
