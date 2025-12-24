from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json
from .models import UserProfile
from .prompts import ContextEngineer
from .agent_exam import build_exam_graph
from .unified_ai import generate_ai_content, get_ai_status
from .gemini_helper import generate_content as generate_with_fallback  # Legacy for validate

from django_ratelimit.decorators import ratelimit



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/m', block=True)
def ai_assistant(request):
    """
    Endpoint to interact with Google Gemini API.
    Expects 'prompt', and optional 'context' in the request body.
    API Key is retrieved from UserProfile.
    """
    prompt = request.data.get('prompt')
    context = request.data.get('context', '') # e.g., 'translation', 'chat', 'quiz_generation'

    # Check for API keys using unified status
    ai_status = get_ai_status(request.user)
    if not ai_status['has_gateway_keys']:
        return Response({'error': 'No API keys available. Add a Gemini key in Settings or configure AI Gateway.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not prompt:
        return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get user languages
        try:
            profile = request.user.profile
            native_lang_code = profile.native_language
            target_lang_code = profile.target_language
        except UserProfile.DoesNotExist:
            native_lang_code = 'en'
            target_lang_code = 'de'
        except AttributeError:
             # Handle AnonymousUser if needed, though permission_classes should prevent this
             native_lang_code = 'en'
             target_lang_code = 'de'

        context_engineer = ContextEngineer(native_lang_code, target_lang_code)

        # Construct a more specific prompt based on context
        final_prompt = prompt
        if context == 'translation':
            final_prompt = context_engineer.get_translation_prompt(prompt)
        elif context == 'chat':
            system_instruction = context_engineer.get_chat_system_instruction()
            final_prompt = f"{system_instruction}\n\nUser says: {prompt}"

        # Use unified AI helper (tries gateway keys first, then profile key)
        response = generate_ai_content(request.user, final_prompt)
        
        # Handle JSON parsing for translation context
        # Handle JSON parsing for translation context
        if context == 'translation':
            try:
                # Clean up markdown code blocks if present
                text = response.text.strip()
                import re
                import ast

                # Try to find JSON object within the text using regex
                # This handles ```json ... ```, ``` ... ```, or just text with JSON inside
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    text = json_match.group(0)
                
                try:
                    data = json.loads(text)
                except json.JSONDecodeError:
                    try:
                        # Try ast.literal_eval for single-quoted Python dicts (common in some LLM outputs)
                        data = ast.literal_eval(text)
                        if not isinstance(data, dict):
                            raise ValueError("Parsed content is not a dictionary")
                    except (ValueError, SyntaxError):
                        # Try one more clean up - sometimes newlines break JSON
                        text_clean = text.replace('\n', ' ')
                        data = json.loads(text_clean)
                    
                return Response(data)
            except Exception as e:
                print(f"JSON Parse Error: {e} - Text: {response.text}")
                # Fallback if JSON parsing fails
                return Response({'translation': response.text, 'type': 'unknown', 'example': ''})

        return Response({'response': response.text})

    except Exception as e:
        error_msg = str(e)
        if "Quota exceeded" in error_msg or "429" in error_msg:
             return Response({'error': 'AI Quota Exceeded. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_gateway_status(request):
    """
    Check if the current user has valid AI Gateway keys.
    Returns status and available providers.
    """
    ai_status = get_ai_status(request.user)
    return Response({
        'has_keys': ai_status['has_gateway_keys'],
        'key_count': ai_status['gateway_keys_count'],
        'providers': ai_status['providers_available'],
        'has_legacy_key': ai_status.get('has_legacy_key', False),
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='5/m', block=True)
def generate_exam(request):
    """
    Endpoint to generate a full exam asynchronously.
    Expects 'topic', 'level', and 'question_types' in request body.
    Returns 202 Accepted with exam ID immediately.
    """
    topic = request.data.get('topic')
    level = request.data.get('level', 'B1')
    question_types = request.data.get('question_types', ['cloze', 'multiple_choice'])
    vocab_list = request.data.get('vocab_list') or request.data.get('vocab_focus')
    grammar_list = request.data.get('grammar_list') or request.data.get('grammar_focus')
    notes = request.data.get('notes') or request.data.get('additional_notes')
    
    if not topic:
        return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

    # CRITICAL: Check if user has API keys BEFORE starting background generation
    ai_status = get_ai_status(request.user)
    if not ai_status['has_gateway_keys']:
        return Response({
            'error': 'No API keys configured. Please add your AI API keys (Gemini, Groq, or OpenRouter) in Settings before generating exams.',
            'code': 'NO_API_KEYS',
            'action': 'settings'  # Frontend can use this to redirect to settings
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get user's target language
        try:
            target_language = request.user.profile.target_language
            native_language = request.user.profile.native_language
        except:
            target_language = 'de'
            native_language = 'en'
        
        # 1. Create PENDING Exam immediately
        from .models import Exam
        exam = Exam.objects.create(
            user=request.user,
            language=target_language,
            native_language=native_language,
            topic=topic,
            difficulty=level,
            questions=[], # Empty initially
            status='processing'
        )
        
        # 2. Prepare Data for Background Job
        prompt_data = {
            "prompt": f"Create a language exam (Level {level}) for {topic}. Target: {target_language}. Types: {question_types}", # Simplified prompt, actual graph logic should be inside thread or thread calls graph
            # Wait, the original code called `build_exam_graph` and `app.invoke`.
            # To keep logic simple for this refactor, we will pass necessary args to the thread
            # and let the thread (or service) handle the heavy lifting.
            # Ideally `ExamGenerator` in service should import `build_exam_graph` and run it.
            # My service code used `unified_ai` directly. I should update the service to use `build_exam_graph`
            # OR pass the graph logic info.
            # For now, let's pass all needed info to the service.
            "topic": topic,
            "level": level,
            "question_types": question_types,
            "vocab_list": vocab_list,
            "grammar_list": grammar_list,
            "notes": notes,
            "target_language": target_language
        }
        
        # 3. Start Background Thread
        from .services.background_exam import start_exam_generation
        # We need to bridge the gap: `background_exam.py` currently uses `generate_ai_content` direct prompt.
        # But `generate_exam` view used `LangGraph`. 
        # I should have checked this discrepancy.
        # FIX: I will update `background_exam.py` to use `build_exam_graph` in next step.
        # For now, we setup the call.
        start_exam_generation(exam.id, request.user, prompt_data)
        
        # 4. Return Pending Status
        return Response({
            'id': exam.id,
            'status': 'processing',
            'message': 'Exam generation started. You will be notified when ready.'
        }, status=status.HTTP_202_ACCEPTED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/m', block=True)
def validate_key(request):
    """
    Endpoint to validate a Google Gemini API Key.
    """
    api_key = request.data.get('api_key')
    if not api_key:
        return Response({'valid': False, 'error': 'API Key is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Use fallback helper for automatic model switching on quota exceeded
        response = generate_with_fallback(api_key, "Hello")
        if response.text:
            return Response({'valid': True})
        else:
            return Response({'valid': False, 'error': 'No response from AI'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'valid': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='20/m', block=True)
def bulk_translate(request):
    """
    Translate multiple words at once.
    Expects 'words' (list of strings) in request body.
    """
    words = request.data.get('words', [])
    
    # Check for keys
    ai_status = get_ai_status(request.user)
    if not ai_status['has_gateway_keys']:
        return Response({'error': 'No API keys available. Add keys in Settings or AI Gateway.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not words or not isinstance(words, list):
        return Response({'error': 'List of words is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Limit batch size
    if len(words) > 20:
        return Response({'error': 'Batch size limited to 20 words'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get user languages
        try:
            profile = request.user.profile
            native_lang_code = profile.native_language
            target_lang_code = profile.target_language
        except UserProfile.DoesNotExist:
            native_lang_code = 'en'
            target_lang_code = 'de'

        context_engineer = ContextEngineer(native_lang_code, target_lang_code)
        
        # Construct bulk prompt
        prompt = f"""
        Translate the following list of words from {target_lang_code} to {native_lang_code}.
        Return a JSON object where keys are the original words and values are objects containing:
        - translation: The translation
        - type: Part of speech - MUST be EXACTLY one of these values: noun, verb, adjective, article, pronoun, numeral, adverb, preposition, conjunction, interjection, phrase, other
        - example: A simple example sentence in {target_lang_code}
        - synonyms: List of synonyms (max 3) in {target_lang_code}
        - antonyms: List of antonyms (max 3) in {target_lang_code}
        - related_words: List of related words (max 3) in {target_lang_code}
        - related_concepts: List of related abstract concepts (max 3) in {native_lang_code}
        
        IMPORTANT: For the "type" field, use ONLY these exact values (lowercase):
        - noun (for all nouns, singular or plural)
        - verb (for all verbs)
        - adjective
        - article
        - pronoun
        - numeral
        - adverb
        - preposition
        - conjunction
        - interjection
        - phrase (for multi-word expressions)
        - other (if none of the above fit)
        
        DO NOT use compound types like "noun (plural)" or "verb (past tense)". Just use the base type.
        
        Words: {', '.join(words)}
        
        JSON Response only.
        """
        
        # Use unified AI helper (gateway + legacy fallback)
        response = generate_ai_content(request.user, prompt)
        
        # Clean and parse JSON
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.endswith('```'):
            text = text[:-3]
            
        data = json.loads(text)
        return Response(data)

    except Exception as e:
        error_msg = str(e)
        if "Quota exceeded" in error_msg or "429" in error_msg:
             return Response({'error': 'AI Quota Exceeded. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/m', block=True)
def generate_vocab_list(request):
    """
    Generate a vocabulary list using the Vocabulary Agent.
    Expects 'topic' and optional 'count', 'level', 'target_language'.
    """
    topic = request.data.get('topic')
    if not topic:
        return Response({'error': 'Topic is required'}, status=400)
    
    count = request.data.get('count', 10)
    level = request.data.get('level', 'B1')
    
    # Get user languages
    try:
        profile = request.user.profile
        target_lang_code = profile.target_language
        # Map code to name if needed, but agent handles string
        lang_map = {'de': 'German', 'en': 'English', 'es': 'Spanish', 'fr': 'French'}
        target_language = lang_map.get(target_lang_code, 'German') 
    except:
        target_language = 'German'

    # Check Gateway Keys
    ai_status = get_ai_status(request.user)
    if not ai_status['has_gateway_keys']:
        return Response({'error': 'No AI keys configured.'}, status=400)

    try:
        from .agents.vocabulary_agent import run_vocabulary_agent
        vocab_list = run_vocabulary_agent(
            user=request.user, 
            topic=topic, 
            level=level, 
            target_language=target_language, 
            count=count
        )
        return Response(vocab_list)
    except Exception as e:
         return Response({'error': str(e)}, status=500)


# =============================================================================
# AI GATEWAY KEY MANAGEMENT
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ai_gateway_keys(request):
    """
    Manage AI Gateway API keys.
    GET: List all user's keys (masked)
    POST: Add a new key
    """
    from .ai_gateway.models import UserAPIKey
    
    if request.method == 'GET':
        keys = UserAPIKey.objects.filter(user=request.user).order_by('-created_at')
        result = []
        for key in keys:
            # Get last 4 chars of encrypted key (just for display, not actual key)
            masked = f"...{key.api_key_encrypted[-4:]}" if len(key.api_key_encrypted) > 4 else "****"
            result.append({
                'id': key.id,
                'provider': key.provider,
                'label': key.key_nickname or '',
                'is_active': key.is_active,
                'health_score': key.health_score,
                'requests_today': key.requests_today,
                'created_at': key.created_at.isoformat(),
                'masked_key': masked,
            })
        return Response(result)
    
    elif request.method == 'POST':
        provider = request.data.get('provider')
        api_key = request.data.get('api_key')
        label = request.data.get('label', '')
        
        if not provider or not api_key:
            return Response({'error': 'provider and api_key are required'}, status=400)
        
        valid_providers = ['gemini', 'openrouter', 'groq', 'huggingface']
        if provider not in valid_providers:
            return Response({'error': f'Invalid provider. Must be one of: {valid_providers}'}, status=400)
        
        # Create the key with correct field names
        key = UserAPIKey.objects.create(
            user=request.user,
            provider=provider,
            api_key_encrypted=api_key,  # Store as encrypted (model handles this)
            key_nickname=label,
            is_active=True
        )
        
        return Response({
            'id': key.id,
            'provider': key.provider,
            'label': key.key_nickname,
            'is_active': key.is_active,
            'message': 'API key added successfully'
        }, status=201)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def ai_gateway_key_detail(request, key_id):
    """
    Manage a single AI Gateway key.
    GET: View key details
    PATCH: Update key (enable/disable, update label)
    DELETE: Remove the key
    """
    from .ai_gateway.models import UserAPIKey
    
    try:
        key = UserAPIKey.objects.get(id=key_id, user=request.user)
    except UserAPIKey.DoesNotExist:
        return Response({'error': 'Key not found'}, status=404)
    
    if request.method == 'GET':
        masked = f"...{key.api_key_encrypted[-4:]}" if len(key.api_key_encrypted) > 4 else "****"
        return Response({
            'id': key.id,
            'provider': key.provider,
            'label': key.key_nickname or '',
            'is_active': key.is_active,
            'health_score': key.health_score,
            'requests_today': key.requests_today,
            'created_at': key.created_at.isoformat(),
            'masked_key': masked,
        })
    
    elif request.method == 'PATCH':
        if 'is_active' in request.data:
            key.is_active = request.data['is_active']
        if 'label' in request.data:
            key.key_nickname = request.data['label']
        key.save()
        
        return Response({
            'id': key.id,
            'provider': key.provider,
            'is_active': key.is_active,
            'label': key.key_nickname,
            'message': 'Key updated successfully'
        })
    
    elif request.method == 'DELETE':
        key.delete()
        return Response({'message': 'Key deleted successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='20/m', block=True)
def generate_quiz(request):
    """
    Generate quick quiz questions using AI.
    Expects 'topic', 'count', 'level', 'target_language' in request body.
    """
    topic = request.data.get('topic')
    count = int(request.data.get('count', 3))
    
    # Defaults handled by profile or fallback
    try:
        profile = request.user.profile
        level = request.data.get('level', profile.level or 'B1')
        target_lang = request.data.get('target_language', profile.target_language or 'de')
    except:
        level = request.data.get('level', 'B1')
        target_lang = request.data.get('target_language', 'de')

    if not topic:
        return Response({'error': 'Topic is required'}, status=400)

    # Check keys
    ai_status = get_ai_status(request.user)
    if not ai_status['has_gateway_keys']:
        return Response({'error': 'No AI keys configured.'}, status=400)

    # Language Map (Expand as needed)
    lang_map = {
        'de': 'German', 'en': 'English', 'es': 'Spanish', 'fr': 'French', 
        'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
        'zh': 'Chinese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi'
    }
    target_lang_name = lang_map.get(target_lang, target_lang)

    prompt = f"""
    Create a quick {count}-question multiple-choice quiz for a {level} level student learning {target_lang_name}.
    Topic: {topic}
    
    Return a JSON array of objects. Each object must have:
    - question: The question text (in {target_lang_name})
    - options: Array of 4 answer choices
    - answer: The correct option string (must match one of the options)
    
    Example JSON structure:
    [
      {{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "A" }}
    ]
    JSON ONLY. No markdown blocks.
    """

    try:
        # Request JSON mode if supported by the provider, otherwise relying on prompt
        response = generate_ai_content(request.user, prompt, json_mode=True)
        
        # Parse JSON
        text = response.text.strip()
        if text.startswith('```json'): text = text[7:]
        if text.startswith('```'): text = text[3:]
        if text.endswith('```'): text = text[:-3]
        
        try:
             data = json.loads(text)
        except json.JSONDecodeError:
             # Fallback: simple text cleaner or retry logic (omitted for brevity)
             # If AI fails to give JSON, try to extract list from text
             import ast
             try:
                data = ast.literal_eval(text)
             except:
                raise ValueError("AI did not return valid JSON")

        return Response(data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

