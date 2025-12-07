"""
Gemini AI Helper Module

Provides centralized Gemini model configuration with automatic fallback
when quota is exceeded on one model.

Model order (best to worst by capability):
1. gemini-2.5-flash - Latest, most capable
2. gemini-2.0-flash - Fast, balanced
3. gemini-2.0-flash-lite - Most generous free quota
"""
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)

# Models ordered from best capability to most generous quota
GEMINI_MODELS = [
    'gemini-2.5-flash',      # Best: Latest and most capable
    'gemini-2.0-flash',      # Good: Fast and balanced
    'gemini-2.0-flash-lite', # Fallback: Most generous free tier
]


def generate_content(api_key: str, prompt: str, generation_config: dict = None):
    """
    Generate content using Gemini with automatic model fallback.
    
    Args:
        api_key: Gemini API key
        prompt: The prompt to send to the model
        generation_config: Optional generation configuration
    
    Returns:
        The model response
        
    Raises:
        Exception if all models fail
    """
    genai.configure(api_key=api_key)
    last_error = None
    
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            if generation_config:
                response = model.generate_content(prompt, generation_config=generation_config)
            else:
                response = model.generate_content(prompt)
            logger.info(f"[Gemini] Success with {model_name}")
            return response
        except Exception as e:
            error_str = str(e).lower()
            last_error = e
            if '429' in str(e) or 'quota' in error_str or 'exceeded' in error_str:
                logger.warning(f"[Gemini] {model_name} quota exceeded, trying next...")
                continue
            # For non-quota errors, try next model too
            logger.warning(f"[Gemini] {model_name} failed: {e}, trying next...")
            continue
    
    # All models failed
    raise Exception(f"All Gemini models failed. Last error: {last_error}")


def get_model(api_key: str):
    """
    Get a Gemini model instance with fallback.
    Tests each model and returns the first working one.
    
    Args:
        api_key: Gemini API key
    
    Returns:
        Tuple of (model, model_name)
    """
    genai.configure(api_key=api_key)
    
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            # Quick test to verify model works
            response = model.generate_content("Hi", generation_config={'max_output_tokens': 5})
            if response.text:
                logger.info(f"[Gemini] Using model: {model_name}")
                return model, model_name
        except Exception as e:
            error_str = str(e).lower()
            if '429' in str(e) or 'quota' in error_str or 'exceeded' in error_str:
                logger.warning(f"[Gemini] {model_name} quota exceeded, trying next...")
                continue
            logger.warning(f"[Gemini] {model_name} failed: {e}")
            continue
    
    # Return last model anyway, let caller handle errors
    logger.warning("[Gemini] All models seem unavailable, using last fallback")
    return genai.GenerativeModel(GEMINI_MODELS[-1]), GEMINI_MODELS[-1]


class GeminiAgent:
    """
    Base class for Gemini-powered agents with automatic fallback.
    """
    
    def __init__(self, api_key: str, generation_config: dict = None):
        self.api_key = api_key
        self.generation_config = generation_config or {}
        self._model = None
        self._model_name = None
    
    @property
    def model(self):
        """Lazy-load model with fallback."""
        if self._model is None:
            self._model, self._model_name = get_model(self.api_key)
        return self._model
    
    def generate(self, prompt: str, config_override: dict = None):
        """Generate content with fallback."""
        config = {**self.generation_config, **(config_override or {})}
        return generate_content(self.api_key, prompt, config if config else None)
