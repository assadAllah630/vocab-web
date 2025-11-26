
import os
import requests
import sys
from huggingface_hub import InferenceClient

def test_stable_horde(api_key):
    print(f"\nTesting Stable Horde Key: {api_key[:5]}...")
    
    headers = {
        "apikey": api_key,
        "Client-Agent": "VocabMaster:v1.0:(contact@example.com)",
    }
    
    try:
        # Check user details endpoint which requires auth
        response = requests.get("https://stablehorde.net/api/v2/find_user", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stable Horde Success! User: {data.get('username')}, Kudos: {data.get('kudos')}")
            return True
        elif response.status_code == 401:
            print("❌ Stable Horde Failed: 401 Unauthorized (Invalid Key)")
        else:
            print(f"❌ Stable Horde Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Stable Horde Error: {str(e)}")
    
    return False

def test_hugging_face(api_token):
    print(f"\nTesting Hugging Face Token: {api_token[:5]}...")
    
    try:
        client = InferenceClient(api_key=api_token)
        # Try a simple lightweight call
        user_info = client.get_model_status("bert-base-uncased")
        print(f"✅ Hugging Face Success! Token is valid.")
        return True
    except Exception as e:
        if "401" in str(e) or "Unauthorized" in str(e):
             print("❌ Hugging Face Failed: 401 Unauthorized (Invalid Token)")
        else:
             print(f"❌ Hugging Face Error: {str(e)}")
    
    return False

if __name__ == "__main__":
    # You can pass keys as arguments or set them here for testing
    horde_key = os.environ.get("STABLE_HORDE_API_KEY", "0000000000")
    hf_token = os.environ.get("HUGGINGFACE_API_TOKEN", "")
    
    print("--- Image Generation API Key Tester ---")
    
    test_stable_horde(horde_key)
    
    if hf_token:
        test_hugging_face(hf_token)
    else:
        print("\n⚠️ No Hugging Face token found in environment.")
