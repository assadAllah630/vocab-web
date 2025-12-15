
import google.generativeai as genai
import os

KEY = "AIzaSyD-622cutGVfBlteubK6U_sT2BAg3yYyfo"

def test_key():
    print(f"Testing Key: {KEY[:10]}...")
    genai.configure(api_key=KEY)
    
    print("Listing available models...")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                
        # Retry with a known model if found in list (user will see output)
    except Exception as e:
        print(f"FAILED to list models: {e}")

if __name__ == "__main__":
    test_key()
