from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import logging
import openai

from .text_converter_agent import TextConverterAgent, convert_text_to_markdown

logger = logging.getLogger(__name__)


def get_ai_client(request):
    """
    Get AI client from user's API key or global settings.
    Priority: OpenRouter > OpenAI > Gemini (returns special marker for Gemini)
    """
    # Try user's API key first
    api_key = request.data.get('api_key')
    
    if not api_key:
        # Try to get from user profile
        user = request.user
        if hasattr(user, 'userprofile') and user.userprofile.openrouter_key:
            api_key = user.userprofile.openrouter_key
            base_url = "https://openrouter.ai/api/v1"
        elif hasattr(user, 'userprofile') and user.userprofile.openai_key:
            api_key = user.userprofile.openai_key
            base_url = None
        elif hasattr(user, 'profile') and user.profile.gemini_api_key:
            # Return special marker for Gemini - will be handled separately
            return 'GEMINI', user.profile.gemini_api_key
        else:
            return None, "No API key available. Please add a Gemini API key in Settings."
    else:
        # Detect if OpenRouter or OpenAI key
        base_url = request.data.get('base_url')
        if not base_url and api_key.startswith('sk-or-'):
            base_url = "https://openrouter.ai/api/v1"
    
    if api_key:
        if base_url:
            return openai.OpenAI(api_key=api_key, base_url=base_url), None
        else:
            return openai.OpenAI(api_key=api_key), None
    
    return None, "No API key available"



class TextConverterAgentView(APIView):
    """
    API endpoint for AI-powered text to Markdown conversion.
    
    POST /api/convert-text/
    Body: {
        "text": "plain text to convert",
        "source_type": "article|youtube|pdf|notes",
        "api_key": "optional API key",
        "model": "gpt-4o-mini (default)"
    }
    
    Returns:
    {
        "success": true,
        "markdown": "# Formatted Markdown...",
        "title": "Detected Title",
        "processing_log": ["Phase 1...", "Phase 2..."]
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        text = request.data.get('text', '').strip()
        source_type = request.data.get('source_type', 'unknown')
        model = request.data.get('model', 'gpt-4o-mini')
        
        if not text:
            return Response(
                {'success': False, 'error': 'Text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get AI client
        client, error_or_key = get_ai_client(request)
        
        # Handle Gemini case
        if client == 'GEMINI':
            try:
                from .gemini_helper import generate_content
                
                logger.info(f"Converting text ({len(text)} chars) using Gemini with fallback")
                
                # Create a prompt for Gemini to format the text
                prompt = f"""You are a text formatting assistant. Convert the following raw text into clean, readable Markdown.

Rules:
1. Add proper headings (# for main title, ## for sections)
2. Format paragraphs properly with line breaks
3. Use bullet points or numbered lists where appropriate
4. Preserve important information
5. Clean up any OCR artifacts or formatting issues
6. If this is from a {source_type}, apply appropriate formatting

Raw text to format:
---
{text[:8000]}
---

Return ONLY the formatted Markdown, no explanation."""

                response = generate_content(error_or_key, prompt)
                markdown = response.text.strip()
                
                # Try to extract title from first heading
                title = "Formatted Document"
                lines = markdown.split('\n')
                for line in lines:
                    if line.startswith('# '):
                        title = line[2:].strip()
                        break
                
                return Response({
                    'success': True,
                    'markdown': markdown,
                    'title': title,
                    'processing_log': ['Formatted using Gemini AI']
                })
                
            except Exception as e:
                logger.exception(f"Gemini conversion failed: {e}")
                return Response(
                    {'success': False, 'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Original OpenAI/OpenRouter path
        if error_or_key and client is None:
            return Response(
                {'success': False, 'error': f'AI client error: {error_or_key}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            logger.info(f"Converting text ({len(text)} chars) using {model}")
            
            # Run the multi-agent conversion
            result = convert_text_to_markdown(
                text=text,
                ai_client=client,
                source_type=source_type,
                model=model
            )
            
            if result.success:
                logger.info(f"Conversion successful, generated {len(result.markdown)} chars")
                return Response({
                    'success': True,
                    'markdown': result.markdown,
                    'title': result.title,
                    'processing_log': result.processing_log
                })
            else:
                logger.warning(f"Conversion had issues: {result.error}")
                return Response({
                    'success': True,  # Still return result with fallback
                    'markdown': result.markdown,
                    'title': result.title,
                    'processing_log': result.processing_log,
                    'warning': result.error
                })
                
        except Exception as e:
            logger.exception(f"Conversion failed: {e}")
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuickFormatView(APIView):
    """
    Quick text formatting endpoint (rule-based, no AI).
    
    POST /api/quick-format/
    Body: {
        "text": "plain text",
        "source_type": "article|youtube|pdf"
    }
    
    Uses rule-based formatting for fast processing.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .text_formatting_service import format_text_to_markdown
        
        text = request.data.get('text', '').strip()
        source_type = request.data.get('source_type', 'unknown')
        
        if not text:
            return Response(
                {'success': False, 'error': 'Text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use fast rule-based formatting
            formatted = format_text_to_markdown(text, source_type)
            
            return Response({
                'success': True,
                'markdown': formatted,
                'method': 'rule-based'
            })
            
        except Exception as e:
            logger.exception(f"Quick format failed: {e}")
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
