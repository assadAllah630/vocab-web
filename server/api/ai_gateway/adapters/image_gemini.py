"""
Gemini Image Generation Adapter
Uses Google's Gemini image generation model for creating images.
Free tier: 500 requests/day
"""
import httpx
import base64
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Image generation models - Use the production model
IMAGE_MODEL = "gemini-2.5-flash-image"

# Alternative models if primary fails
FALLBACK_MODELS = [
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation",
    "imagen-3.0-generate-002",
]


async def generate_image(
    api_key: str,
    prompt: str,
    size: str = "1024x1024",
    style: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Generate an image using Gemini's image generation API.
    
    Args:
        api_key: Gemini API key
        prompt: Text prompt describing the image
        size: Image size (not all sizes supported)
        style: Optional style modifier
        
    Returns:
        Dict with 'image_base64' or 'image_url' and metadata
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{IMAGE_MODEL}:generateContent"
    
    # Build the prompt with optional style
    full_prompt = prompt
    if style:
        full_prompt = f"{style} style: {prompt}"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": full_prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        }
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        for model in FALLBACK_MODELS:
            try:
                model_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                
                logger.info(f"[GeminiImage] Trying model: {model}")
                response = await client.post(model_url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract image from response
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if "inlineData" in part:
                                image_data = part["inlineData"]
                                return {
                                    "success": True,
                                    "image_base64": image_data.get("data"),
                                    "mime_type": image_data.get("mimeType", "image/png"),
                                    "model": model,
                                    "provider": "gemini"
                                }
                    
                    logger.warning(f"[GeminiImage] No image in response from {model}")
                    continue
                    
                elif response.status_code == 429:
                    logger.warning(f"[GeminiImage] Rate limited on {model}")
                    continue
                else:
                    logger.warning(f"[GeminiImage] {model} returned {response.status_code}: {response.text[:200]}")
                    continue
                    
            except Exception as e:
                logger.error(f"[GeminiImage] Error with {model}: {e}")
                continue
        
        # All models failed
        return {
            "success": False,
            "error": "All Gemini image models failed",
            "provider": "gemini"
        }


async def validate_key(api_key: str) -> bool:
    """
    Validate a Gemini API key for image generation capability.
    """
    try:
        # Just check if key can list models
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            return response.status_code == 200
    except:
        return False
