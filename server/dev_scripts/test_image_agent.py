
import os
import sys
import django

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.image_generation_agent import ImageGenerationAgent

def test_agent_defaults():
    print("Testing ImageGenerationAgent with defaults...")
    
    # Initialize without keys
    agent = ImageGenerationAgent(horde_api_key=None, hf_api_token=None)
    
    print(f"Providers loaded: {len(agent.providers)}")
    for p in agent.providers:
        print(f" - {p.__class__.__name__}")
        if hasattr(p, 'api_key'):
            print(f"   Key: {p.api_key[:5]}...")

    if len(agent.providers) > 0:
        print("✅ Success: Provider loaded by default.")
    else:
        print("❌ Failure: No providers loaded.")

if __name__ == "__main__":
    test_agent_defaults()
