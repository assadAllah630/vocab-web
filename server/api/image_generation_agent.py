"""
Image Generation Agent
Multi-provider image generator with intelligent fallback and quality validation.
"""

import os
import time
import json
import requests
import base64
import logging
import random
from typing import Dict, List, Any, Optional, Union
from .image_quality_validator import ImageQualityValidator

logger = logging.getLogger(__name__)

class ImageGenerationProvider:
    """Base class for image providers"""
    def generate(self, prompt: str, negative_prompt: str, width: int = 1024, height: int = 576) -> Dict[str, Any]:
        raise NotImplementedError


class PollinationsProvider(ImageGenerationProvider):
    """
    Pollinations.AI - FREE image generation with NO API key required!
    Uses Stable Diffusion models.
    """
    API_URL = "https://image.pollinations.ai/prompt"
    
    def __init__(self):
        logger.info("PollinationsProvider initialized (FREE, no API key needed)")
    
    def generate(self, prompt: str, negative_prompt: str, width: int = 1024, height: int = 576) -> Dict[str, Any]:
        from urllib.parse import quote
        
        # Pollinations doesn't support negative prompts in the same way, so we embed key terms
        full_prompt = prompt
        if negative_prompt:
            # Add "not" keywords for better results
            full_prompt = f"{prompt}, high quality, detailed, professional"
        
        # URL encode the prompt
        encoded_prompt = quote(full_prompt)
        
        # Build URL with parameters
        url = f"{self.API_URL}/{encoded_prompt}?width={width}&height={height}&nologo=true"
        
        try:
            logger.info(f"Pollinations generating: {prompt[:50]}...")
            
            response = requests.get(url, timeout=120, allow_redirects=True)
            
            if response.status_code == 200 and len(response.content) > 1000:
                image_base64 = base64.b64encode(response.content).decode("utf-8")
                logger.info(f"Pollinations SUCCESS! Image size: {len(response.content)} bytes")
                
                return {
                    "success": True,
                    "image_base64": image_base64,
                    "provider": "Pollinations.AI (FREE)"
                }
            else:
                return {
                    "success": False,
                    "error": f"Invalid response: {response.status_code}, size: {len(response.content)}"
                }
                
        except Exception as e:
            logger.error(f"Pollinations error: {str(e)}")
            return {"success": False, "error": str(e)}

