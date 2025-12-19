"""
Script to VERIFY and SEED ModelDefinitions in the remote database.
- Uses API keys directly provided as environment variables (not from encrypted DB)
- Tests each model with a simple API call
- Seeds only the working models to the remote DB
"""

import os
import asyncio
import httpx
import django
from asgiref.sync import sync_to_async

# --- CONFIGURATION ---
# Set these environment variables before running:
# DATABASE_URL, DJANGO_SECRET_KEY, GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY

os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'YOUR_DATABASE_URL')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
os.environ['DJANGO_SECRET_KEY'] = os.environ.get('DJANGO_SECRET_KEY', 'YOUR_SECRET_KEY')
os.environ['DEBUG'] = 'True'

django.setup()

from api.ai_gateway.models import ModelDefinition

# ========================================================================
# SET THESE ENVIRONMENT VARIABLES BEFORE RUNNING:
# GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
# ========================================================================
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'YOUR_GEMINI_KEY')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', 'YOUR_GROQ_KEY')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', 'YOUR_OPENROUTER_KEY')

# ========================================================================
# END OF USER CONFIGURATION
# ========================================================================

# Candidate Models to Test (Free Tier)
CANDIDATES = {
    'gemini': [
        {'model_id': 'gemini-2.0-flash', 'display_name': 'Gemini 2.0 Flash', 'is_text': True, 'context_window': 1000000, 'quality_tier': 'high', 'is_free': True},
        {'model_id': 'gemini-1.5-flash', 'display_name': 'Gemini 1.5 Flash', 'is_text': True, 'context_window': 1000000, 'quality_tier': 'medium', 'is_free': True},
        {'model_id': 'gemini-2.0-flash-lite', 'display_name': 'Gemini 2.0 Flash Lite', 'is_text': True, 'context_window': 1000000, 'quality_tier': 'medium', 'is_free': True},
        {'model_id': 'gemini-2.5-flash', 'display_name': 'Gemini 2.5 Flash', 'is_text': True, 'context_window': 1000000, 'quality_tier': 'high', 'is_free': True},
    ],
    'groq': [
        {'model_id': 'llama-3.3-70b-versatile', 'display_name': 'Llama 3.3 70B', 'is_text': True, 'context_window': 128000, 'quality_tier': 'high', 'is_free': True},
        {'model_id': 'llama-3.1-8b-instant', 'display_name': 'Llama 3.1 8B Instant', 'is_text': True, 'context_window': 128000, 'quality_tier': 'medium', 'is_free': True},
        {'model_id': 'mixtral-8x7b-32768', 'display_name': 'Mixtral 8x7B', 'is_text': True, 'context_window': 32768, 'quality_tier': 'high', 'is_free': True},
        {'model_id': 'gemma2-9b-it', 'display_name': 'Gemma 2 9B', 'is_text': True, 'context_window': 8192, 'quality_tier': 'medium', 'is_free': True},
    ],
    'openrouter': [
        # NOTE: DeepSeek R1 removed - it's a "reasoning" model that outputs <think> tags which break JSON parsing
        # Good free models for structured output:
        {'model_id': 'deepseek/deepseek-chat-v3-0324:free', 'display_name': 'DeepSeek V3 Chat (Free)', 'is_text': True, 'context_window': 64000, 'quality_tier': 'premium', 'is_free': True},
        {'model_id': 'qwen/qwen3-235b-a22b:free', 'display_name': 'Qwen3 235B (Free)', 'is_text': True, 'context_window': 40000, 'quality_tier': 'premium', 'is_free': True},
        {'model_id': 'qwen/qwen3-32b:free', 'display_name': 'Qwen3 32B (Free)', 'is_text': True, 'context_window': 40000, 'quality_tier': 'high', 'is_free': True},
        {'model_id': 'google/gemini-2.0-flash-exp:free', 'display_name': 'Gemini 2.0 Flash (Free)', 'is_text': True, 'context_window': 1000000, 'quality_tier': 'high', 'is_free': True},
        {'model_id': 'meta-llama/llama-3.3-70b-instruct:free', 'display_name': 'Llama 3.3 70B (Free)', 'is_text': True, 'context_window': 128000, 'quality_tier': 'high', 'is_free': True},
        {'model_id': 'mistralai/mistral-7b-instruct:free', 'display_name': 'Mistral 7B (Free)', 'is_text': True, 'context_window': 32000, 'quality_tier': 'medium', 'is_free': True},
    ]
}

