import os
import requests

print("Testing Hugging Face - Correct Method from Docs...")
print("=" * 60)

HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")

# Based on official docs, the endpoint is different for text-to-image
# It uses a different format than the old inference API

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

# Test with FLUX.1-dev as shown in docs
model = "black-forest-labs/FLUX.1-dev"
api_url = f"https://api-inference.huggingface.co/models/{model}"

payload = {
    "inputs": "A professional digital illustration of a person reading a book in a cozy library"
}

print(f"\nTesting: {model}")
print(f"URL: {api_url}")
print("Sending request...")

try:
    response = requests.post(api_url, headers=headers, json=payload, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print(f"\nSUCCESS!")
        print(f"Image size: {len(response.content)} bytes")
        
        with open("hf_flux_test.png", "wb") as f:
            f.write(response.content)
        print("Saved to: hf_flux_test.png")
        
    else:
        print(f"\nResponse body: {response.text}")
        
except Exception as e:
    print(f"Error: {str(e)}")

print("\n" + "=" * 60)
