"""
Provider configuration with available models and their quotas.
"""

PROVIDER_MODELS = {
    'gemini': {
        'name': 'Google Gemini',
        'default_model': 'gemini-2.0-flash-exp',
        'models': [
            # Latest 2.5 Series
            {'id': 'gemini-2.5-flash', 'name': 'Gemini 2.5 Flash (Latest)', 'context': 1000000, 'free': True},
            {'id': 'gemini-2.5-pro', 'name': 'Gemini 2.5 Pro', 'context': 1000000, 'free': True},
            # 2.0 Series
            {'id': 'gemini-2.0-flash-exp', 'name': 'Gemini 2.0 Flash (Experimental)', 'context': 1000000, 'free': True},
            {'id': 'gemini-2.0-flash', 'name': 'Gemini 2.0 Flash', 'context': 1000000, 'free': True},
            {'id': 'gemini-2.0-flash-lite', 'name': 'Gemini 2.0 Flash Lite', 'context': 1000000, 'free': True},
            # 1.5 Series (Legacy)
            {'id': 'gemini-1.5-flash', 'name': 'Gemini 1.5 Flash', 'context': 1000000, 'free': True},
            {'id': 'gemini-1.5-flash-8b', 'name': 'Gemini 1.5 Flash 8B', 'context': 1000000, 'free': True},
            {'id': 'gemini-1.5-pro', 'name': 'Gemini 1.5 Pro', 'context': 2000000, 'free': True},
        ],
        'limits': {'minute': 15, 'daily': 1500},
        'reset_time': 'Rolling window (minute), Daily at midnight PT',
    },
    'groq': {
        'name': 'Groq',
        'default_model': 'llama-3.1-70b-versatile',
        'models': [
            {'id': 'llama-3.1-70b-versatile', 'name': 'Llama 3.1 70B', 'context': 128000, 'free': True},
            {'id': 'llama-3.1-8b-instant', 'name': 'Llama 3.1 8B Instant', 'context': 128000, 'free': True},
            {'id': 'mixtral-8x7b-32768', 'name': 'Mixtral 8x7B', 'context': 32768, 'free': True},
            {'id': 'gemma2-9b-it', 'name': 'Gemma 2 9B', 'context': 8192, 'free': True},
        ],
        'limits': {'minute': 30, 'daily': 14400},
        'reset_time': 'Rolling window (minute), Daily at midnight UTC',
    },
    'huggingface': {
        'name': 'HuggingFace',
        'default_model': 'meta-llama/Llama-3.2-3B-Instruct',
        'models': [
            {'id': 'meta-llama/Llama-3.2-3B-Instruct', 'name': 'Llama 3.2 3B', 'context': 8192, 'free': True},
            {'id': 'mistralai/Mistral-7B-Instruct-v0.3', 'name': 'Mistral 7B', 'context': 32768, 'free': True},
            {'id': 'google/flan-t5-xxl', 'name': 'Flan T5 XXL', 'context': 2048, 'free': True},
            {'id': 'bigscience/bloom', 'name': 'BLOOM', 'context': 2048, 'free': True},
        ],
        'limits': {'minute': 100, 'daily': 100000},
        'reset_time': 'Rolling window, models may cold-start',
    },
    'openrouter': {
        'name': 'OpenRouter',
        'default_model': 'meta-llama/llama-3.1-8b-instruct:free',
        'models': [
            {'id': 'meta-llama/llama-3.1-8b-instruct:free', 'name': 'Llama 3.1 8B (Free)', 'context': 128000, 'free': True},
            {'id': 'google/gemma-2-9b-it:free', 'name': 'Gemma 2 9B (Free)', 'context': 8192, 'free': True},
            {'id': 'mistralai/mistral-7b-instruct:free', 'name': 'Mistral 7B (Free)', 'context': 32768, 'free': True},
            {'id': 'qwen/qwen-2-7b-instruct:free', 'name': 'Qwen 2 7B (Free)', 'context': 32768, 'free': True},
            {'id': 'microsoft/phi-3-mini-128k-instruct:free', 'name': 'Phi-3 Mini (Free)', 'context': 128000, 'free': True},
        ],
        'limits': {'minute': 20, 'daily': 10000},
        'reset_time': 'Rolling window, depends on model availability',
    },
    'cohere': {
        'name': 'Cohere',
        'default_model': 'command',
        'models': [
            {'id': 'command', 'name': 'Command', 'context': 4096, 'free': True},
            {'id': 'command-light', 'name': 'Command Light', 'context': 4096, 'free': True},
            {'id': 'command-r', 'name': 'Command R', 'context': 128000, 'free': True},
            {'id': 'command-r-plus', 'name': 'Command R+', 'context': 128000, 'free': True},
        ],
        'limits': {'minute': 100, 'daily': 333},  # ~10k/month
        'reset_time': 'Monthly quota (10,000 calls/month)',
    },
    'deepinfra': {
        'name': 'DeepInfra',
        'default_model': 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        'models': [
            {'id': 'meta-llama/Meta-Llama-3.1-70B-Instruct', 'name': 'Llama 3.1 70B', 'context': 128000, 'free': True},
            {'id': 'meta-llama/Meta-Llama-3.1-8B-Instruct', 'name': 'Llama 3.1 8B', 'context': 128000, 'free': True},
            {'id': 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'name': 'Mixtral 8x7B', 'context': 32768, 'free': True},
            {'id': 'Qwen/Qwen2-72B-Instruct', 'name': 'Qwen 2 72B', 'context': 32768, 'free': True},
        ],
        'limits': {'minute': 60, 'daily': 20000},
        'reset_time': 'Rolling window, resets daily',
    },
}


def get_provider_info(provider: str) -> dict:
    """Get full provider info including models."""
    return PROVIDER_MODELS.get(provider, {})


def get_available_models(provider: str) -> list:
    """Get list of available models for a provider."""
    info = PROVIDER_MODELS.get(provider, {})
    return info.get('models', [])


def get_default_model(provider: str) -> str:
    """Get default model for a provider."""
    info = PROVIDER_MODELS.get(provider, {})
    return info.get('default_model', '')


def get_all_providers() -> dict:
    """Get all provider configurations."""
    return PROVIDER_MODELS
