"""
Test Gemini API Key with Fallback
"""
import google.generativeai as genai

API_KEY = "AIzaSyDp5DyhgngRWG7kiykmkzCCvOptWJlyunc"
MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash']

for model_name in MODELS:
    try:
        print(f"Testing {model_name}...")
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content('Say hello in German in one word')
        print(f"✅ SUCCESS with {model_name}!")
        print("Response:", response.text)
        break
    except Exception as e:
        error_str = str(e).lower()
        if '429' in str(e) or 'quota' in error_str:
            print(f"❌ {model_name}: Quota exceeded, trying next...")
            continue
        else:
            print(f"❌ {model_name} FAILED:", str(e))
            break
else:
    print("❌ All models exhausted quota!")

