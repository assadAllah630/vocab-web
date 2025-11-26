import os
import requests
import base64
import time

print("Testing Hugging Face Models...")
print("=" * 60)

HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")

# Models to test (from your code)
MODELS = [
    "black-forest-labs/FLUX.1-dev",
    "ByteDance/SDXL-Lightning", 
    "stabilityai/stable-diffusion-xl-base-1.0",
    "stabilityai/stable-diffusion-2-1"  # Adding SD 2.1 as 4th option
]

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

test_prompt = "A professional digital illustration of a person reading a book in a cozy library"
negative_prompt = "photorealistic, photo, 3d render, blurry"

results = []

for i, model in enumerate(MODELS, 1):
    print(f"\n{i}. TESTING: {model}")
    print("-" * 60)
    
    api_url = f"https://router.huggingface.co/models/{model}"
    
    payload = {
        "inputs": test_prompt,
        "parameters": {
            "negative_prompt": negative_prompt,
            "num_inference_steps": 25,
            "guidance_scale": 7.5
        }
    }
    
    try:
        print(f"Sending request...")
        response = requests.post(api_url, headers=headers, json=payload, timeout=120)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"SUCCESS! Image generated")
            print(f"Size: {len(response.content)} bytes")
            
            # Save image
            filename = f"hf_test_{i}_{model.split('/')[-1]}.png"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"Saved to: {filename}")
            
            results.append({
                'model': model,
                'status': 'SUCCESS',
                'size': len(response.content),
                'file': filename
            })
            
        elif response.status_code == 503:
            print(f"Model is loading... waiting 20s and retrying")
            time.sleep(20)
            
            # Retry
            response = requests.post(api_url, headers=headers, json=payload, timeout=120)
            if response.status_code == 200:
                print(f"SUCCESS on retry!")
                print(f"Size: {len(response.content)} bytes")
                
                filename = f"hf_test_{i}_{model.split('/')[-1]}.png"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"Saved to: {filename}")
                
                results.append({
                    'model': model,
                    'status': 'SUCCESS (after retry)',
                    'size': len(response.content),
                    'file': filename
                })
            else:
                print(f"Failed on retry: {response.text[:200]}")
                results.append({
                    'model': model,
                    'status': f'FAILED (503 then {response.status_code})',
                    'error': response.text[:200]
                })
        else:
            print(f"FAILED: {response.text[:200]}")
            results.append({
                'model': model,
                'status': f'FAILED ({response.status_code})',
                'error': response.text[:200]
            })
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        results.append({
            'model': model,
            'status': 'ERROR',
            'error': str(e)
        })

# Summary
print("\n" + "=" * 60)
print("SUMMARY OF ALL MODELS")
print("=" * 60)

for i, result in enumerate(results, 1):
    print(f"\n{i}. {result['model']}")
    print(f"   Status: {result['status']}")
    if 'size' in result:
        print(f"   Image size: {result['size']} bytes")
        print(f"   File: {result['file']}")
    if 'error' in result:
        print(f"   Error: {result['error']}")

print("\n" + "=" * 60)
print("RECOMMENDATION:")
working_models = [r for r in results if 'SUCCESS' in r['status']]
if working_models:
    print(f"Use these {len(working_models)} working model(s) in your app!")
    for r in working_models:
        print(f"  - {r['model']}")
else:
    print("No models worked. Stick with Stable Horde for now.")
print("=" * 60)