API_KEYS = {
    'gemini': GEMINI_API_KEY,
    'groq': GROQ_API_KEY,
    'openrouter': OPENROUTER_API_KEY
}

# --- SYNC DB HELPERS ---
def db_deactivate_all():
    return ModelDefinition.objects.update(is_active=False)

def db_activate_model(provider, model):
    ModelDefinition.objects.update_or_create(
        provider=provider,
        model_id=model['model_id'],
        defaults={
            'display_name': model['display_name'],
            'is_text': model['is_text'],
            'context_window': model['context_window'],
            'quality_tier': model['quality_tier'],
            'is_free': model.get('is_free', False),
            'is_active': True
        }
    )

# --- API TESTING ---
async def test_gemini(model_id: str, api_key: str) -> bool:
    """Test Gemini model with a simple request."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": "Hi"}]}], "generationConfig": {"maxOutputTokens": 5}}
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                return True
            elif resp.status_code == 429:
                print(f"(Quota Hit - Model Exists)", end="")
                return True  # Model exists, just quota exceeded
            else:
                return False
    except Exception as e:
        print(f"(Error: {e})", end="")
        return False

async def test_groq(model_id: str, api_key: str) -> bool:
    """Test Groq model with a simple request."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": model_id, "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5}
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                return True
            elif resp.status_code == 429:
                print(f"(Quota Hit)", end="")
                return True
            else:
                return False
    except Exception as e:
        print(f"(Error: {e})", end="")
        return False

async def test_openrouter(model_id: str, api_key: str) -> bool:
    """Test OpenRouter model with a simple request."""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vocabmaster.app",
        "X-Title": "VocabMaster Test"
    }
    payload = {"model": model_id, "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5}
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                return True
            elif resp.status_code in (429, 402):
                print(f"(Limit)", end="")
                return False  # For OpenRouter, 402 means no credits for this model
            else:
                return False
    except Exception as e:
        print(f"(Error: {e})", end="")
        return False

TESTERS = {
    'gemini': test_gemini,
    'groq': test_groq,
    'openrouter': test_openrouter
}

async def main():
    print("=" * 60)
    print("VERIFYING AND SEEDING MODELS (REMOTE)")
    print("=" * 60)
    
    # 1. Deactivate ALL models first
    print("\n[STEP 1] Deactivating ALL existing ModelDefinitions...")
    await sync_to_async(db_deactivate_all)()
    
    total_verified = 0
    
    for provider, candidates in CANDIDATES.items():
        print(f"\n[PROVIDER] {provider.upper()}")
        
        api_key = API_KEYS.get(provider)
        if not api_key or api_key.startswith("YOUR_"):
            print(f"   [SKIP] No API Key provided for {provider}")
            continue
        
        tester = TESTERS.get(provider)
        verified_for_provider = 0
        
        for model in candidates:
            model_id = model['model_id']
            print(f"   [TEST] {model_id}...", end="", flush=True)
            
            is_working = await tester(model_id, api_key)
            
            if is_working:
                print(f" [OK]")
                await sync_to_async(db_activate_model)(provider, model)
                verified_for_provider += 1
                total_verified += 1
            else:
                print(f" [FAIL]")
        
        print(f"   [DONE] {verified_for_provider} models verified for {provider}")

    print("\n" + "=" * 60)
    print(f"[COMPLETE] Verified and activated {total_verified} models in remote DB.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
