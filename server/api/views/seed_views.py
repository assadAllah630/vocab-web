from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from api.ai_gateway.models import ModelDefinition
from django.core.exceptions import FieldError

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])  # Allow any authenticated user for now to make it easy for User 8
def seed_ai_models_view(request):
    try:
        # Deactivate 'expensive' or experimental models
        try:
             ModelDefinition.objects.filter(model_id__icontains='exp').update(is_active=False)
             ModelDefinition.objects.filter(model_id__icontains='2.0').update(is_active=False)
        except FieldError:
            pass

        models_to_create = [
            # Gemini models
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
                'is_image': True,
                'context_window': 1000000,
                'quality_tier': 'medium',
                'is_free': True,
                'is_active': True 
            },
             {
                'provider': 'gemini',
                'model_id': 'gemini-1.5-pro',
                'display_name': 'Gemini 1.5 Pro',
                'is_text': True,
                'is_image': True,
                'context_window': 2000000,
                'quality_tier': 'high',
                'is_active': True
            },
            # Groq Models
             {
                'provider': 'groq',
                'model_id': 'llama3-70b-8192',
                'display_name': 'Llama 3 70B (Groq)',
                'is_text': True,
                'context_window': 8192,
                'quality_tier': 'high',
                'is_active': True
            },
            {
                'provider': 'groq',
                'model_id': 'mixtral-8x7b-32768',
                'display_name': 'Mixtral 8x7B (Groq)',
                'is_text': True,
                'context_window': 32768,
                'quality_tier': 'high',
                'is_active': True
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for model_data in models_to_create:
            obj, created = ModelDefinition.objects.update_or_create(
                provider=model_data['provider'],
                model_id=model_data['model_id'],
                defaults=model_data
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        return JsonResponse({
            'status': 'success',
            'message': f'Seeded {created_count} models, updated {updated_count}.',
            'created': created_count,
            'updated': updated_count
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
