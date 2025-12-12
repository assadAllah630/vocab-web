"""
OpenRouter Image Generation Adapter
Uses OpenRouter to access various image generation models.
Fallback when Gemini and HuggingFace quotas are exhausted.
"""
import httpx
import base64
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# OpenRouter image models (check availability)
IMAGE_MODELS = [
    "black-forest-labs/flux-schnell",  # Fast, good quality
    "stabilityai/stable-diffusion-xl",
    "openai/dall-e-3",  # If available
]

OPENROUTER_API_URL = "https://openrouter.ai/api/v1"


async def generate_image(
    api_key: str,
    prompt: str,
    size: str = "1024x1024",
    style: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Generate an image using OpenRouter API.
    
    Args:
        api_key: OpenRouter API key
        prompt: Text prompt describing the image
        size: Image size
        style: Optional style modifier
        
    Returns:
        Dict with 'image_base64' or 'image_url' and metadata
    """
    # Build the prompt with optional style
    full_prompt = prompt
    if style:
        full_prompt = f"{style} style: {prompt}"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vocabmaster.app",
        "X-Title": "VocabMaster Image Generation",
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        for model in IMAGE_MODELS:
            try:
                url = f"{OPENROUTER_API_URL}/images/generations"
                
                payload = {
                    "model": model,
                    "prompt": full_prompt,
                    "n": 1,
                    "size": size,
                    "response_format": "b64_json",
                }
                
                logger.info(f"[OpenRouterImage] Trying model: {model}")
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract image data
                    images = data.get("data", [])
                    if images:
                        image_data = images[0]
                        
                        if "b64_json" in image_data:
                            return {
                                "success": True,
                                "image_base64": image_data["b64_json"],
                                "mime_type": "image/png",
                                "model": model,
                                "provider": "openrouter"
                            }
                        elif "url" in image_data:
                            # Fetch the image and convert to base64
                            img_response = await client.get(image_data["url"])
                            if img_response.status_code == 200:
                                image_base64 = base64.b64encode(img_response.content).decode("utf-8")
                                return {
                                    "success": True,
                                    "image_base64": image_base64,
                                    "mime_type": "image/png",
                                    "model": model,
                                    "provider": "openrouter"
                                }
                    
                    logger.warning(f"[OpenRouterImage] No image in response from {model}")
                    continue
                    
                elif response.status_code == 429:
                    logger.warning(f"[OpenRouterImage] Rate limited on {model}")
                    continue
                    
                elif response.status_code == 404:
                    logger.warning(f"[OpenRouterImage] Model {model} not available")
                    continue
                    
                else:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("error", {}).get("message", response.text[:200])
                    except:
                        error_msg = response.text[:200]
                    logger.warning(f"[OpenRouterImage] {model} returned {response.status_code}: {error_msg}")
                    continue
                    
            except Exception as e:
                logger.error(f"[OpenRouterImage] Error with {model}: {e}")
                continue
        
        # All models failed
        return {
            "success": False,
            "error": "All OpenRouter image models failed",
            "provider": "openrouter"
        }


async def validate_key(api_key: str) -> bool:
    """
    Validate an OpenRouter API key.
    """
    try:
        url = f"{OPENROUTER_API_URL}/auth/key"
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            return response.status_code == 200
    except:
        return False
