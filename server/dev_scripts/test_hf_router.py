import os
import requests

print("Testing Hugging Face Router API (New Endpoint)...")
print("=" * 60)

HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

# Try the router endpoint
model = "black-forest-labs/FLUX.1-dev"
api_url = f"https://router.huggingface.co/models/{model}"

payload = {
    "inputs": "A professional digital illustration of a person reading a book in a cozy library"
}

print(f"\nTesting: {model}")
print(f"URL: {api_url}")
print("Sending request...")

try:
    response = requests.post(api_url, headers=headers, json=payload, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print(f"\nSUCCESS!")
        print(f"Image size: {len(response.content)} bytes")
        
        with open("hf_router_test.png", "wb") as f:
            f.write(response.content)
        print("Saved to: hf_router_test.png")
        
    else:
        print(f"\nFailed. Response: {response.text[:500]}")
        
except Exception as e:
    print(f"Error: {str(e)}")

print("\n" + "=" * 60)
