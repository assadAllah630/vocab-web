"""
Test script for image generation via AI Gateway
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, 'e:/vocab_web/server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.unified_ai import generate_ai_image

User = get_user_model()

def test_image_generation():
    # Get test user
    user = User.objects.filter(username='assad.allah630').first()
    if not user:
        print("Test user not found")
        return
    
    print(f"Testing image generation for user: {user.username}")
    
    # Test prompt
    prompt = "A friendly cartoon owl reading a German language book, colorful, children's book illustration style"
    
    print(f"\nPrompt: {prompt}")
    print("Generating image...")
    
    result = generate_ai_image(user, prompt, size="1024x1024", style="cartoon")
    
    if result.get("success"):
        print(f"\n✅ SUCCESS!")
        print(f"Provider: {result.get('provider')}")
        print(f"Model: {result.get('model')}")
        print(f"Image size: {len(result.get('image_base64', ''))} bytes (base64)")
        
        # Save image to file
        import base64
        image_data = base64.b64decode(result['image_base64'])
        with open('test_generated_image.png', 'wb') as f:
            f.write(image_data)
        print(f"Image saved to: test_generated_image.png")
    else:
        print(f"\n❌ FAILED: {result.get('error')}")

if __name__ == "__main__":
    test_image_generation()
