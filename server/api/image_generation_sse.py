"""
Server-Sent Events (SSE) view for real-time image generation progress
"""
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .advanced_text_models import GeneratedContent
from .image_generation_agent import ImageGenerationAgent
import json
import time
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stream_image_generation_progress(request, pk):
    """
    SSE endpoint that streams real-time progress updates for image generation.
    Frontend connects once and receives updates as they happen.
    """
    content = get_object_or_404(GeneratedContent, pk=pk, user=request.user)
    
    def event_stream():
        """Generator function that yields SSE-formatted messages"""
        
        # Send initial status
        yield f"data: {json.dumps({'type': 'status', 'message': 'Starting image generation...', 'progress': 0})}\n\n"
        
        if not content.has_images:
            yield f"data: {json.dumps({'type': 'error', 'message': 'No images to generate'})}\n\n"
            return
        
        events = content.content_data.get('events', [])
        total_images = len(events)
        
        # Get user's API keys
        horde_key = request.user.profile.stable_horde_api_key
        hf_token = request.user.profile.huggingface_api_token
        
        # Initialize agent
        try:
            agent = ImageGenerationAgent(horde_api_key=horde_key, hf_api_token=hf_token)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to initialize agent: {str(e)}'})}\n\n"
            return
        
        # Process each pending image
        for idx, event in enumerate(events):
            if event.get('image_status') != 'pending':
                continue
            
            event_number = event.get('event_number', idx + 1)
            progress = int((idx / total_images) * 100)
            
            # Send progress update
            yield f"data: {json.dumps({'type': 'progress', 'message': f'Generating image {event_number}/{total_images}...', 'progress': progress, 'current': event_number, 'total': total_images})}\n\n"
            
            # Update status to generating
            event['image_status'] = 'generating'
            content.content_data['events'][idx] = event
            content.image_generation_status = 'generating'
            content.save()
            
            # Generate image
            try:
                prompt = event.get('image_prompt', {}).get('positive_prompt')
                negative_prompt = event.get('image_prompt', {}).get('negative_prompt', '')
                
                if not prompt:
                    event['image_status'] = 'failed'
                    event['error'] = 'No prompt found'
                    yield f"data: {json.dumps({'type': 'event_failed', 'event_number': event_number, 'error': 'No prompt'})}\n\n"
                    continue
                
                # Send detailed status
                yield f"data: {json.dumps({'type': 'detail', 'message': f'Sending request to AI provider...', 'event_number': event_number})}\n\n"
                
                result = agent.generate_image(prompt, negative_prompt)
                
                if result['success']:
                    event['image_status'] = 'completed'
                    event['image_base64'] = result.get('image_base64')
                    event['image_url'] = result.get('image_url')
                    event['image_provider'] = result.get('provider')
                    
                    content.images_generated_count += 1
                    
                    # Track provider
                    if result.get('provider') not in content.image_providers_used:
                        content.image_providers_used.append(result.get('provider'))
                    
                    yield f"data: {json.dumps({'type': 'event_completed', 'event_number': event_number, 'provider': result.get('provider')})}\n\n"
                else:
                    event['image_status'] = 'failed'
                    event['error'] = result.get('error', 'Unknown error')
                    yield f"data: {json.dumps({'type': 'event_failed', 'event_number': event_number, 'error': result.get('error')})}\n\n"
                    
            except Exception as e:
                event['image_status'] = 'failed'
                event['error'] = str(e)
                logger.error(f"Image generation error for event {event_number}: {str(e)}")
                yield f"data: {json.dumps({'type': 'event_failed', 'event_number': event_number, 'error': str(e)})}\n\n"
            
            # Save progress
            content.content_data['events'][idx] = event
            content.save()
        
        # Finalize status
        events = content.content_data.get('events', [])
        failed = [e for e in events if e.get('image_status') == 'failed']
        completed = [e for e in events if e.get('image_status') == 'completed']
        
        if len(failed) == len(events):
            content.image_generation_status = 'failed'
            final_status = 'failed'
        elif len(completed) == len(events):
            content.image_generation_status = 'completed'
            final_status = 'completed'
        else:
            content.image_generation_status = 'partial'
            final_status = 'partial'
        
        content.save()
        
        # Send final status
        yield f"data: {json.dumps({'type': 'complete', 'status': final_status, 'completed': len(completed), 'failed': len(failed), 'total': len(events)})}\n\n"
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    return response
