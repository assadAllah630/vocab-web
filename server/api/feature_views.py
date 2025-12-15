"""
Views for Grammar Library, Text Generation, and Podcast features
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.db.models import Q
from .gemini_helper import generate_content as gemini_generate
from .unified_ai import generate_ai_content, get_ai_status
from .models import GrammarTopic, Podcast, Vocabulary, UserProfile
from .serializers import GrammarTopicSerializer, PodcastSerializer
import os
import requests
import csv
import io
from rest_framework.parsers import MultiPartParser, FormParser

class GrammarTopicViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Grammar Topics
    List, retrieve, create, update, delete grammar topics
    """
    serializer_class = GrammarTopicSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filter by user's target language
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'

        # Filter by user (created_by) OR public/admin topics (created_by=None)
        # For now, we'll just show user's topics to keep it simple as requested
        queryset = GrammarTopic.objects.filter(created_by=self.request.user)
        
        # Filter by level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_permissions(self):
        """
        Allow authenticated users to manage their own topics
        """
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'])
    @method_decorator(ratelimit(key='user', rate='5/h', block=True))
    def generate(self, request):
        """
        Generate a new grammar topic using the GrammarResearchAgent
        """
        try:
            # 1. Get parameters
            language = request.data.get('language', 'de')
            level = request.data.get('level', 'A1')
            title = request.data.get('title')
            context_note = request.data.get('context_note', '')
            
            if not title:
                return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # 2. Check for API Keys (gateway only)
            ai_status = get_ai_status(request.user)
            if not ai_status['has_gateway_keys']:
                return Response({'error': 'No API keys available. Add keys in Settings or AI Gateway.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 3. Initialize Agent (uses unified AI internally)
            from .grammar_agent import GrammarResearchAgent
            # Get API key for agent (prefer gateway, fallback to legacy)
            agent_key = None
            if ai_status['has_gateway_keys']:
                from .ai_gateway.models import UserAPIKey
                from .ai_gateway.utils.encryption import decrypt_api_key
                best_key = UserAPIKey.objects.filter(user=request.user, is_active=True, provider='gemini').first()
                if best_key:
                    agent_key = decrypt_api_key(best_key.api_key_encrypted)
            
            if not agent_key:
                return Response({'error': 'No Gemini key available'}, status=status.HTTP_400_BAD_REQUEST)
            agent = GrammarResearchAgent(agent_key)
            
            # Get user's native language
            try:
                native_lang = request.user.profile.native_language
            except:
                native_lang = 'en'
                
            # 4. Generate Content
            result = agent.generate_grammar_topic(title, language, level, context_note, native_language=native_lang)
            
            if not result['success']:
                return Response({'error': result.get('error', 'Generation failed')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            data = result['data']
            
            # 5. Save to Database
            # Check if topic already exists for this user
            topic, created = GrammarTopic.objects.update_or_create(
                title=data.get('title', title),
                level=level,
                language=language,
                created_by=request.user,
                defaults={
                    'category': 'other', # Default, user can change later
                    'content': data.get('content', ''),
                    'word_count': data.get('word_count', 0),
                    'mermaid_diagrams_count': data.get('mermaid_diagrams_count', 0),
                    'estimated_read_time': data.get('estimated_read_time', ''),
                    'sources': data.get('sources', []),
                    'tags': data.get('tags', []),
                    'generated_by_ai': True,
                    'generation_metadata': {
                        'original_request': {
                            'title': title,
                            'level': level,
                            'language': language,
                            'context': context_note
                        }
                    }
                }
            )
            
            # Handle related topics (simple string matching for now, or just storing names)
            # In a real app, we'd look up IDs. For now, we just store the names in the tags or metadata
            # or try to find existing topics with those names.
            
            serializer = self.get_serializer(topic)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """
        Import Grammar Topics from CSV
        CSV Format: level, category, title, content, examples (json or pipe-separated)
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            errors = []
            
            # Get user's target language for import
            try:
                target_lang = request.user.profile.target_language
            except UserProfile.DoesNotExist:
                target_lang = 'de'
            
            for row in reader:
                try:
                    # Parse examples if they are string
                    examples = row.get('examples', '[]')
                    if isinstance(examples, str):
                        if examples.startswith('['):
                            import json
                            examples = json.loads(examples)
                        else:
                            # Assume pipe separated: German|English||German2|English2
                            parts = examples.split('||')
                            examples = []
                            for part in parts:
                                if '|' in part:
                                    german, english = part.split('|')
                                    examples.append({'german': german.strip(), 'english': english.strip()})
                    
                    GrammarTopic.objects.update_or_create(
                        level=row.get('level', 'A1'),
                        category=row.get('category', 'other'),
                        title=row.get('title'),
                        language=target_lang,
                        defaults={
                            'content': row.get('content', ''),
                            'examples': examples,
                            'order': row.get('order', 0)
                        }
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(f"Error importing row {row.get('title', 'unknown')}: {str(e)}")
            
            return Response({
                'message': f'Successfully imported {created_count} topics',
                'errors': errors
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PodcastViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user's podcasts
    """
    serializer_class = PodcastSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Podcast.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from django_ratelimit.decorators import ratelimit

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@ratelimit(key='user', rate='10/h', block=True)
def generate_text(request):
    """
    Generate German text using only user's vocabulary
    """
    try:
        level = request.data.get('level', 'A1')
        length = request.data.get('length', 'medium')  # short, medium, long
        filters = request.data.get('filters', [])  # verb, noun, adjective, etc.
        grammar_topic_ids = request.data.get('grammar_topics', [])
        clarification_prompt = request.data.get('clarification_prompt', '')
        
        # Get user's target language
        try:
            target_lang = request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
        
        # Get user's vocabulary for the target language
        vocab_query = Vocabulary.objects.filter(created_by=request.user, language=target_lang)
        
        # Apply filters
        if filters:
            vocab_query = vocab_query.filter(type__in=filters)
        
        vocabulary_words = list(vocab_query.values_list('word', flat=True))
        
        if not vocabulary_words:
            return Response({
                'error': 'You need to add some vocabulary words first!'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine word count based on length
        word_count_map = {
            'short': '50-100',
            'medium': '100-200',
            'long': '200-300'
        }
        word_count = word_count_map.get(length, '100-200')
        
        # Check for API keys (gateway only)
        ai_status = get_ai_status(request.user)
        if not ai_status['has_gateway_keys']:
            return Response({
                'error': 'No API keys available. Add keys in Settings or AI Gateway.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get Grammar Topics
        grammar_instructions = ""
        if grammar_topic_ids:
            topics = GrammarTopic.objects.filter(id__in=grammar_topic_ids)
            topic_titles = [t.title for t in topics]
            if topic_titles:
                grammar_instructions = f"7. Focus on these grammar topics: {', '.join(topic_titles)}"

        # Clarification Prompt
        custom_instructions = ""
        if clarification_prompt:
            custom_instructions = f"8. Additional instructions: {clarification_prompt}"

        # Create prompt
        vocab_list = ', '.join(vocabulary_words[:100])  # Limit to avoid token issues
        prompt = f"""You are a language teacher for {target_lang}. Create an educational text for {level} level students.

STRICT REQUIREMENTS:
1. Use ONLY these vocabulary words: {vocab_list}
2. The text should be {word_count} words long
3. Level: {level}
4. You can use basic grammar words but try to use the provided vocabulary as much as possible
5. Make the text interesting and educational
6. Include proper punctuation and capitalization
{grammar_instructions}
{custom_instructions}

Create a short story, dialogue, or informative text that naturally uses these words.
"""
        
        # Generate text using unified AI (gateway + legacy fallback)
        response = generate_ai_content(request.user, prompt)
        
        generated_text = response.text
        
        # Count words used from vocabulary
        words_used = [word for word in vocabulary_words if word.lower() in generated_text.lower()]
        
        return Response({
            'text': generated_text,
            'word_count': len(generated_text.split()),
            'vocabulary_used': words_used,
            'vocabulary_used_count': len(words_used)
        })
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@ratelimit(key='user', rate='5/h', block=True)
def generate_podcast(request):
    """
    Generate a podcast: Gemini creates text, Speechify TTS converts to audio
    """
    try:
        # Get user's Speechify API key
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        speechify_key = user_profile.speechify_api_key
        
        if not speechify_key:
            return Response({
                'error': 'Please add your Speechify API key in Settings'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Option 1: User provides text
        text = request.data.get('text')
        
        # Option 2: Auto-generate text
        if not text:
            # Get user's target language
            try:
                target_lang = request.user.profile.target_language
            except UserProfile.DoesNotExist:
                target_lang = 'de'

            # Generate text using user's vocabulary
            vocab_words = list(Vocabulary.objects.filter(
                created_by=request.user,
                language=target_lang
            ).values_list('word', flat=True)[:50])
            
            if not vocab_words:
                return Response({
                    'error': 'Please add some vocabulary words first'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for API keys
            ai_status = get_ai_status(request.user)
            if not ai_status['has_gateway_keys']:
                return Response({
                    'error': 'No API keys available. Add keys in Settings or AI Gateway.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate text
            vocab_list = ', '.join(vocab_words)
            prompt = f"""Create a short, educational podcast script (100-150 words) in {target_lang} using these vocabulary words: {vocab_list}

Make it interesting and conversational, like a mini German lesson or story.
Use simple, clear language suitable for language learners."""
            
            response = generate_ai_content(request.user, prompt)
            text = response.text
        
        # Get voice settings and title
        # Support both voice_id (frontend) and voice_name
        voice_model = request.data.get('voice_id') or request.data.get('voice_name') or 'marlene' # Default German voice
        title = request.data.get('title', 'My Podcast')
        
        # Convert text to speech using Speechify
        try:
            url = "https://api.sws.speechify.com/v1/audio/speech"
            headers = {
                "Authorization": f"Bearer {speechify_key}",
                "Content-Type": "application/json"
            }
            
            # Determine model based on language (simplified logic)
            # For German/Multilingual, use simba-multilingual
            model = "simba-multilingual" 
            
            data = {
                "input": text,
                "voice_id": voice_model,
                "audio_format": "mp3",
                "model": model
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code != 200:
                 return Response({
                    'error': f'Speechify API error: {response.text}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Speechify returns JSON with base64 encoded audio
            response_data = response.json()
            if 'audio_data' in response_data:
                import base64
                audio_content_bytes = base64.b64decode(response_data['audio_data'])
            else:
                 return Response({
                    'error': 'Invalid response from Speechify API (missing audio_data)'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            return Response({
                'error': f'Speechify TTS API error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Save audio file
        from django.core.files.base import ContentFile
        import uuid
        
        filename = f"podcast_{uuid.uuid4()}.mp3"
        audio_content = ContentFile(audio_content_bytes)
        
        # Create podcast record
        podcast = Podcast.objects.create(
            user=request.user,
            title=title,
            text_content=text,
            voice_id=voice_model # Store the Speechify model used
        )
        podcast.audio_file.save(filename, audio_content)
        
        serializer = PodcastSerializer(podcast, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_elevenlabs_key(request):
    """
    Test ElevenLabs API key - tries TTS endpoint which is what we actually use
    """
    try:
        api_key = request.data.get('api_key')
        
        if not api_key:
            return Response({
                'valid': False,
                'error': 'API key is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Test with a minimal TTS request (what we actually use in the app)
        voice_id = "EXAVITQu4vr4xnSDxMaL"  # Default voice
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        data = {
            "text": "Test",
            "model_id": "eleven_multilingual_v2"
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return Response({
                'valid': True,
                'message': 'API key is valid and working'
            })
        else:
            # Parse error details
            try:
                error_detail = response.json().get('detail', {})
                if isinstance(error_detail, dict):
                    error_status = error_detail.get('status', 'unknown')
                    error_message = error_detail.get('message', 'Unknown error')
                else:
                    error_status = 'unknown'
                    error_message = str(error_detail)
            except:
                error_status = 'unknown'
                error_message = f'HTTP {response.status_code}'
            
            return Response({
                'valid': False,
                'error': error_message,
                'error_type': error_status,
                'can_save': True,  # Allow saving even if validation fails
                'warning': 'You can still save this key and try using it. Some features may not work if the key has restrictions.'
            }, status=status.HTTP_200_OK)  # Return 200 so frontend can handle gracefully
            
    except requests.exceptions.Timeout:
        return Response({
            'valid': False,
            'error': 'Request timed out. Please try again.',
            'can_save': True
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'valid': False,
            'error': str(e),
            'can_save': True
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_elevenlabs_voices(request):
    """
    Get available ElevenLabs voices
    """
    try:
        # Get or create user profile
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        api_key = user_profile.elevenlabs_api_key
        
        if not api_key:
            return Response({
                'voices': [],
                'error': 'Please add your ElevenLabs API key in Settings'
            }, status=status.HTTP_200_OK)
        
        url = "https://api.elevenlabs.io/v1/voices"
        headers = {"xi-api-key": api_key}
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return Response(response.json())
        else:
            return Response({
                'voices': [],
                'error': 'Failed to fetch voices. Please check your API key in Settings.'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'voices': [],
            'error': str(e)
        }, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """
    Get or update user profile (including ElevenLabs API key)
    """
    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            from .serializers import UserProfileSerializer
            serializer = UserProfileSerializer(profile)
            data = serializer.data
            # Don't send the API key in GET requests
            data.pop('elevenlabs_api_key', None)
            return Response(data)
        
        elif request.method == 'PUT':
            from .serializers import UserProfileSerializer
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'Profile updated successfully'})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SavedTextViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Saved Texts
    """
    from .models import SavedText
    from .serializers import SavedTextSerializer
    
    queryset = SavedText.objects.all()
    serializer_class = SavedTextSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
        serializer.save(user=self.request.user, language=target_lang)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def analyze_text(request):
    """
    Extract potential vocabulary from text
    """
    text = request.data.get('text', '')
    if not text:
        return Response({'error': 'No text provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Simple tokenization (can be improved with NLTK/Spacy if needed)
        import re
        # Remove markdown syntax
        clean_text = re.sub(r'[#*`_\[\]()!]', '', text)
        # Split by non-word characters
        words = re.findall(r'\b\w+\b', clean_text)
        
        # Filter unique words, case-insensitive
        unique_words = set(word.lower() for word in words if len(word) > 2 and not word.isdigit())
        
        # Get user's existing vocabulary
        user_vocab = set(Vocabulary.objects.filter(
            created_by=request.user
        ).values_list('word', flat=True))
        
        # Normalize user vocab for comparison
        user_vocab_lower = set(w.lower() for w in user_vocab)
        
        # Common English stopwords to filter out if target language is not English
        ENGLISH_STOPWORDS = {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
            'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
            'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
            'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
            'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
            'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'has', 'had'
        }

        # Get user's target language
        try:
            target_lang = request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'

        # Find new words
        new_words = []
        for word in unique_words:
            # Filter out English stopwords if target is not English
            if target_lang != 'en' and word in ENGLISH_STOPWORDS:
                continue
                
            if word not in user_vocab_lower:
                # Find original capitalization
                original = next((w for w in words if w.lower() == word), word)
                new_words.append(original)
        
        # AI Filtering (if any API key available)
        has_key = get_ai_status(request.user)['has_gateway_keys']

        if has_key and new_words:
            try:
                # Limit to 200 words to avoid token limits and timeouts
                words_to_filter = new_words[:200]
                
                prompt = f"""
                Filter the following list of words. Return ONLY words that are valid {target_lang} words.
                Remove:
                1. Words from other languages (English, Arabic, etc.) unless they are commonly used loanwords in {target_lang}.
                2. Proper nouns (names of people, places) unless they are common words.
                3. Numbers or nonsense strings.
                4. Typos or fragments.
                
                Input List: {', '.join(words_to_filter)}
                
                Return the filtered list as a JSON array of strings. Example: ["word1", "word2"]
                """
                
                response = generate_ai_content(request.user, prompt)
                text = response.text.strip()
                if text.startswith('```json'):
                    text = text[7:]
                if text.endswith('```'):
                    text = text[:-3]
                
                import json
                filtered_words = json.loads(text)
                
                # If AI returns a valid list, use it. Otherwise fall back to regex.
                if isinstance(filtered_words, list):
                    new_words = filtered_words
                    
            except Exception as ai_error:
                print(f"AI Filtering failed: {ai_error}")
                # Fallback to original list if AI fails
        
        return Response({
            'total_words': len(words),
            'unique_words': len(unique_words),
            'new_words': sorted(new_words),
            'known_count': len(unique_words) - len(new_words)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
