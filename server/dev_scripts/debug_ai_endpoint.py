import requests
import json

BASE_URL = 'http://localhost:8000/api'

def test_ai_endpoint():
    session = requests.Session()
    
    # 1. Login (to get session/CSRF)
    # We need to create a user first or use an existing one.
    # Let's try to use the 'test_lang_user' created in previous steps if possible, or create a new one.
    username = 'debug_user'
    password = 'debug_password'
    
    # Signup/Login
    try:
        res = session.post(f'{BASE_URL}/auth/signup/', json={
            'username': username,
            'password': password,
            'email': 'debug@example.com',
            'native_language': 'en',
            'target_language': 'es' # Spanish
        })
    except Exception:
        pass # Maybe already exists
        
    res = session.post(f'{BASE_URL}/auth/signin/', json={
        'username': username,
        'password': password
    })
    
    if res.status_code != 200:
        print(f"Login Failed: {res.text}")
        return

    print("Login Successful")
    
    # 2. Call AI Assistant
    # We use a dummy key. We expect a 400 or 500, but we want to see the response.
    csrftoken = session.cookies.get('csrftoken')
    headers = {'X-CSRFToken': csrftoken}
    
    payload = {
        'api_key': 'dummy_key',
        'prompt': 'Gato',
        'context': 'translation'
    }
    
    res = session.post(f'{BASE_URL}/ai-assistant/', json=payload, headers=headers)
    
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == '__main__':
    test_ai_endpoint()
