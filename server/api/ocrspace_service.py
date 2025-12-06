"""
OCR.space API Service - Free cloud-based OCR
https://ocr.space/ocrapi

Free tier: 500 requests/day, no payment required
Supports: PDF, images, tables, 25+ languages

Get free API key at: https://ocr.space/ocrapi
"""
import logging
import base64
import httpx
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger(__name__)

# OCR.space API endpoint
OCR_SPACE_API_URL = "https://api.ocr.space/parse/image"


class OCRSpaceError(Exception):
    """Exception for OCR.space API errors."""
    pass


def extract_text_with_ocrspace(
    image_content: bytes,
    api_key: str,
    language: str = "eng",
    is_table: bool = False,
    scale: bool = True,
    detect_orientation: bool = True,
) -> Tuple[str, Dict[str, Any]]:
    """
    Extract text from image using OCR.space API.
    
    Args:
        image_content: Raw image bytes
        api_key: OCR.space API key (get free key at ocr.space/ocrapi)
        language: OCR language code (eng, ger, ara, etc.)
        is_table: Enable table recognition
        scale: Auto-scale image for better OCR
        detect_orientation: Auto-detect image orientation
        
    Returns:
        Tuple of (extracted_text, metadata_dict)
        
    Raises:
        OCRSpaceError: If API call fails
    """
    if not api_key:
        raise OCRSpaceError("OCR.space API key required. Get free key at: https://ocr.space/ocrapi")
    
    # Encode image as base64
    image_base64 = base64.b64encode(image_content).decode('utf-8')
    
    # Prepare request
    payload = {
        'apikey': api_key,
        'base64Image': f'data:image/png;base64,{image_base64}',
        'language': language,
        'isTable': str(is_table).lower(),
        'scale': str(scale).lower(),
        'detectOrientation': str(detect_orientation).lower(),
        'OCREngine': '2',  # OCR Engine 2 is better for most cases
    }
    
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(OCR_SPACE_API_URL, data=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if not result.get('IsErroredOnProcessing', False):
                parsed_results = result.get('ParsedResults', [])
                
                if parsed_results:
                    text = parsed_results[0].get('ParsedText', '')
                    
                    metadata = {
                        'method': 'ocrspace',
                        'exit_code': parsed_results[0].get('FileParseExitCode'),
                        'error_message': parsed_results[0].get('ErrorMessage'),
                        'error_details': parsed_results[0].get('ErrorDetails'),
                        'processing_time': result.get('ProcessingTimeInMilliseconds'),
                        'language': language,
                    }
                    
                    return text, metadata
                else:
                    raise OCRSpaceError("No results returned from OCR.space")
            else:
                error_msg = result.get('ErrorMessage', ['Unknown error'])
                raise OCRSpaceError(f"OCR.space error: {error_msg}")
                
    except httpx.HTTPError as e:
        logger.error(f"OCR.space HTTP error: {e}")
        raise OCRSpaceError(f"OCR.space HTTP error: {str(e)}")
    except Exception as e:
        logger.exception(f"OCR.space failed: {e}")
        raise OCRSpaceError(f"OCR.space failed: {str(e)}")


def extract_pdf_with_ocrspace(
    pdf_content: bytes,
    api_key: str,
    language: str = "eng",
) -> Tuple[str, int, Dict[str, Any]]:
    """
    Extract text from PDF using OCR.space API.
    
    Note: Free tier limited to 3 pages per PDF.
    
    Args:
        pdf_content: Raw PDF bytes
        api_key: OCR.space API key
        language: OCR language code
        
    Returns:
        Tuple of (extracted_text, page_count, metadata_dict)
    """
    if not api_key:
        raise OCRSpaceError("OCR.space API key required")
    
    # Encode PDF as base64
    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
    
    payload = {
        'apikey': api_key,
        'base64Image': f'data:application/pdf;base64,{pdf_base64}',
        'language': language,
        'isCreateSearchablePdf': 'false',
        'isSearchablePdfHideTextLayer': 'false',
        'scale': 'true',
        'OCREngine': '2',
    }
    
    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(OCR_SPACE_API_URL, data=payload)
            response.raise_for_status()
            
            result = response.json()
            
            if not result.get('IsErroredOnProcessing', False):
                parsed_results = result.get('ParsedResults', [])
                
                all_text = []
                for i, page_result in enumerate(parsed_results):
                    page_text = page_result.get('ParsedText', '')
                    if page_text:
                        all_text.append(f"--- Page {i + 1} ---\n{page_text}")
                
                metadata = {
                    'method': 'ocrspace',
                    'processing_time': result.get('ProcessingTimeInMilliseconds'),
                    'language': language,
                    'pages_processed': len(parsed_results),
                }
                
                return '\n\n'.join(all_text), len(parsed_results), metadata
            else:
                error_msg = result.get('ErrorMessage', ['Unknown error'])
                raise OCRSpaceError(f"OCR.space error: {error_msg}")
                
    except httpx.HTTPError as e:
        raise OCRSpaceError(f"OCR.space HTTP error: {str(e)}")
    except Exception as e:
        raise OCRSpaceError(f"OCR.space failed: {str(e)}")


# Language mapping for OCR.space
OCRSPACE_LANGUAGES = {
    'en': 'eng',
    'de': 'ger',
    'ar': 'ara',
    'fr': 'fre',
    'es': 'spa',
    'it': 'ita',
    'pt': 'por',
    'ru': 'rus',
    'zh': 'chs',  # Simplified Chinese
    'ja': 'jpn',
    'ko': 'kor',
    'tr': 'tur',
    'nl': 'dut',
    'pl': 'pol',
}


def get_ocrspace_language(lang_code: str) -> str:
    """Convert language code to OCR.space format."""
    return OCRSPACE_LANGUAGES.get(lang_code, 'eng')
