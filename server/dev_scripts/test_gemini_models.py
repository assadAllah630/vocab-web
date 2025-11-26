"""
Test script to find the correct Gemini model name for the free tier.
This will try different model name formats to find which one works.
"""
import google.generativeai as genai

# Get API key from user
api_key = input("Enter your Gemini API Key: ")
genai.configure(api_key=api_key)

print("Testing different model name formats...\n")

# List of model names to try (based on common formats)
model_names_to_try = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-flash-001',
    'models/gemini-1.5-flash-002',
    'gemini-pro',
    'models/gemini-pro',
]

for model_name in model_names_to_try:
    try:
        print(f"Trying: {model_name}...", end=" ")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello")
        print(f"✓ SUCCESS! Response: {response.text[:50]}...")
        print(f"\n*** USE THIS MODEL NAME: {model_name} ***\n")
        break
    except Exception as e:
        print(f"✗ Failed: {str(e)[:100]}")

print("\n" + "="*60)
print("Listing all available models:")
print("="*60 + "\n")

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✓ {model.name}")
            print(f"  Display: {model.display_name}")
            print(f"  Description: {model.description[:100]}...")
            print()
except Exception as e:
    print(f"Error listing models: {e}")
