import requests
import json

try:
    # We need a session with a logged-in user or at least a valid session cookie
    # Since we can't easily login via script without CSRF handling, let's try to hit a public endpoint or assume dev environment allows it
    # Actually, let's just use the existing cookies file if possible, or try to login first
    
    # For now, let's try to hit the API and see if we get a 403 or a response
    # If we get 403, we know the server is up at least.
    
    response = requests.get('http://localhost:8000/api/vocab/')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            print("Response is a LIST")
            print(f"Length: {len(data)}")
        elif isinstance(data, dict) and 'results' in data:
            print("Response is PAGINATED (dict with 'results')")
            print(f"Count: {data.get('count')}")
        else:
            print("Response is UNKNOWN structure")
            print(type(data))
    else:
        print("Failed to fetch vocab (likely auth required)")
        
except Exception as e:
    print(f"Error: {e}")
