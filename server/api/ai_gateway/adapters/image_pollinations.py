"""
Pollinations Image Generation Adapter
Pollinations.AI is completely FREE with NO API key required!
Uses Stable Diffusion models for image generation.
"""
import httpx
import base64
import logging
from typing import Optional, Dict, Any
from urllib.parse import quote

logger = logging.getLogger(__name__)

# Pollinations API - No auth required!
POLLINATIONS_URL = "https://image.pollinations.ai/prompt"


async def generate_image(
    api_key: str = None,  # Not needed but kept for interface compatibility
    prompt: str = "",
    size: str = "1024x1024",
    style: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Generate an image using Pollinations.AI (FREE, no API key).
    
    Args:
        api_key: Not needed, kept for interface compatibility
        prompt: Text prompt describing the image
        size: Image size (width x height)
        style: Optional style modifier
        
    Returns:
        Dict with 'image_base64' and metadata
    """
    # Build the prompt with optional style
    full_prompt = prompt
    if style:
        full_prompt = f"{style} style, {prompt}"
    
    # Parse size
    try:
        width, height = map(int, size.split("x"))
    except:
        width, height = 1024, 1024
    
    # URL encode the prompt
    encoded_prompt = quote(full_prompt)
    
    # Build URL with parameters
    # Format: https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024&seed=random
    url = f"{POLLINATIONS_URL}/{encoded_prompt}?width={width}&height={height}&nologo=true"
    
    logger.info(f"[Pollinations] Generating image: {prompt[:50]}...")
    
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        try:
            response = await client.get(url)
            
            if response.status_code == 200:
                # Response is raw image bytes
                image_bytes = response.content
                
                # Check if we got actual image data
                if len(image_bytes) > 1000:  # Valid image should be at least 1KB
                    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                    
                    logger.info(f"[Pollinations] SUCCESS! Image size: {len(image_bytes)} bytes")
                    
                    return {
                        "success": True,
                        "image_base64": image_base64,
                        "mime_type": "image/png",
                        "model": "stable-diffusion",
                        "provider": "pollinations"
                    }
                else:
                    logger.warning(f"[Pollinations] Got small response: {len(image_bytes)} bytes")
                    return {
                        "success": False,
                        "error": "Invalid image response",
                        "provider": "pollinations"
                    }
                    
            else:
                logger.warning(f"[Pollinations] HTTP {response.status_code}: {response.text[:200]}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "provider": "pollinations"
                }
                
        except Exception as e:
            logger.error(f"[Pollinations] Error: {e}")
            return {
                "success": False,
                "error": str(e),
                "provider": "pollinations"
            }


async def validate_key(api_key: str = None) -> bool:
    """
    Pollinations doesn't need API key - always return True.
    """
    return True
