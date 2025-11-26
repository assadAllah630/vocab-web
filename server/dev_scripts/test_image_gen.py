"""
Test script to debug image generation
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_web.settings')
django.setup()

from api.image_generation_agent import ImageGenerationAgent

# Test with empty keys (like user hasn't set them)
print("Testing with empty API keys...")
agent = ImageGenerationAgent(horde_api_key="", hf_api_token="")

test_prompt = "A professional digital illustration of a person waking up in the morning, warm lighting, cozy bedroom"
negative_prompt = "photorealistic, photo, 3d render, childish, cartoon"

print(f"Generating image with prompt: {test_prompt}")
result = agent.generate_image(test_prompt, negative_prompt)

print(f"\nResult: {result}")
