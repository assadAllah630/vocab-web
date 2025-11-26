"""
Test script to verify image generation with provided API keys
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_web.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.image_generation_agent import ImageGenerationAgent, StableHordeProvider, HuggingFaceProvider

print("=" * 60)
print("IMAGE GENERATION API KEY TEST")
print("=" * 60)

# Test keys provided by user
STABLE_HORDE_KEY = "AqxVnxY3itZzZxYpjUq70A"
HUGGINGFACE_TOKEN = "AIzaSyBIYfLXZiel28VmiglO_xZQn9SA8j_F5Rs"  # This looks like a Google API key!

print("\n1. TESTING STABLE HORDE")
print("-" * 60)
print(f"API Key: {STABLE_HORDE_KEY}")

try:
    horde_provider = StableHordeProvider(api_key=STABLE_HORDE_KEY)
    print("✓ Provider initialized")
    
    # Test with a simple prompt
    test_prompt = "A professional digital illustration of a person reading a book in a cozy library, warm lighting, detailed"
    negative_prompt = "photorealistic, photo, 3d render, blurry, low quality"
    
    print(f"\nGenerating test image...")
    print(f"Prompt: {test_prompt[:50]}...")
    
    result = horde_provider.generate(test_prompt, negative_prompt)
    
    if result['success']:
        print("✅ SUCCESS! Stable Horde is working!")
        print(f"   Provider: {result.get('provider', 'Unknown')}")
        print(f"   Image size: {len(result.get('image_base64', ''))} characters")
    else:
        print(f"❌ FAILED: {result.get('error')}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n\n2. TESTING HUGGING FACE")
print("-" * 60)
print(f"Token: {HUGGINGFACE_TOKEN}")
print("\n⚠️  WARNING: This looks like a Google API key, not a Hugging Face token!")
print("   Hugging Face tokens start with 'hf_'")
print("   Get one at: https://huggingface.co/settings/tokens")

try:
    hf_provider = HuggingFaceProvider(api_token=HUGGINGFACE_TOKEN)
    print("✓ Provider initialized")
    
    test_prompt = "A professional digital illustration of a person reading a book in a cozy library, warm lighting, detailed"
    negative_prompt = "photorealistic, photo, 3d render, blurry, low quality"
    
    print(f"\nGenerating test image...")
    print(f"Prompt: {test_prompt[:50]}...")
    
    result = hf_provider.generate(test_prompt, negative_prompt)
    
    if result['success']:
        print("✅ SUCCESS! Hugging Face is working!")
        print(f"   Provider: {result.get('provider', 'Unknown')}")
        print(f"   Image size: {len(result.get('image_base64', ''))} characters")
    else:
        print(f"❌ FAILED: {result.get('error')}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n\n3. TESTING FULL AGENT")
print("-" * 60)

try:
    agent = ImageGenerationAgent(
        horde_api_key=STABLE_HORDE_KEY,
        hf_api_token=HUGGINGFACE_TOKEN
    )
    
    print(f"✓ Agent initialized")
    print(f"   Providers available: {len(agent.providers)}")
    
    if len(agent.providers) == 0:
        print("❌ NO PROVIDERS AVAILABLE!")
        print("   This means both API keys are invalid or missing")
    else:
        print(f"   Provider 1: {agent.providers[0].__class__.__name__}")
        if len(agent.providers) > 1:
            print(f"   Provider 2: {agent.providers[1].__class__.__name__}")
    
    # Try to generate
    test_prompt = "A professional digital illustration of a person reading a book"
    negative_prompt = "photorealistic, photo"
    
    print(f"\nGenerating with agent...")
    result = agent.generate_image(test_prompt, negative_prompt)
    
    if result['success']:
        print("✅ SUCCESS! Image generated!")
        print(f"   Provider used: {result.get('provider', 'Unknown')}")
    else:
        print(f"❌ FAILED: {result.get('error')}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

print("\n📋 SUMMARY:")
print("1. Stable Horde key: AqxVnxY3itZzZxYpjUq70A")
print("2. Hugging Face token: INVALID (you provided a Google API key)")
print("\n💡 TO FIX:")
print("   Go to https://huggingface.co/settings/tokens")
print("   Create a new token with 'Read' permission")
print("   It should start with 'hf_'")
