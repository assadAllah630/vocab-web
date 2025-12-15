import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.conf import settings
from api.models import User

def list_models():
    user = User.objects.first()
    key = getattr(user.profile, 'deepgram_api_key', '') or settings.DEEPGRAM_API_KEY
    
    if not key:
        print("No Deepgram Key found.")
        return

    url = "https://api.deepgram.com/v1/models"
    headers = {
        "Authorization": f"Token {key}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("Found Models:")
            for m in data.get('models', []):
                mid = m.get('model_id')
                name = m.get('name')
                langs = m.get('languages', [])
                if 'de' in langs or 'de' in mid:
                    print(f" - {mid} ({name}) : {langs}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

    # Try specific TTS check? No endpoint for that?
    # I'll just try to hit `speak` with a guess 'aura-asteria-de' and see error?
    
    test_names = [
        # Aura German (Hypothetical)
        "aura-asteria-de", 
        "aura-luna-de", 
        # Standard / Others
        "de-DE-ReannaNeural", # Microsoft?
        "de-DE-GiselaNeural",
        # Maybe just "de"
        "de"
    ]
    
    url_speak = "https://api.deepgram.com/v1/speak"
    for name in test_names:
        print(f"Testing {name}...")
        params = {"model": name}
        json_data = {"text": "Hallo world"}
        res = requests.post(url_speak, headers=headers, params=params, json=json_data)
        if res.status_code == 200:
            print(f"SUCCESS: {name} is valid.")
        else:
            print(f"Failed {name}: {res.status_code}")

if __name__ == "__main__":
    list_models()
