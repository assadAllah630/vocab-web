"""
Content Extraction API Views
Provides endpoints for extracting content from URLs and YouTube videos.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import logging

from .content_extraction_service import (
    extract_content_from_url,
    extract_youtube_transcript,
    ContentExtractionError
)
from .text_formatting_service import format_text_to_markdown

logger = logging.getLogger(__name__)


class ContentExtractionView(APIView):
    """
    API endpoint for extracting content from URLs.
    
    POST /api/extract-content/
    Body: { "url": "https://example.com/article" }
    
    Works with:
    - Article URLs (uses Trafilatura/Newspaper4k)
    - YouTube URLs (extracts transcript)
    - Any web page (falls back to Jina Reader)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        url = request.data.get('url', '').strip()
        format_md = request.data.get('format', True)  # Format to Markdown by default
        
        if not url:
            return Response(
                {'success': False, 'error': 'URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        try:
            logger.info(f"Extracting content from: {url}")
            result = extract_content_from_url(url)
            
            # Apply Markdown formatting for better readability
            content = result['content']
            if format_md and content:
                content = format_text_to_markdown(content, result['source_type'])
            
            logger.info(
                f"Extracted {result['word_count']} words from {url} "
                f"(type: {result['source_type']}, lang: {result['language']})"
            )
            
            return Response({
                'success': True,
                'content': content,
                'title': result['title'],
                'source_type': result['source_type'],
                'language': result['language'],
                'word_count': result['word_count'],
                'metadata': result['metadata'],
            })
            
        except ContentExtractionError as e:
            logger.warning(f"Content extraction error: {e}")
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Unexpected error during content extraction: {e}")
            return Response(
                {'success': False, 'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class YouTubeTranscriptView(APIView):
    """
    API endpoint for extracting YouTube video transcripts.
    
    POST /api/extract-youtube/
    Body: { "video": "VIDEO_ID or full YouTube URL" }
    
    Returns transcript with timing segments and language info.
    FREE and UNLIMITED - no API key needed!
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        video = request.data.get('video', '').strip()
        
        if not video:
            return Response(
                {'success': False, 'error': 'Video ID or URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get user's target language from profile
            target_language = None
            if hasattr(request.user, 'profile'):
                target_language = request.user.profile.target_language
            
            logger.info(f"Extracting YouTube transcript: {video} (target lang: {target_language})")
            result = extract_youtube_transcript(video, preferred_language=target_language)
            
            # Apply Markdown formatting for paragraph grouping
            content = result['content']
            if content:
                content = format_text_to_markdown(content, 'youtube')
            
            logger.info(
                f"Extracted {result['word_count']} words from YouTube "
                f"(lang: {result['language']}, type: {result['metadata'].get('transcript_type', 'auto')})"
            )
            
            return Response({
                'success': True,
                'content': content,
                'title': result['title'],
                'language': result['language'],
                'word_count': result['word_count'],
                'metadata': result['metadata'],
            })
            
        except ContentExtractionError as e:
            logger.warning(f"YouTube extraction error: {e}")
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Unexpected error during YouTube extraction: {e}")
            return Response(
                {'success': False, 'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
