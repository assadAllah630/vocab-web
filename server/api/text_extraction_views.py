"""
Text Extraction API Views
Provides endpoints for uploading files and extracting text.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
import logging

from .text_extraction_service import extract_text_from_file, TextExtractionError

logger = logging.getLogger(__name__)


class TextExtractionView(APIView):
    """
    API endpoint for extracting text from uploaded files.
    
    POST /api/extract-text/
    Content-Type: multipart/form-data
    Body: file (binary)
    
    Returns:
    {
        "success": true,
        "text": "...",
        "language": "en",
        "file_type": "pdf",
        "pages": 5,
        "word_count": 1500,
        "metadata": {...}
    }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    # Maximum file size: 20MB
    MAX_FILE_SIZE = 20 * 1024 * 1024
    
    def post(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'success': False, 'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Check file size
        if uploaded_file.size > self.MAX_FILE_SIZE:
            return Response(
                {
                    'success': False,
                    'error': f'File too large. Maximum size is {self.MAX_FILE_SIZE // (1024*1024)}MB'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read file content
            file_content = uploaded_file.read()
            filename = uploaded_file.name
            
            # Get user's OCR.space API key for AI-powered OCR
            ocrspace_api_key = None
            if hasattr(request.user, 'profile'):
                ocrspace_api_key = getattr(request.user.profile, 'ocrspace_api_key', None)
            
            logger.info(f"Extracting text from {filename} ({len(file_content)} bytes)")
            if ocrspace_api_key:
                logger.info("OCR.space API key found, will use AI OCR for images")
            
            # Extract text (pass OCR.space key for AI-powered image OCR)
            result = extract_text_from_file(file_content, filename, ocrspace_api_key=ocrspace_api_key)
            
            logger.info(
                f"Extracted {result['word_count']} words from {filename} "
                f"(language: {result['language']})"
            )
            
            return Response({
                'success': True,
                'text': result['text'],
                'language': result['language'],
                'file_type': result['file_type'],
                'pages': result['pages'],
                'word_count': result['word_count'],
                'metadata': result['metadata'],
            })
            
        except TextExtractionError as e:
            logger.warning(f"Text extraction error: {e}")
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Unexpected error during text extraction: {e}")
            return Response(
                {'success': False, 'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class SupportedFormatsView(APIView):
    """
    Returns list of supported file formats for text extraction.
    
    GET /api/extract-text/formats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        formats = {
            'documents': {
                'pdf': 'PDF Documents',
                'docx': 'Microsoft Word',
                'pptx': 'Microsoft PowerPoint',
                'xlsx': 'Microsoft Excel',
            },
            'images': {
                'png': 'PNG Image',
                'jpg': 'JPEG Image',
                'jpeg': 'JPEG Image',
                'gif': 'GIF Image',
                'bmp': 'BMP Image',
                'tiff': 'TIFF Image',
                'webp': 'WebP Image',
            },
            'text': {
                'txt': 'Plain Text',
                'md': 'Markdown',
                'csv': 'CSV',
                'json': 'JSON',
                'xml': 'XML',
                'html': 'HTML',
            },
            'ocr_languages': [
                {'code': 'en', 'name': 'English'},
                {'code': 'de', 'name': 'German'},
                {'code': 'ar', 'name': 'Arabic'},
                {'code': 'fr', 'name': 'French'},
                {'code': 'es', 'name': 'Spanish'},
                {'code': 'it', 'name': 'Italian'},
                {'code': 'pt', 'name': 'Portuguese'},
                {'code': 'ru', 'name': 'Russian'},
                {'code': 'zh', 'name': 'Chinese'},
                {'code': 'ja', 'name': 'Japanese'},
            ],
            'max_file_size_mb': 20,
        }
        return Response(formats)
