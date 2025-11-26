import os
import sys
import django
import logging

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_web.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.image_generation_agent import ImageGenerationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("=" * 60)
print("TESTING FALLBACK LOGIC")
print("=" * 60)

# Initialize agent with INVALID Horde key but VALID HF token
# This should force Horde to fail and fallback to HF
horde_key = "INVALID_KEY_123"
hf_token = os.environ.get("HUGGING_FACE_TOKEN", "<ADD_YOUR_HF_TOKEN>")  # Provide via env for testing

agent = ImageGenerationAgent(horde_api_key=horde_key, hf_api_token=hf_token)

print(f"Providers loaded: {[p.__class__.__name__ for p in agent.providers]}")

print("\nAttempting generation (expecting Horde failure -> HF success)...")
result = agent.generate_image("A cute cat", "ugly, blurry")

print("\nRESULT:")
print(f"Success: {result.get('success')}")
print(f"Provider: {result.get('provider')}")
print(f"Error (if any): {result.get('error')}")

if result.get('success') and "Hugging Face" in result.get('provider'):
    print("\n✅ FALLBACK WORKED! (Horde failed, HF succeeded)")
else:
    print("\n❌ FALLBACK FAILED or HF also failed.")
