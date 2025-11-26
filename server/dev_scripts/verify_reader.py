import requests
import json

BASE_URL = 'http://localhost:8000/api'
# Use the token from a previous login or hardcode for testing if available
# For this script, we'll assume we need to login first
USERNAME = 'testuser'
PASSWORD = 'testpassword123'

def login():
    try:
        response = requests.post(f'{BASE_URL}/auth/signin/', json={
            'username': USERNAME,
            'password': PASSWORD
        })
        if response.status_code == 200:
            return response.json()['token']
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_saved_texts(token):
    headers = {'Authorization': f'Token {token}'}
    
    # Create
    print("\nTesting Create Saved Text...")
    data = {
        'title': 'Test Article',
        'content': '# Hello World\nThis is a test article with some German words like Zeitgeist and Schadenfreude.'
    }
    res = requests.post(f'{BASE_URL}/saved-texts/', json=data, headers=headers)
    print(f"Create Status: {res.status_code}")
    if res.status_code == 201:
        text_id = res.json()['id']
        print(f"Created Text ID: {text_id}")
        
        # List
        print("\nTesting List Saved Texts...")
        res = requests.get(f'{BASE_URL}/saved-texts/', headers=headers)
        print(f"List Status: {res.status_code}")
        print(f"Count: {len(res.json())}")
        
        # Retrieve
        print("\nTesting Retrieve Saved Text...")
        res = requests.get(f'{BASE_URL}/saved-texts/{text_id}/', headers=headers)
        print(f"Retrieve Status: {res.status_code}")
        
        # Delete
        print("\nTesting Delete Saved Text...")
        res = requests.delete(f'{BASE_URL}/saved-texts/{text_id}/', headers=headers)
        print(f"Delete Status: {res.status_code}")

def test_analyze_text(token):
    headers = {'Authorization': f'Token {token}'}
    print("\nTesting Analyze Text...")
    data = {
        'text': 'Das ist ein Test. Wir lernen Deutsch.'
    }
    res = requests.post(f'{BASE_URL}/analyze-text/', json=data, headers=headers)
    print(f"Analyze Status: {res.status_code}")
    if res.status_code == 200:
        print("Analysis Result:", json.dumps(res.json(), indent=2))

def test_bulk_translate(token):
    headers = {'Authorization': f'Token {token}'}
    print("\nTesting Bulk Translate...")
    # Note: This requires a valid API key in the request or user profile
    # We'll just check if the endpoint is reachable and handles missing key gracefully
    data = {
        'words': ['Haus', 'Maus'],
        'api_key': 'dummy_key' 
    }
    res = requests.post(f'{BASE_URL}/ai/bulk-translate/', json=data, headers=headers)
    print(f"Bulk Translate Status: {res.status_code}")
    print("Response:", res.text)

if __name__ == '__main__':
    print("Starting Verification...")
    # token = login()
    token = '8c1eb6f4061f0a7e27bd026767e23b721c675f9a'
    if token:
        test_saved_texts(token)
        test_analyze_text(token)
        test_bulk_translate(token)
    else:
        print("Skipping tests due to login failure. Please ensure the test user exists.")
