from api.image_generation_agent import ImageGenerationAgent, StableHordeProvider

print("=" * 60)
print("TESTING STABLE HORDE API KEY")
print("=" * 60)

STABLE_HORDE_KEY = "AqxVnxY3itZzZxYpjUq70A"

print(f"\nAPI Key: {STABLE_HORDE_KEY}")
print("\nInitializing provider...")

try:
    provider = StableHordeProvider(api_key=STABLE_HORDE_KEY)
    print("✓ Provider initialized successfully")
    
    # Test generation
    prompt = "A professional digital illustration of a person reading a book in a cozy library"
    negative_prompt = "photorealistic, photo, 3d render"
    
    print(f"\nGenerating test image...")
    print(f"This will take 1-2 minutes, please wait...")
    
    result = provider.generate(prompt, negative_prompt, width=1024, height=576)
    
    print("\n" + "=" * 60)
    print("RESULT:")
    print("=" * 60)
    print(f"Success: {result.get('success')}")
    
    if result.get('success'):
        print("✅ IMAGE GENERATED SUCCESSFULLY!")
        print(f"Provider: {result.get('provider')}")
        print(f"Image data length: {len(result.get('image_base64', ''))} characters")
    else:
        print(f"❌ FAILED: {result.get('error')}")
        
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
