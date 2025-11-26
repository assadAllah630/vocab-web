import requests
import time

print("Testing Stable Horde API Key...")
print("=" * 60)

API_KEY = "AqxVnxY3itZzZxYpjUq70A"
API_URL = "https://stablehorde.net/api/v2/generate/async"

headers = {
    "apikey": API_KEY,
    "Client-Agent": "VocabTest:v1.0",
    "Content-Type": "application/json"
}

payload = {
    "prompt": "A simple test image of a red apple",
    "params": {
        "sampler_name": "k_euler_a",
        "cfg_scale": 7.5,
        "steps": 20,
        "width": 512,
        "height": 512
    },
    "nsfw": False,
    "censor_nsfw": True,
    "models": ["stable_diffusion"]
}

try:
    print(f"API Key: {API_KEY}")
    print(f"Submitting job to Stable Horde...")
    
    response = requests.post(API_URL, json=payload, headers=headers, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 202 or response.status_code == 200:
        print("\n✅ API KEY IS VALID!")
        print("Job submitted successfully to Stable Horde")
        data = response.json()
        if 'id' in data:
            print(f"Job ID: {data['id']}")
    elif response.status_code == 401 or response.status_code == 403:
        print("\n❌ API KEY IS INVALID!")
        print("The key was rejected by Stable Horde")
    else:
        print(f"\n⚠️  Unexpected response: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")

print("\n" + "=" * 60)
print("SUMMARY:")
print("1. Stable Horde Key: Test complete (see above)")
print("2. Hugging Face Token: INVALID - you provided a Google API key!")
print("\n💡 TO FIX:")
print("   Get a Hugging Face token from:")
print("   https://huggingface.co/settings/tokens")
print("   It should start with 'hf_'")
