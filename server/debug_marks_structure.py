
import os
import requests
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User

def check_structure():
    user = User.objects.get(id=1)
    api_key = user.profile.speechify_api_key
    
    url = "https://api.sws.speechify.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "input": "Hallo Welt",
        "voice_id": "simon",
        "audio_format": "mp3",
        "model": "simba-multilingual",
        "options": {"speech_marks": True}
    }
    
    res = requests.post(url, headers=headers, json=data)
    if res.status_code == 200:
        marks = res.json().get('speech_marks', [])
        print("FIRST MARK STRUCTURE:")
        print(json.dumps(marks[0], indent=2))
        
        # Also check last mark to see if we can deduce duration
        if marks:
            print("LAST MARK:")
            print(json.dumps(marks[-1], indent=2))
    else:
        print(f"Error: {res.text}")

if __name__ == '__main__':
    check_structure()
