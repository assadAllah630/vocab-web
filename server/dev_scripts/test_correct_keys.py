import os
import requests
import time

print("Testing API Keys...")
print("=" * 60)

# Test Stable Horde
print("\n1. TESTING STABLE HORDE")
print("-" * 60)

HORDE_KEY = os.environ.get("STABLE_HORDE_API_KEY", "<ADD_YOUR_HORDE_KEY>")
API_URL = "https://stablehorde.net/api/v2/generate/async"

headers = {
    "apikey": HORDE_KEY,
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
print(f"API Key: {HORDE_KEY}")
    print(f"Submitting job...")
    
    response = requests.post(API_URL, json=payload, headers=headers, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 202 or response.status_code == 200:
        print("SUCCESS! Stable Horde key is VALID")
        data = response.json()
        if 'id' in data:
            print(f"Job ID: {data['id']}")
    else:
        print(f"FAILED: {response.text[:200]}")
        
except Exception as e:
    print(f"ERROR: {str(e)}")

# Test Hugging Face
print("\n2. TESTING HUGGING FACE")
print("-" * 60)

HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")

headers_hf = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

# Test with a simple model
hf_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"

payload_hf = {
    "inputs": "A simple test image of a red apple",
    "parameters": {
        "negative_prompt": "blurry, low quality",
        "num_inference_steps": 20
    }
}

try:
    print(f"Token: {HF_TOKEN[:20]}...")
    print(f"Testing API...")
    
    response = requests.post(hf_url, headers=headers_hf, json=payload_hf, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("SUCCESS! Hugging Face token is VALID")
        print(f"Image received: {len(response.content)} bytes")
    elif response.status_code == 503:
        print("SUCCESS! Token is VALID (model is loading)")
        print("This is normal - the model needs to warm up")
    else:
        print(f"Response: {response.text[:200]}")
        
except Exception as e:
    print(f"ERROR: {str(e)}")

print("\n" + "=" * 60)
print("SUMMARY:")
print("Both keys will be tested above.")
print("If both show SUCCESS, you can use them in the app!")
print("=" * 60)
