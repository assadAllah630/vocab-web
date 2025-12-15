
import os
import sys
import django

# Setup Django
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.ai_gateway.models import ModelDefinition, UserAPIKey
from api.ai_gateway.services.model_selector import model_selector
from django.contrib.auth import get_user_model

def seed_models():
    print("Seeding AI Models...")
    
    try:
        # Deactivate 'expensive' or experimental models to force 1.5 Flash usage
        print("Deactivating experimental models...")
        # Use explicit loop if bulk update fails for some reason, but bulk should work.
        # Check if fields exist?
        from django.core.exceptions import FieldError
        
        try:
             ModelDefinition.objects.filter(model_id__icontains='exp').update(is_active=False)
             ModelDefinition.objects.filter(model_id__icontains='2.0').update(is_active=False)
        except FieldError as e:
            print(f"Error deactivating 2.0/exp models: {e}")

        models_to_create = [
            # Gemini - Force 1.5 Flash as primary free model
            {
                'provider': 'gemini',
                'model_id': 'gemini-1.5-flash',
                'display_name': 'Gemini 1.5 Flash (Free)',
                'is_text': True,
                'is_image': False,
                'context_window': 1000000,
                'quality_tier': 'medium',
                'is_free': True,
                'is_active': True 
            },
            {
                'provider': 'gemini',
                'model_id': 'gemini-flash-latest',
                'display_name': 'Gemini Flash Latest (Stable)',
                'is_text': True,
                'is_image': True, # It supports vision
                'context_window': 1000000,
                'quality_tier': 'medium',
                'is_free': True,
                'is_active': True,
                'supports_vision': True,
                'supports_json_mode': True
            },
            # OpenRouter
            {
                'provider': 'openrouter',
                'model_id': 'openai/gpt-3.5-turbo',
                'display_name': 'GPT-3.5 Turbo (via OpenRouter)',
                'is_text': True,
                'is_image': False,
                'context_window': 16384,
                'quality_tier': 'medium'
            },
            {
                 'provider': 'openrouter',
                 'model_id': 'mistralai/mistral-7b-instruct:free',
                 'display_name': 'Mistral 7B (Free)',
                 'is_text': True,
                 'is_image': False,
                 'quality_tier': 'low',
                 'is_free': True
            },
            # Groq
            {
                'provider': 'groq',
                'model_id': 'llama-3.3-70b-versatile',
                'display_name': 'Llama 3.3 70B (Groq)',
                'is_text': True,
                'is_image': False,
                'context_window': 32768,
                'quality_tier': 'high',
                'supports_json_mode': True
            },
            {
                'provider': 'groq',
                'model_id': 'llama-3.1-8b-instant',
                'display_name': 'Llama 3.1 8B (Groq)',
                'is_text': True,
                'is_image': False,
                'context_window': 8192,
                'quality_tier': 'medium',
                'supports_json_mode': True
            },
            {
                'provider': 'groq',
                'model_id': 'mixtral-8x7b-32768',
                'display_name': 'Mixtral 8x7B (Groq)',
                'is_text': True, # Keep Mixtral as fallback
                'quality_tier': 'medium',
                'context_window': 32768,
                'supports_json_mode': True
            }
        ]

        for m_data in models_to_create:
            try:
                obj, created = ModelDefinition.objects.update_or_create(
                    provider=m_data['provider'],
                    model_id=m_data['model_id'],
                    defaults=m_data
                )
                if created:
                    print(f"Created: {obj}")
                else:
                    print(f"Updated: {obj}")
            except Exception as e:
                print(f"Error creating model {m_data.get('model_id')}: {e}")

        print("\nEnsuring ModelInstances for all users...")
        User = get_user_model()
        
        # (Key injection removed per user request)

        for user in User.objects.all():
            try:
                count = model_selector._ensure_model_instances(user)
                if count > 0:
                    print(f"User {user.username}: Created {count} new instances.")
            except Exception as e:
                print(f"Error ensuring instances for {user.username}: {e}")
                
    except Exception as e:
        print(f"CRITICAL SEED ERROR: {e}")

    print("Done!")

if __name__ == '__main__':
    seed_models()