class StableHordeProvider(ImageGenerationProvider):
    """
    Provider for Stable Horde (AI Horde).
    Free, distributed, queue-based generation.
    """
    API_URL = "https://stablehorde.net/api/v2/generate/async"
    STATUS_URL = "https://stablehorde.net/api/v2/generate/check"
    GET_IMAGE_URL = "https://stablehorde.net/api/v2/generate/status"
    
    def __init__(self, api_key: str = "0000000000"):
        self.api_key = api_key
        self.client_agent = "VocabMaster:v1.0:(contact@example.com)"

    def generate(self, prompt: str, negative_prompt: str, width: int = 1024, height: int = 576) -> Dict[str, Any]:
        headers = {
            "apikey": self.api_key,
            "Client-Agent": self.client_agent,
            "Content-Type": "application/json"
        }
        
        payload = {
            "prompt": f"{prompt} ### {negative_prompt}",
            "params": {
                "sampler_name": "k_euler_a",
                "cfg_scale": 7.5,
                "steps": 30,
                "width": width,
                "height": height,
                "karras": True,
                "hires_fix": False,
                "clip_skip": 1
            },
            "nsfw": False,
            "censor_nsfw": True,
            "trusted_workers": False,
            "models": ["ICBINP - I Can't Believe It's Not Photography", "stable_diffusion"],
            "r2": True
        }
        
        try:
            # 1. Submit Job
            response = requests.post(self.API_URL, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            job_id = response.json().get("id")
            
            if not job_id:
                return {"success": False, "error": "No job ID received"}
            
            # 2. Poll for completion
            start_time = time.time()
            max_wait = 600  # 10 minutes max
            
            while time.time() - start_time < max_wait:
                # Check status
                status_resp = requests.get(f"{self.STATUS_URL}/{job_id}", headers=headers, timeout=10)
                status_data = status_resp.json()
                
                if status_data.get("done"):
                    # 3. Get Result
                    result_resp = requests.get(f"{self.GET_IMAGE_URL}/{job_id}", headers=headers, timeout=30)
                    result_data = result_resp.json()
                    
                    generations = result_data.get("generations", [])
                    if generations and generations[0].get("img"):
                        return {
                            "success": True,
                            "image_base64": generations[0]["img"],
                            "image_url": generations[0].get("img") if generations[0].get("img").startswith("http") else None,
                            "provider": "Stable Horde"
                        }
                    else:
                        return {"success": False, "error": "Job done but no image returned"}
                
                if status_data.get("faulted"):
                    return {"success": False, "error": "Job faulted on Horde"}
                    
                time.sleep(5)
                
            return {"success": False, "error": "Timeout waiting for Horde"}
            
        except Exception as e:
            logger.error(f"Stable Horde error: {str(e)}")
            return {"success": False, "error": str(e)}

class HuggingFaceProvider(ImageGenerationProvider):
    """Hugging Face Inference API provider using official SDK"""
    
    MODELS = [
        "black-forest-labs/FLUX.1-dev",  # Best quality
        "stabilityai/stable-diffusion-xl-base-1.0",  # Good quality, faster
    ]
    
    def __init__(self, api_token: str):
        from huggingface_hub import InferenceClient
        self.api_token = api_token
        self.client = InferenceClient(api_key=api_token)
        logger.info("HuggingFaceProvider initialized with official SDK")
    
    def generate(self, prompt: str, negative_prompt: str, width: int = 1024, height: int = 576) -> Dict[str, Any]:
        """Generate image using Hugging Face Inference API"""
        import io
        import base64
        
        # Try models in order
        for model in self.MODELS:
            try:
                logger.info(f"Trying Hugging Face model: {model}")
                
                # Use the official SDK
                image = self.client.text_to_image(
                    prompt=prompt,
                    model=model
                )
                
                # Convert PIL Image to base64
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                logger.info(f"Successfully generated image with {model}")
                
                return {
                    "success": True,
                    "image_base64": img_base64,
                    "provider": f"Hugging Face ({model.split('/')[-1]})"
                }
                
            except Exception as e:
                logger.warning(f"Hugging Face model {model} failed: {str(e)}")
                continue
        
        return {
            "success": False,
            "error": "All Hugging Face models failed"
        }

class ImageGenerationAgent:
    """
    Multi-provider image generator with intelligent fallback.
    """
    
    def __init__(self, horde_api_key: Optional[str] = None, hf_api_token: Optional[str] = None):
        # Handle empty strings as None
        if horde_api_key == "":
            horde_api_key = None
        if hf_api_token == "":
            hf_api_token = None
            
        self.horde_key = horde_api_key or os.environ.get("STABLE_HORDE_API_KEY")
        self.hf_token = hf_api_token or os.environ.get("HUGGINGFACE_API_TOKEN")
        
        self.providers = []
        
        # Priority 1: Pollinations.AI (FREE, no API key needed!)
        self.providers.append(PollinationsProvider())
        
        # Priority 2: Stable Horde (Free, but slower)
        horde_key_to_use = self.horde_key or "0000000000"
        self.providers.append(StableHordeProvider(horde_key_to_use))
        
        # Priority 3: Hugging Face (Fast, Rate Limited)
        if self.hf_token:
            self.providers.append(HuggingFaceProvider(self.hf_token))
            
        logger.info(f"ImageGenerationAgent initialized with {len(self.providers)} providers")
            
        self.validator = ImageQualityValidator()
        
    def generate_image(self, prompt: str, negative_prompt: str) -> Dict[str, Any]:
        """
        Try providers in order until one succeeds.
        Returns: {success, image_base64, provider, ...}
        """
        if not self.providers:
            return {
                "success": False,
                "error": "No image generation providers configured. Please add your Stable Horde API Key or Hugging Face API Token in Settings."
            }
        
        last_error = ""
        
        for provider in self.providers:
            try:
                logger.info(f"Attempting generation with {provider.__class__.__name__}...")
                result = provider.generate(prompt, negative_prompt)
                
                if result["success"]:
                    # Validate Image
                    validation = self.validator.validate_image(result.get("image_base64", ""))
                    
                    if validation["valid"]:
                        return result
                    elif validation.get("retry_recommended"):
                        logger.warning(f"Image validation failed: {validation['issues']}. Retrying with adjusted prompt.")
                        # Retry once with adjusted prompt
                        adjusted_negative = negative_prompt + ", " + (validation.get("adjusted_prompt") or "")
                        retry_result = provider.generate(prompt, adjusted_negative)
                        if retry_result["success"]:
                            return retry_result
                    
                    logger.warning("Provider produced invalid image. Trying next provider.")
                    
                else:
                    last_error = result.get("error", "Unknown error")
                    
            except Exception as e:
                logger.error(f"Provider failed: {str(e)}")
                last_error = str(e)
                
        return {
            "success": False, 
            "error": f"All providers failed. Last error: {last_error}"
        }
