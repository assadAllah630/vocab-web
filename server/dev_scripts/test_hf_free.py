import os
import requests
import time

print("Testing Hugging Face Inference API (Free Tier)...")
print("=" * 60)

HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")

# Free tier models that should work
MODELS = [
    "runwayml/stable-diffusion-v1-5",
    "stabilityai/stable-diffusion-2-1",
    "CompVis/stable-diffusion-v1-4",
    "prompthero/openjourney"
]

headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

test_prompt = "A professional digital illustration of a person reading a book in a cozy library"

results = []

for i, model in enumerate(MODELS, 1):
    print(f"\n{i}. TESTING: {model}")
    print("-" * 60)
    
    # Use the inference API endpoint (free tier)
    api_url = f"https://api-inference.huggingface.co/models/{model}"
    
    payload = {
        "inputs": test_prompt
    }
    
    try:
        print(f"Sending request...")
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"SUCCESS! Image generated")
            print(f"Size: {len(response.content)} bytes")
            
            # Save image
            filename = f"hf_free_{i}_{model.split('/')[-1]}.png"
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
            error_data = response.json()
            estimated_time = error_data.get('estimated_time', 20)
            print(f"Model loading... estimated time: {estimated_time}s")
            print(f"Waiting and retrying...")
            time.sleep(min(estimated_time + 5, 30))
            
            # Retry
            response = requests.post(api_url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                print(f"SUCCESS on retry!")
                print(f"Size: {len(response.content)} bytes")
                
                filename = f"hf_free_{i}_{model.split('/')[-1]}.png"
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
print("SUMMARY - FREE TIER HUGGING FACE MODELS")
print("=" * 60)

for i, result in enumerate(results, 1):
    print(f"\n{i}. {result['model']}")
    print(f"   Status: {result['status']}")
    if 'size' in result:
        print(f"   Image size: {result['size']} bytes")
        print(f"   File: {result['file']}")
    if 'error' in result:
        print(f"   Error: {result['error'][:100]}")

print("\n" + "=" * 60)
print("RECOMMENDATION:")
working_models = [r for r in results if 'SUCCESS' in r['status']]
if working_models:
    print(f"GREAT! {len(working_models)} model(s) work with free tier!")
    print("\nBest model to use:")
    print(f"  {working_models[0]['model']}")
else:
    print("Free tier models don't work.")
    print("RECOMMENDATION: Use Stable Horde (already tested and working!)")
print("=" * 60)
