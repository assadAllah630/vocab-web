"""Adapters package for AI Gateway."""

from .base import BaseAdapter, AdapterResponse
from .gemini import GeminiAdapter
from .groq import GroqAdapter
from .huggingface import HuggingFaceAdapter
from .openrouter import OpenRouterAdapter
from .cohere import CohereAdapter
from .deepinfra import DeepInfraAdapter

ADAPTERS = {
    'gemini': GeminiAdapter,
    'groq': GroqAdapter,
    'huggingface': HuggingFaceAdapter,
    'openrouter': OpenRouterAdapter,
    'cohere': CohereAdapter,
    'deepinfra': DeepInfraAdapter,
}


def get_adapter(provider: str, api_key: str, model: str = None) -> BaseAdapter:
    """Get an adapter instance for the given provider."""
    adapter_class = ADAPTERS.get(provider)
    if not adapter_class:
        raise ValueError(f"Unsupported provider: {provider}")
    return adapter_class(api_key=api_key, model=model)


__all__ = ['BaseAdapter', 'AdapterResponse', 'GeminiAdapter', 'GroqAdapter', 'HuggingFaceAdapter', 'OpenRouterAdapter', 'CohereAdapter', 'DeepInfraAdapter', 'ADAPTERS', 'get_adapter']
