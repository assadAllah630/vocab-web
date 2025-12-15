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
    Priority: OpenRouter > OpenAI > AI Gateway (Gemini) > Profile Gemini
    """
    # Try user's API key first (passed in request)
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
        else:
            # Check AI Gateway for Gemini keys first
            try:
                from .ai_gateway.models import UserAPIKey
                from .ai_gateway.utils.encryption import decrypt_api_key
                gateway_key = UserAPIKey.objects.filter(
                    user=user, 
                    is_active=True, 
                    provider='gemini'
                ).first()
                if gateway_key:
                    return 'GEMINI', decrypt_api_key(gateway_key.api_key_encrypted)
            except:
                pass
            
            # Fallback to invalid if no gateway key found
            return None, "No API key available. Please add a Gemini API key in Settings or AI Gateway."
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
        
        if not text:
            return Response(
                {'success': False, 'error': 'Text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use Unified AI Gateway (pass user)
            # The agent will handle key selection via Gateway
            result = convert_text_to_markdown(
                text=text,
                user=request.user,
                source_type=source_type
            )
            
            if result.success:
                return Response({
                    "success": True,
                    "markdown": result.markdown,
                    "title": result.title,
                    "processing_log": result.processing_log
                })
            else:
                return Response({
                    "markdown": result.markdown, # Partial result/fallback
                    "error": getattr(result, 'error', 'Unknown error'),
                    "processing_log": result.processing_log
                }, status=status.HTTP_200_OK) # Return 200 even on partial failure
                
        except Exception as e:
            logger.error(f"Conversion view error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

        



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
