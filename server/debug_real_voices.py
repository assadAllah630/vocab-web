
import os
import requests
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User

def check_voices():
    user = User.objects.get(id=1)
    api_key = user.profile.speechify_api_key
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 1. Test 'sarah'
    print("\n--- Testing 'sarah' ---")
    data = {
        "input": "Hallo wie geht es dir",
        "voice_id": "sarah",
        "audio_format": "mp3",
        "model": "simba-multilingual",
        "options": {"speech_marks": True}
    }
    res = requests.post("https://api.sws.speechify.com/v1/audio/speech", headers=headers, json=data)
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        rj = res.json()
        marks = rj.get('speech_marks')
        print(f"Marks Type: {type(marks)}")
        if isinstance(marks, dict):
            print(f"Marks Content: {json.dumps(marks, indent=2)}")
        elif isinstance(marks, list) and len(marks) > 0:
            print(f"First Mark Type: {type(marks[0])}")
            print(f"First Mark Content: {marks[0]}")
        elif isinstance(marks, str):
            print(f"Marks Content (Head): {marks[:100]}")
    else:
        print(res.text)

    # 2. Test 'carly'
    print("\n--- Testing 'carly' ---")
    data['voice_id'] = 'carly'
    res = requests.post("https://api.sws.speechify.com/v1/audio/speech", headers=headers, json=data)
    print(f"Status: {res.status_code}")
    if res.status_code != 200:
        print(res.text)

    # 3. List actual voices if failed
    if res.status_code != 200:
        print("\n--- Listing Available Voices (First 10) ---")
        v_res = requests.get("https://api.sws.speechify.com/v1/voices", headers=headers)
        if v_res.status_code == 200:
            voices = v_res.json()
            # Filter for German
            de_voices = [v for v in voices if 'de' in v.get('language_codes', []) or v.get('language') == 'de-DE']
            print(f"Found {len(de_voices)} German voices:")
            for v in de_voices:
                print(f"- {v.get('id')} ({v.get('name')})")
        else:
            print("Failed to list voices.")

if __name__ == '__main__':
    check_voices()
