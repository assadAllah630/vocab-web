"""
HuggingFace Image Generation Adapter
Uses HuggingFace Inference API for image generation.
Free tier: ~1000 requests/day (rate limited)
"""
import httpx
import base64
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Free image models on HuggingFace
IMAGE_MODELS = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
    "CompVis/stable-diffusion-v1-4",
]

HF_API_URL = "https://api-inference.huggingface.co/models"


async def generate_image(
    api_key: str,
    prompt: str,
    size: str = "1024x1024",
    style: Optional[str] = None,
    negative_prompt: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Generate an image using HuggingFace Inference API.
    
    Args:
        api_key: HuggingFace API token
        prompt: Text prompt describing the image
        size: Image size (parsed for width/height)
        style: Optional style modifier
        negative_prompt: Things to avoid in the image
        
    Returns:
        Dict with 'image_base64' and metadata
    """
    # Build the prompt with optional style
    full_prompt = prompt
    if style:
        full_prompt = f"{style} style, {prompt}"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    # Parse size
    try:
        width, height = map(int, size.split("x"))
    except:
        width, height = 1024, 1024
    
    payload = {
        "inputs": full_prompt,
        "parameters": {
            "negative_prompt": negative_prompt or "blurry, bad quality, distorted",
            "width": min(width, 1024),  # SDXL max
            "height": min(height, 1024),
            "num_inference_steps": 25,
            "guidance_scale": 7.5,
        },
        "options": {
            "wait_for_model": True,  # Wait if model is loading
        }
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        for model in IMAGE_MODELS:
            try:
                url = f"{HF_API_URL}/{model}"
                logger.info(f"[HFImage] Trying model: {model}")
                
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    # Response is raw image bytes
                    image_bytes = response.content
                    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                    
                    return {
                        "success": True,
                        "image_base64": image_base64,
                        "mime_type": "image/png",
                        "model": model,
                        "provider": "huggingface"
                    }
                    
                elif response.status_code == 503:
                    # Model is loading
                    logger.info(f"[HFImage] Model {model} is loading, trying next...")
                    continue
                    
                elif response.status_code == 429:
                    logger.warning(f"[HFImage] Rate limited on {model}")
                    continue
                    
                else:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("error", response.text[:200])
                    except:
                        error_msg = response.text[:200]
                    logger.warning(f"[HFImage] {model} returned {response.status_code}: {error_msg}")
                    continue
                    
            except Exception as e:
                logger.error(f"[HFImage] Error with {model}: {e}")
                continue
        
        # All models failed
        return {
            "success": False,
            "error": "All HuggingFace image models failed",
            "provider": "huggingface"
        }


async def validate_key(api_key: str) -> bool:
    """
    Validate a HuggingFace API token.
    """
    try:
        url = "https://huggingface.co/api/whoami-v2"
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            return response.status_code == 200
    except:
        return False
