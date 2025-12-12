from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json
from .models import UserProfile
from .prompts import ContextEngineer
from .agent_exam import build_exam_graph
from .unified_ai import generate_ai_content  # Uses gateway + legacy fallback
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

    # API Key is checked inside generate_ai_content, but we check early for better error message
    try:
        has_key = request.user.profile.gemini_api_key
    except:
        has_key = False
    
    # Check if user has gateway keys
    try:
        from .ai_gateway.models import UserAPIKey
        has_gateway_keys = UserAPIKey.objects.filter(user=request.user, is_active=True).exists()
    except:
        has_gateway_keys = False
    
    if not has_key and not has_gateway_keys:
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='5/m', block=True)
def generate_exam(request):
    """
    Endpoint to generate a full exam using AI Gateway.
    Expects 'topic', 'level', and 'question_types' in request body.
    """
    topic = request.data.get('topic')
    level = request.data.get('level', 'B1')
    question_types = request.data.get('question_types', ['cloze', 'multiple_choice'])
    vocab_list = request.data.get('vocab_list')
    grammar_list = request.data.get('grammar_list')
    notes = request.data.get('notes')
    
    if not topic:
        return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get user's target language
        try:
            target_language = request.user.profile.target_language
        except:
            target_language = 'de'  # Default to German
        
        # Initialize Agent
        app = build_exam_graph()
        
        # Initial State
        initial_state = {
            "topic": topic,
            "level": level,
            "question_types": question_types,
            "vocab_list": vocab_list,
            "grammar_list": grammar_list,
            "notes": notes,
            "target_language": target_language,
            "revision_count": 0,
            "logs": [],
            # Initialize optional fields
            "topic_analysis": None,
            "exam_plan": None,
            "draft_questions": None,
            "critique": None,
            "critique_passed": False,
            "final_exam": None,
        }
        
        # Run Agent with User (for AI Gateway access)
        config = {"configurable": {"user": request.user}}
        result = app.invoke(initial_state, config=config)
        
        # Return Final Exam and Logs
        response_data = result.get('final_exam')
        if not response_data:
             return Response({'error': 'Agent failed to generate exam', 'logs': result.get('logs')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
             
        response_data['logs'] = result.get('logs') # Attach logs for UI
        return Response(response_data)

    except Exception as e:
        error_msg = str(e)
        if "Quota exceeded" in error_msg or "429" in error_msg:
             return Response({'error': 'AI Quota Exceeded. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    try:
        has_key = request.user.profile.gemini_api_key
    except:
        has_key = False
    try:
        from .ai_gateway.models import UserAPIKey
        has_gateway_keys = UserAPIKey.objects.filter(user=request.user, is_active=True).exists()
    except:
        has_gateway_keys = False
    
    if not has_key and not has_gateway_keys:
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
