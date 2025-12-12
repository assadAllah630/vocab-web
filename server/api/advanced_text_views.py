"""
Advanced Text Generator Views
API endpoints for AI-powered educational content generation
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django_ratelimit.decorators import ratelimit
from django.shortcuts import get_object_or_404

from .advanced_text_models import GeneratedContent
from .advanced_text_agent import AdvancedTextAgent
from .image_generation_agent import ImageGenerationAgent
from .models import Vocabulary
from .hlr import HLRScheduler
from django.utils import timezone
import random
import json
import logging

logger = logging.getLogger(__name__)

def _get_hlr_words(user, limit=10):
    """Get words due for review using HLR algorithm"""
    queryset = Vocabulary.objects.filter(user=user)
    now = timezone.now()
    
    due_words = []
    
    for word in queryset:
        if not word.last_practiced_at:
            continue
            
        days_since = (now - word.last_practiced_at).days
        recall_prob = HLRScheduler.predict_recall_probability(
            word.correct_count,
            word.wrong_count,
            word.total_practice_count,
            days_since
        )
        
        # If recall probability is low (< 0.9), it's due
        if recall_prob < 0.9:
            due_words.append((recall_prob, word))
            
    # Sort by lowest recall probability (most urgent)
    due_words.sort(key=lambda x: x[0])
    
    # Take top 'limit' words
    selected = [w.word for p, w in due_words[:limit]]
    
    # If not enough due words, fill with random words from user's vocab
    if len(selected) < limit:
        remaining = limit - len(selected)
        all_words = list(queryset.values_list('word', flat=True))
        # Exclude already selected
        candidates = [w for w in all_words if w not in selected]
        if candidates:
            selected.extend(random.sample(candidates, min(len(candidates), remaining)))
            
    return selected


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/h', block=True)
def generate_advanced_text(request):
    """
    Generate educational content (story/article/dialogue) using AI
    """
    try:
        # Validate request data
        content_type = request.data.get('content_type')
        if content_type not in ['story', 'article', 'dialogue']:
            return Response(
                {'error': 'Invalid content_type. Must be story, article, or dialogue'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        topic = request.data.get('topic')
        if not topic:
            return Response(
                {'error': 'Topic is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        level = request.data.get('student_level', 'B1')
        if level not in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
            return Response(
                {'error': 'Invalid student_level'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has any AI capability (gateway keys OR legacy key)
        from .unified_ai import get_ai_status
        ai_status = get_ai_status(request.user)
        
        if not ai_status['has_gateway_keys'] and not ai_status['has_legacy_key']:
            return Response(
                {'error': 'No API keys available. Add a key in Settings or AI Gateway.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle vocabulary selection
        vocab_selection = request.data.get('vocabulary_selection', 'random')
        selected_words = []
        
        if vocab_selection == 'manual':
            word_ids = request.data.get('selected_words', [])
            if word_ids:
                vocab_objects = Vocabulary.objects.filter(
                    id__in=word_ids,
                    user=request.user
                )
                selected_words = [v.word for v in vocab_objects]
        elif vocab_selection == 'hlr':
            selected_words = _get_hlr_words(request.user, limit=10)
        
        # Prepare parameters for agent
        generate_images = request.data.get('generate_images', False)
        
        # Common parameters
        params = {
            'content_type': content_type,
            'topic': topic,
            'level': level,
            'target_language': request.data.get('target_language', 'de'),
            'vocabulary_selection': vocab_selection,
            'selected_words': selected_words,
            'grammar_selection': request.data.get('grammar_selection', 'random'),
            'selected_grammar': request.data.get('selected_grammar', []),
            'grammar_focus': request.data.get('grammar_focus', ''),
            'instructor_notes': request.data.get('instructor_notes', ''),
            'word_count': request.data.get('word_count', 300),
            'generate_images': generate_images,
        }

        # Story specific parameters
        if content_type == 'story':
            params.update({
                'genre': request.data.get('genre', 'General'),
                'plot_type': request.data.get('plot_type', 'Standard'),
                'setting': request.data.get('setting', ''),
                'characters': request.data.get('characters', []), # List of {name, role, traits}
            })

        # Dialogue specific parameters
        elif content_type == 'dialogue':
            params.update({
                'scenario': request.data.get('scenario', ''),
                'tone': request.data.get('tone', 'Neutral'),
                'speakers': request.data.get('speakers', []), # List of {name, personality}
            })

        # Article specific parameters
        elif content_type == 'article':
            params.update({
                'article_style': request.data.get('article_style', 'Informative'), # News, Blog, etc.
                'structure_type': request.data.get('structure_type', 'Standard'),
            })
        
        # Initialize agent with user for Gateway multi-key fallback
        # Get native language from user profile for translations
        native_language = 'en'
        try:
            native_language = request.user.profile.native_language
        except:
            pass
        
        agent = AdvancedTextAgent(request.user, native_language=native_language)
        
        # Generate content based on type
        if content_type == 'story':
            result = agent.generate_story(params)
        elif content_type == 'article':
            result = agent.generate_article(params)
        elif content_type == 'dialogue':
            result = agent.generate_dialogue(params)
        
        # Calculate total words
        total_words = _count_words_in_content(result, content_type)
        
        # Extract vocabulary and grammar used
        vocab_used = _extract_vocabulary_used(result, content_type)
        grammar_used = _extract_grammar_used(result, content_type)
        
        # Prepare image generation fields
        has_images = False
        image_status = 'none'
        total_images = 0
        
        if generate_images and content_type == 'story' and 'events' in result:
            has_images = True
            image_status = 'pending'
            total_images = len(result['events'])
            
            # Initialize image fields in events
            for event in result['events']:
                event['image_status'] = 'pending'
                event['image_url'] = None
                event['image_base64'] = None
                event['image_provider'] = None
        
        # Save to database with language pair
        generated_content = GeneratedContent.objects.create(
            user=request.user,
            content_type=content_type,
            title=result.get('title', topic),
            topic=topic,
            level=level,
            target_language=params['target_language'],
            native_language=native_language,
            content_data=result,
            total_words=total_words,
            vocabulary_used=vocab_used,
            grammar_used=grammar_used,
            has_images=has_images,
            image_generation_status=image_status,
            total_images_count=total_images
        )
        
        # Return result with ID
        return Response({
            'id': generated_content.id,
            'content': result,
            'total_words': total_words,
            'vocabulary_used': vocab_used,
            'grammar_used': grammar_used,
            'has_images': has_images,
            'image_generation_status': image_status
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        return Response(
            {'error': f'Generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_generated_content(request):
    """
    List user's generated content with optional filtering
    """
    # Filter by user and language pair
    try:
        profile = request.user.profile
        target_lang = profile.target_language
        native_lang = profile.native_language
    except:
        target_lang = 'de'
        native_lang = 'en'
    
    queryset = GeneratedContent.objects.filter(
        user=request.user,
        target_language=target_lang,
        native_language=native_lang
    )
    
    # Apply filters
    content_type = request.query_params.get('content_type')
    if content_type:
        queryset = queryset.filter(content_type=content_type)
    
    favorites_only = request.query_params.get('favorites')
    if favorites_only == 'true':
        queryset = queryset.filter(is_favorite=True)
    
    # Serialize data
    data = []
    for content in queryset:
        data.append({
            'id': content.id,
            'content_type': content.content_type,
            'title': content.title,
            'topic': content.topic,
            'level': content.level,
            'total_words': content.total_words,
            'is_favorite': content.is_favorite,
            'view_count': content.view_count,
            'created_at': content.created_at,
            'has_images': content.has_images,
            'image_generation_status': content.image_generation_status,
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_generated_content(request, pk):
    """Get specific generated content by ID"""
    content = get_object_or_404(
        GeneratedContent,
        pk=pk,
        user=request.user
    )
    
    # Increment view count
    content.increment_view_count()
    
    return Response({
        'id': content.id,
        'content_type': content.content_type,
        'title': content.title,
        'topic': content.topic,
        'level': content.level,
        'target_language': content.target_language,
        'content_data': content.content_data,
        'total_words': content.total_words,
        'vocabulary_used': content.vocabulary_used,
        'grammar_used': content.grammar_used,
        'is_favorite': content.is_favorite,
        'view_count': content.view_count,
        'created_at': content.created_at,
        'has_images': content.has_images,
        'image_generation_status': content.image_generation_status,
        'images_generated_count': content.images_generated_count,
        'total_images_count': content.total_images_count,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_image_generation_status(request, pk):
    """
    Check image status and trigger generation for next pending image.
    This implements the 'polling' strategy for async generation.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"DEBUG: Checking image status for story {pk} by user {request.user.id} ({request.user.username})")
    
    # Debug check
    exists = GeneratedContent.objects.filter(pk=pk).exists()
    if not exists:
        logger.error(f"DEBUG: Story {pk} does NOT exist in DB")
    else:
        story = GeneratedContent.objects.get(pk=pk)
        logger.info(f"DEBUG: Story {pk} exists. Owner: {story.user.id} ({story.user.username}). Has Images: {story.has_images}")
        if story.user != request.user:
            logger.error(f"DEBUG: User mismatch! Request user {request.user.id} != Owner {story.user.id}")

    content = get_object_or_404(
        GeneratedContent,
        pk=pk,
        user=request.user
    )
    
    if not content.has_images:
        logger.info(f"DEBUG: Story {pk} has_images=False, returning status: none")
        return Response({'status': 'none'})
        
    # Check if we need to generate anything
    events = content.content_data.get('events', [])
    pending_events = [e for e in events if e.get('image_status') == 'pending']
    
    # Also catch 'generating' events that might be stuck (e.g. from server restart)
    # Since this function is synchronous, any 'generating' status when we enter means it's stuck from a previous failed/killed request
    stuck_events = [e for e in events if e.get('image_status') == 'generating']
    
    event_to_process = None
    
    if pending_events:
        event_to_process = pending_events[0]
    elif stuck_events:
        logger.warning(f"Found stuck 'generating' event for story {pk}, retrying...")
        event_to_process = stuck_events[0]
    
    if event_to_process:
        event_index = events.index(event_to_process)
        
        # Update status to generating
        event_to_process['image_status'] = 'generating'
        content.image_generation_status = 'generating'
        content.save()
        
        # Trigger generation (Synchronous for this request)
        try:
            agent = ImageGenerationAgent(
                horde_api_key=request.user.profile.stable_horde_api_key,
                hf_api_token=request.user.profile.huggingface_api_token
            )
            prompt = event_to_process.get('image_prompt', {}).get('positive_prompt')
            negative_prompt = event_to_process.get('image_prompt', {}).get('negative_prompt', '')
            
            if prompt:
                result = agent.generate_image(prompt, negative_prompt)
                
                if result['success']:
                    event_to_process['image_status'] = 'completed'
                    event_to_process['image_base64'] = result.get('image_base64')
                    event_to_process['image_url'] = result.get('image_url')
                    event_to_process['image_provider'] = result.get('provider')
                    
                    content.images_generated_count += 1
                    
                    # Track provider
                    if result.get('provider') not in content.image_providers_used:
                        content.image_providers_used.append(result.get('provider'))
                        
                else:
                    event_to_process['image_status'] = 'failed'
                    error_msg = result.get('error', 'Unknown error')
                    event_to_process['error'] = error_msg
                    logger.error(f"Image generation failed for event {event_to_process.get('event_number')}: {error_msg}")
            else:
                event_to_process['image_status'] = 'failed'
                event_to_process['error'] = 'No prompt found'
                
        except Exception as e:
            event_to_process['image_status'] = 'failed'
            event_to_process['error'] = str(e)
            logger.error(f"Image generation error: {str(e)}")
            
        # Update main content object
        content.content_data['events'][event_index] = event_to_process
        
        # Check if all done (no pending AND no generating)
        events = content.content_data.get('events', [])  # Refresh events list
        pending_events = [e for e in events if e.get('image_status') == 'pending']
        generating_events = [e for e in events if e.get('image_status') == 'generating']
        
        # If no more pending or generating events, finalize status
        if not pending_events and not generating_events:
            # Check if any failed
            failed = [e for e in events if e.get('image_status') == 'failed']
            completed = [e for e in events if e.get('image_status') == 'completed']
            
            if len(failed) == len(events):
                content.image_generation_status = 'failed'
                logger.info(f"All images failed for content {content.id}")
            elif len(completed) == len(events):
                content.image_generation_status = 'completed'
                logger.info(f"All images completed for content {content.id}")
            else:
                content.image_generation_status = 'partial'
                logger.info(f"Partial success for content {content.id}: {len(completed)}/{len(events)} completed")
        
        content.save()
        logger.info(f"Image status update: {content.image_generation_status}, Generated: {content.images_generated_count}/{content.total_images_count}")
        
    return Response({
        'status': content.image_generation_status,
        'images_generated': content.images_generated_count,
        'total_images': content.total_images_count,
        'events': content.content_data.get('events', [])
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_image_generation(request, pk, event_number):
    """Retry generation for a specific failed event"""
    content = get_object_or_404(
        GeneratedContent,
        pk=pk,
        user=request.user
    )
    
    events = content.content_data.get('events', [])
    target_event = next((e for e in events if e.get('event_number') == event_number), None)
    
    if not target_event:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
    # Reset status to pending so next poll picks it up
    target_event['image_status'] = 'pending'
    content.image_generation_status = 'generating' # Ensure polling continues
    content.save()
    
    return Response({
        'status': 'queued',
        'message': f'Image generation for event {event_number} queued for retry'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, pk):
    """Toggle favorite status for generated content"""
    content = get_object_or_404(
        GeneratedContent,
        pk=pk,
        user=request.user
    )
    
    content.is_favorite = not content.is_favorite
    content.save()
    
    return Response({
        'id': content.id,
        'is_favorite': content.is_favorite,
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_generated_content(request, pk):
    """Delete generated content"""
    content = get_object_or_404(
        GeneratedContent,
        pk=pk,
        user=request.user
    )
    
    content.delete()
    
    return Response(status=status.HTTP_204_NO_CONTENT)


# ========== Helper Functions ==========

def _count_words_in_content(content_data: dict, content_type: str) -> int:
    """Count total words in generated content"""
    total = 0
    
    if content_type == 'story':
        for event in content_data.get('events', []):
            text = event.get('content', '')
            total += len(text.split())
    
    elif content_type == 'article':
        for paragraph in content_data.get('paragraphs', []):
            text = paragraph.get('content', '')
            total += len(text.split())
    
    elif content_type == 'dialogue':
        for message in content_data.get('messages', []):
            text = message.get('text', '')
            total += len(text.split())
    
    return total


def _extract_vocabulary_used(content_data: dict, content_type: str) -> list:
    """Extract all vocabulary words used in content"""
    vocab_set = set()
    
    if content_type == 'story':
        for event in content_data.get('events', []):
            vocab_set.update(event.get('vocabulary_in_event', []))
    
    elif content_type == 'article':
        for paragraph in content_data.get('paragraphs', []):
            vocab_set.update(paragraph.get('vocabulary_in_paragraph', []))
    
    elif content_type == 'dialogue':
        for message in content_data.get('messages', []):
            vocab_set.update(message.get('vocabulary_in_message', []))
    
    return list(vocab_set)


def _extract_grammar_used(content_data: dict, content_type: str) -> list:
    """Extract all grammar points used in content"""
    grammar_set = set()
    
    if content_type == 'story':
        for event in content_data.get('events', []):
            grammar_set.update(event.get('grammar_in_event', []))
    
    elif content_type == 'article':
        for paragraph in content_data.get('paragraphs', []):
            grammar_set.update(paragraph.get('grammar_in_paragraph', []))
    
    elif content_type == 'dialogue':
        for message in content_data.get('messages', []):
            grammar_set.update(message.get('grammar_in_message', []))
    
    return list(grammar_set)
