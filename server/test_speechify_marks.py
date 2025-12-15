
import os
import requests
import json
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User

def test_speechify():
    try:
        user = User.objects.get(id=1)
        api_key = user.profile.speechify_api_key
        
        if not api_key:
            print("No Speechify key found for user 1.")
            return

        print(f"Using Key: {api_key[:5]}...")
        
        # 1. Test Voices Endpoint (Sanity Check)
        voices_url = "https://api.sws.speechify.com/v1/voices"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        print(f"\n1. Testing Voices: {voices_url}")
        try:
            v_res = requests.get(voices_url, headers=headers)
            print(f"Voices Status: {v_res.status_code}")
            if v_res.status_code == 200:
                print("Voices Auth Success!")
            else:
                print(f"Voices Failed: {v_res.text}")
        except Exception as e:
            print(f"Voices Connection Error: {e}")

        # 2. Test TTS Endpoint
        tts_url = "https://api.sws.speechify.com/v1/audio/speech"
        
        data = {
            "input": "<speak>Hello world</speak>",
            "voice_id": "simon", 
            "audio_format": "mp3",
            "model": "simba-multilingual",
            # Try hinting for marks if supported by generic param names (guessing common ones)
            "options": {"speech_marks": True} 
        }
        
        print(f"\n2. Testing TTS: {tts_url}")
        try:
            # Note: 404 likely means wrong URL path. 
            response = requests.post(tts_url, headers=headers, json=data)
            
            print(f"TTS Status Code: {response.status_code}")
            
            if response.status_code == 200:
                res_json = response.json()
                print("Response Keys:", res_json.keys())
                
                if 'speech_marks' in res_json:
                    print("Found 'speech_marks'!")
                    print(json.dumps(res_json['speech_marks'][:3], indent=2))
                elif 'speechMarks' in res_json:
                     print("Found 'speechMarks'!")
                elif 'marks' in res_json:
                     print("Found 'marks'!")
                else:
                    print("No explicit marks field found in root.")

                # Check inside audio_data? pure base64 usually doesn't have it.
                
            else:
                print(f"TTS Error Body: {response.text}")

        except Exception as e:
            print(f"TTS Connection Error: {e}")

    except Exception as e:
        print(f"Global Exception: {e}")

if __name__ == "__main__":
    test_speechify()
