import requests
import sys

# Configuration
BACKEND_URL = "https://vocab-web-03t1.onrender.com"  # Your Render URL

def test_health():
    print(f"Testing Health Check: {BACKEND_URL}/api/health/")
    try:
        response = requests.get(f"{BACKEND_URL}/api/health/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("✅ Health Check Passed")
        else:
            print("❌ Health Check Failed")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_public_vocab():
    print(f"\nTesting Public Vocab: {BACKEND_URL}/api/public-vocab/")
    try:
        response = requests.get(f"{BACKEND_URL}/api/public-vocab/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ Public Vocab Endpoint Accessible")
            # print(f"Data: {response.json()[:2]}") # Print first 2 items
        else:
            print(f"❌ Public Vocab Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_google_auth():
    print(f"\nTesting Google Auth (Dummy Token): {BACKEND_URL}/api/auth/google/")
    try:
        # Send a dummy token. Expecting 400 Bad Request (Invalid Token).
        # If we get 500, it prints the error message which is what we want!
        payload = {"credential": "dummy_invalid_token_for_testing"}
        response = requests.post(f"{BACKEND_URL}/api/auth/google/", json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 400:
            print("✅ Auth Endpoint reachable (Correctly rejected invalid token)")
        elif response.status_code == 500:
            print("❌ Auth Endpoint Crashed (500)!")
        else:
            print(f"⚠️ Unexpected Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Backend Tests...")
    test_health()
    test_public_vocab()
    test_google_auth()
    print("\nDone.")
