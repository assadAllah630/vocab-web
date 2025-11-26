import os
from huggingface_hub import InferenceClient

print("Testing Hugging Face with InferenceClient (Official SDK)...")
print("=" * 60)

HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")

# Models to test
MODELS = [
    "black-forest-labs/FLUX.1-dev",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
    "prompthero/openjourney-v4"
]

client = InferenceClient(api_key=HF_TOKEN)

for i, model in enumerate(MODELS, 1):
    print(f"\n{i}. TESTING: {model}")
    print("-" * 60)
    
    try:
        print(f"Generating image...")
        image = client.text_to_image(
            prompt="A professional digital illustration of a person reading a book in a cozy library",
            model=model
        )
        
        # Save the image
        filename = f"hf_sdk_test_{i}_{model.split('/')[-1]}.png"
        image.save(filename)
        
        print(f"SUCCESS! Image generated and saved to: {filename}")
        
    except Exception as e:
        print(f"FAILED: {str(e)}")

print("\n" + "=" * 60)
print("Test complete! Check which models worked.")
print("=" * 60)
