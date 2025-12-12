"""
Seed ModelDefinition with all known AI models.

Usage:
    python manage.py seed_models
    python manage.py seed_models --clear  # Clear existing and reseed
"""

from django.core.management.base import BaseCommand
from api.ai_gateway.models import ModelDefinition


# =============================================================================
# MODEL CATALOG - All known models and their specifications
# =============================================================================

MODELS = [
    # -------------------------------------------------------------------------
    # GEMINI (Google)
    # -------------------------------------------------------------------------
    {
        'provider': 'gemini',
        'model_id': 'gemini-2.0-flash',
        'display_name': 'Gemini 2.0 Flash',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': True,
        'context_window': 1000000,
        'max_output_tokens': 8192,
        'default_daily_quota': 1500,
        'default_minute_quota': 15,
        'default_tokens_per_minute': 1000000,
        'typical_latency_ms': 400,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'quota_reset_type': 'first_use',  # Gemini resets 24h after first daily use
        'quota_reset_hour': 17,  # Approximately 7 PM / 17:00 UTC
        'description': 'Latest Gemini model, fast and capable',
    },
    {
        'provider': 'gemini',
        'model_id': 'gemini-1.5-flash',
        'display_name': 'Gemini 1.5 Flash',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': True,
        'context_window': 1000000,
        'max_output_tokens': 8192,
        'default_daily_quota': 1500,
        'default_minute_quota': 15,
        'default_tokens_per_minute': 1000000,
        'typical_latency_ms': 500,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'quota_reset_type': 'first_use',
        'quota_reset_hour': 17,
        'description': 'Previous Gemini flash model, reliable fallback',
    },
    {
        'provider': 'gemini',
        'model_id': 'gemini-1.5-pro',
        'display_name': 'Gemini 1.5 Pro',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': True,
        'context_window': 2000000,
        'max_output_tokens': 8192,
        'default_daily_quota': 50,
        'default_minute_quota': 2,
        'default_tokens_per_minute': 32000,
        'typical_latency_ms': 1000,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'premium',
        'is_free': True,
        'quota_reset_type': 'first_use',
        'quota_reset_hour': 17,
        'description': 'Most capable Gemini, limited free tier',
    },
    {
        'provider': 'gemini',
        'model_id': 'gemini-2.0-flash-imagen',
        'display_name': 'Gemini Imagen',
        'is_text': False,
        'is_image': True,
        'supports_json_mode': False,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 0,
        'max_output_tokens': 0,
        'default_daily_quota': 500,
        'default_minute_quota': 10,
        'default_tokens_per_minute': 0,
        'typical_latency_ms': 3000,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'quota_reset_type': 'first_use',
        'quota_reset_hour': 17,
        'description': 'Gemini image generation',
    },
    
    # -------------------------------------------------------------------------
    # GROQ (Ultra-fast inference)
    # -------------------------------------------------------------------------
    {
        'provider': 'groq',
        'model_id': 'llama-3.3-70b-versatile',
        'display_name': 'Llama 3.3 70B',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': False,
        'context_window': 128000,
        'max_output_tokens': 32768,
        'default_daily_quota': 14400,
        'default_minute_quota': 30,
        'default_tokens_per_minute': 6000,
        'typical_latency_ms': 200,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'description': 'Ultra-fast Llama 3.3 on Groq',
    },
    {
        'provider': 'groq',
        'model_id': 'llama-3.1-8b-instant',
        'display_name': 'Llama 3.1 8B Instant',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': False,
        'context_window': 128000,
        'max_output_tokens': 8000,
        'default_daily_quota': 14400,
        'default_minute_quota': 30,
        'default_tokens_per_minute': 20000,
        'typical_latency_ms': 100,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'medium',
        'is_free': True,
        'description': 'Fastest model, good for simple tasks',
    },
    {
        'provider': 'groq',
        'model_id': 'mixtral-8x7b-32768',
        'display_name': 'Mixtral 8x7B',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 32768,
        'max_output_tokens': 4096,
        'default_daily_quota': 14400,
        'default_minute_quota': 30,
        'default_tokens_per_minute': 5000,
        'typical_latency_ms': 150,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'medium',
        'is_free': True,
        'description': 'Mixtral on Groq, balanced speed/quality',
    },
    
    # -------------------------------------------------------------------------
    # OPENROUTER (Multi-provider gateway)
    # -------------------------------------------------------------------------
    {
        'provider': 'openrouter',
        'model_id': 'meta-llama/llama-3.2-3b-instruct:free',
        'display_name': 'Llama 3.2 3B (Free)',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 131072,
        'max_output_tokens': 4096,
        'default_daily_quota': 10000,
        'default_minute_quota': 20,
        'default_tokens_per_minute': 100000,
        'typical_latency_ms': 500,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'low',
        'is_free': True,
        'description': 'Free Llama via OpenRouter',
    },
    {
        'provider': 'openrouter',
        'model_id': 'mistralai/mistral-7b-instruct:free',
        'display_name': 'Mistral 7B (Free)',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 32768,
        'max_output_tokens': 4096,
        'default_daily_quota': 10000,
        'default_minute_quota': 20,
        'default_tokens_per_minute': 100000,
        'typical_latency_ms': 400,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'medium',
        'is_free': True,
        'description': 'Free Mistral via OpenRouter',
    },
    {
        'provider': 'openrouter',
        'model_id': 'google/gemini-2.0-flash-exp:free',
        'display_name': 'Gemini 2.0 Flash Exp (Free)',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': True,
        'context_window': 1000000,
        'max_output_tokens': 8192,
        'default_daily_quota': 10000,
        'default_minute_quota': 20,
        'default_tokens_per_minute': 100000,
        'typical_latency_ms': 500,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'description': 'Gemini via OpenRouter (alternative routing)',
    },
    
    # -------------------------------------------------------------------------
    # HUGGINGFACE
    # -------------------------------------------------------------------------
    {
        'provider': 'huggingface',
        'model_id': 'meta-llama/Llama-3.2-3B-Instruct',
        'display_name': 'Llama 3.2 3B (HF)',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': False,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 8192,
        'max_output_tokens': 2048,
        'default_daily_quota': 100000,
        'default_minute_quota': 100,
        'default_tokens_per_minute': 1000000,
        'typical_latency_ms': 800,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'low',
        'is_free': True,
        'description': 'HuggingFace inference, high quota',
    },
    {
        'provider': 'huggingface',
        'model_id': 'stabilityai/stable-diffusion-xl-base-1.0',
        'display_name': 'Stable Diffusion XL',
        'is_text': False,
        'is_image': True,
        'supports_json_mode': False,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 0,
        'max_output_tokens': 0,
        'default_daily_quota': 1000,
        'default_minute_quota': 10,
        'default_tokens_per_minute': 0,
        'typical_latency_ms': 5000,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'description': 'SDXL image generation',
    },
    
    # -------------------------------------------------------------------------
    # COHERE
    # -------------------------------------------------------------------------
    {
        'provider': 'cohere',
        'model_id': 'command-r',
        'display_name': 'Command R',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': False,
        'context_window': 128000,
        'max_output_tokens': 4000,
        'default_daily_quota': 1000,
        'default_minute_quota': 20,
        'default_tokens_per_minute': 100000,
        'typical_latency_ms': 600,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'medium',
        'is_free': True,
        'description': 'Cohere Command R, good for RAG',
    },
    
    # -------------------------------------------------------------------------
    # DEEPINFRA
    # -------------------------------------------------------------------------
    {
        'provider': 'deepinfra',
        'model_id': 'meta-llama/Llama-3.3-70B-Instruct',
        'display_name': 'Llama 3.3 70B (DeepInfra)',
        'is_text': True,
        'is_image': False,
        'supports_json_mode': True,
        'supports_function_calling': True,
        'supports_vision': False,
        'context_window': 128000,
        'max_output_tokens': 4096,
        'default_daily_quota': 20000,
        'default_minute_quota': 60,
        'default_tokens_per_minute': 100000,
        'typical_latency_ms': 500,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'high',
        'is_free': True,
        'description': 'Llama 3.3 on DeepInfra',
    },
    
    # -------------------------------------------------------------------------
    # POLLINATIONS (Free image generation)
    # -------------------------------------------------------------------------
    {
        'provider': 'pollinations',
        'model_id': 'flux',
        'display_name': 'Pollinations Flux',
        'is_text': False,
        'is_image': True,
        'supports_json_mode': False,
        'supports_function_calling': False,
        'supports_vision': False,
        'context_window': 0,
        'max_output_tokens': 0,
        'default_daily_quota': 999999,
        'default_minute_quota': 999,
        'default_tokens_per_minute': 0,
        'typical_latency_ms': 8000,
        'cost_per_1k_input_tokens': 0,
        'cost_per_1k_output_tokens': 0,
        'quality_tier': 'medium',
        'is_free': True,
        'description': 'Free unlimited image generation via Pollinations',
    },
]


class Command(BaseCommand):
    help = 'Seed ModelDefinition with all known AI models'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing model definitions before seeding',
        )
    
    def handle(self, *args, **options):
        if options['clear']:
            count = ModelDefinition.objects.count()
            ModelDefinition.objects.all().delete()
            self.stdout.write(f'Deleted {count} existing model definitions')
        
        created = 0
        updated = 0
        
        for model_data in MODELS:
            obj, was_created = ModelDefinition.objects.update_or_create(
                provider=model_data['provider'],
                model_id=model_data['model_id'],
                defaults=model_data
            )
            
            if was_created:
                created += 1
            else:
                updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {created} new models, updated {updated} existing'
            )
        )
        
        # Summary by provider
        self.stdout.write('\nModels by provider:')
        for provider in ['gemini', 'groq', 'openrouter', 'huggingface', 'cohere', 'deepinfra', 'pollinations']:
            count = ModelDefinition.objects.filter(provider=provider).count()
            text_count = ModelDefinition.objects.filter(provider=provider, is_text=True).count()
            image_count = ModelDefinition.objects.filter(provider=provider, is_image=True).count()
            self.stdout.write(f'  {provider}: {count} total ({text_count} text, {image_count} image)')
