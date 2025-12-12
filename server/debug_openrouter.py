import asyncio
import httpx

API_KEY = "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"
BASE_URL = "https://openrouter.ai/api/v1"
MODELS = [
    "meta-llama/llama-3.1-8b-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "google/gemini-flash-1.5"
]

async def test_key():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vocabmaster.app",
        "X-Title": "VocabMaster AI Gateway"
    }

    print(f"Testing OpenRouter Key: {API_KEY[:10]}...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for model in MODELS:
            print(f"\nTesting Model: {model}")
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": "hi"}],
                "max_tokens": 5
            }
            try:
                response = await client.post(
                    f"{BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    print("SUCCESS! Found working model.")
                    break
                print(f"Response: {response.text[:200]}")
            except Exception as e:
                print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_key())
