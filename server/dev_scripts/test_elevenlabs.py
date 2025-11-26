import requests

# Test new ElevenLabs API key
api_key = "sk_14eadc7ea885bcd2341a44a5e186363a7362ca82cc9b7222"

# Test with TTS endpoint
voice_id = "EXAVITQu4vr4xnSDxMaL"
url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": api_key
}
data = {
    "text": "Test",
    "model_id": "eleven_multilingual_v2"
}

print(f"Testing new API key...")
print(f"Key: {api_key[:20]}...")
print(f"URL: {url}")
print()

response = requests.post(url, json=data, headers=headers, timeout=10)

print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")
print()

if response.status_code == 200:
    print(f"✓ API key is VALID - Generated {len(response.content)} bytes of audio")
else:
    print(f"Response Body:")
    print(response.text)
    print("\n✗ API key validation FAILED")
    
    # Try to parse error
    try:
        error_data = response.json()
        if 'detail' in error_data:
            detail = error_data['detail']
            if isinstance(detail, dict):
                print(f"\nError Type: {detail.get('status')}")
                print(f"Error Message: {detail.get('message')}")
    except:
        pass
