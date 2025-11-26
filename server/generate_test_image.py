import os
import requests
import base64
import time

print("Generating test image with Stable Horde...")
print("=" * 60)

HORDE_KEY = os.environ.get("STABLE_HORDE_API_KEY", "<ADD_YOUR_HORDE_KEY>")
API_URL = "https://stablehorde.net/api/v2/generate/async"
STATUS_URL = "https://stablehorde.net/api/v2/generate/check"
GET_IMAGE_URL = "https://stablehorde.net/api/v2/generate/status"

headers = {
    "apikey": HORDE_KEY,
    "Client-Agent": "VocabTest:v1.0",
    "Content-Type": "application/json"
}

payload = {
    "prompt": "A professional digital illustration of a person reading a book in a cozy library, warm lighting, detailed, high quality",
    "params": {
        "sampler_name": "k_euler_a",
        "cfg_scale": 7.5,
        "steps": 30,
        "width": 512,
        "height": 512,
        "karras": True
    },
    "nsfw": False,
    "censor_nsfw": True,
    "models": ["stable_diffusion"],
    "r2": True
}

try:
    # Submit job
    print("Submitting generation request...")
    response = requests.post(API_URL, json=payload, headers=headers, timeout=30)
    
    if response.status_code != 202:
        print(f"Failed to submit: {response.text}")
        exit(1)
    
    job_id = response.json().get("id")
    print(f"Job submitted! ID: {job_id}")
    print("Waiting for generation (this may take 1-2 minutes)...")
    
    # Poll for completion
    start_time = time.time()
    max_wait = 300  # 5 minutes
    
    while time.time() - start_time < max_wait:
        status_resp = requests.get(f"{STATUS_URL}/{job_id}", headers=headers, timeout=10)
        status_data = status_resp.json()
        
        wait_time = status_data.get("wait_time", 0)
        queue_position = status_data.get("queue_position", 0)
        
        print(f"Queue position: {queue_position}, Wait time: {wait_time}s", end="\r")
        
        if status_data.get("done"):
            print("\nGeneration complete! Fetching image...")
            
            result_resp = requests.get(f"{GET_IMAGE_URL}/{job_id}", headers=headers, timeout=30)
            result_data = result_resp.json()
            
            generations = result_data.get("generations", [])
            if generations and generations[0].get("img"):
                img_data = generations[0]["img"]
                
                # Save image
                if img_data.startswith("http"):
                    # It's a URL, download it
                    img_resp = requests.get(img_data, timeout=30)
                    img_base64 = base64.b64encode(img_resp.content).decode('utf-8')
                else:
                    # It's already base64
                    img_base64 = img_data
                
                # Save to file
                with open("test_image.txt", "w") as f:
                    f.write(img_base64)
                
                print(f"\nSUCCESS!")
                print(f"Image data length: {len(img_base64)} characters")
                print(f"Saved to: test_image.txt")
                print("\nYou can view it by converting base64 to image")
                break
        
        if status_data.get("faulted"):
            print("\nJob faulted!")
            break
        
        time.sleep(5)
    
except Exception as e:
    print(f"\nError: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
