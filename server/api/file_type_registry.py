"""
File Type Registry - Centralized file type detection and handler routing.

This module provides a single point of entry for file processing:
1. Detects file type from extension or content
2. Routes to the appropriate handler function
3. Returns processed content in a standardized format

Usage:
    from .file_type_registry import process_file, get_file_info, SUPPORTED_TYPES
    
    result = process_file(file_content, filename)
"""
import io
import logging
from pathlib import Path
from typing import Callable, Dict, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class FileCategory(Enum):
    """Categories of supported file types."""
    DOCUMENT = "document"      # PDF, DOCX, PPTX, XLSX
    IMAGE = "image"            # PNG, JPG, WEBP, etc.
    TEXT = "text"              # TXT, MD, CSV, JSON, etc.
    VIDEO = "video"            # MP4, etc. (for future use)
    AUDIO = "audio"            # MP3, etc. (for future use)
    UNKNOWN = "unknown"


@dataclass
class FileTypeInfo:
    """Information about a file type."""
    extension: str
    category: FileCategory
    mime_type: str
    description: str
    handler: Optional[str] = None  # Handler function name
    requires_ocr: bool = False
    requires_ai: bool = False


# Registry of all supported file types
FILE_TYPE_REGISTRY: Dict[str, FileTypeInfo] = {
    # Documents
    'pdf': FileTypeInfo('pdf', FileCategory.DOCUMENT, 'application/pdf', 'PDF Document', 'extract_pdf'),
    'docx': FileTypeInfo('docx', FileCategory.DOCUMENT, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Microsoft Word', 'extract_docx'),
    'doc': FileTypeInfo('doc', FileCategory.DOCUMENT, 'application/msword', 'Legacy Word (not supported)', None),
    'pptx': FileTypeInfo('pptx', FileCategory.DOCUMENT, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PowerPoint', 'extract_pptx'),
    'ppt': FileTypeInfo('ppt', FileCategory.DOCUMENT, 'application/vnd.ms-powerpoint', 'Legacy PowerPoint (not supported)', None),
    'xlsx': FileTypeInfo('xlsx', FileCategory.DOCUMENT, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel Spreadsheet', 'extract_xlsx'),
    'xls': FileTypeInfo('xls', FileCategory.DOCUMENT, 'application/vnd.ms-excel', 'Legacy Excel (not supported)', None),
    
    # Images (require OCR)
    'png': FileTypeInfo('png', FileCategory.IMAGE, 'image/png', 'PNG Image', 'extract_image', requires_ocr=True),
    'jpg': FileTypeInfo('jpg', FileCategory.IMAGE, 'image/jpeg', 'JPEG Image', 'extract_image', requires_ocr=True),
    'jpeg': FileTypeInfo('jpeg', FileCategory.IMAGE, 'image/jpeg', 'JPEG Image', 'extract_image', requires_ocr=True),
    'gif': FileTypeInfo('gif', FileCategory.IMAGE, 'image/gif', 'GIF Image', 'extract_image', requires_ocr=True),
    'bmp': FileTypeInfo('bmp', FileCategory.IMAGE, 'image/bmp', 'BMP Image', 'extract_image', requires_ocr=True),
    'tiff': FileTypeInfo('tiff', FileCategory.IMAGE, 'image/tiff', 'TIFF Image', 'extract_image', requires_ocr=True),
    'tif': FileTypeInfo('tif', FileCategory.IMAGE, 'image/tiff', 'TIFF Image', 'extract_image', requires_ocr=True),
    'webp': FileTypeInfo('webp', FileCategory.IMAGE, 'image/webp', 'WebP Image', 'extract_image', requires_ocr=True),
    
    # Text files
    'txt': FileTypeInfo('txt', FileCategory.TEXT, 'text/plain', 'Plain Text', 'extract_text'),
    'md': FileTypeInfo('md', FileCategory.TEXT, 'text/markdown', 'Markdown', 'extract_text'),
    'rtf': FileTypeInfo('rtf', FileCategory.TEXT, 'text/rtf', 'Rich Text', 'extract_text'),
    'csv': FileTypeInfo('csv', FileCategory.TEXT, 'text/csv', 'CSV File', 'extract_text'),
    'json': FileTypeInfo('json', FileCategory.TEXT, 'application/json', 'JSON File', 'extract_text'),
    'xml': FileTypeInfo('xml', FileCategory.TEXT, 'application/xml', 'XML File', 'extract_text'),
    'html': FileTypeInfo('html', FileCategory.TEXT, 'text/html', 'HTML File', 'extract_text'),
    'htm': FileTypeInfo('htm', FileCategory.TEXT, 'text/html', 'HTML File', 'extract_text'),
}

# Convenient lookup sets
SUPPORTED_EXTENSIONS = set(FILE_TYPE_REGISTRY.keys())
IMAGE_EXTENSIONS = {ext for ext, info in FILE_TYPE_REGISTRY.items() if info.category == FileCategory.IMAGE}
DOCUMENT_EXTENSIONS = {ext for ext, info in FILE_TYPE_REGISTRY.items() if info.category == FileCategory.DOCUMENT}
TEXT_EXTENSIONS = {ext for ext, info in FILE_TYPE_REGISTRY.items() if info.category == FileCategory.TEXT}
OCR_EXTENSIONS = {ext for ext, info in FILE_TYPE_REGISTRY.items() if info.requires_ocr}


def get_extension(filename: str) -> str:
    """Get lowercase file extension without dot."""
    return Path(filename).suffix.lower().lstrip('.')


def get_file_info(filename: str) -> Optional[FileTypeInfo]:
    """
    Get file type information from filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        FileTypeInfo object or None if unsupported
    """
    ext = get_extension(filename)
    return FILE_TYPE_REGISTRY.get(ext)


def is_supported(filename: str) -> bool:
    """Check if file type is supported."""
    return get_extension(filename) in SUPPORTED_EXTENSIONS


def requires_ocr(filename: str) -> bool:
    """Check if file requires OCR for text extraction."""
    return get_extension(filename) in OCR_EXTENSIONS


def get_category(filename: str) -> FileCategory:
    """Get the category of a file."""
    info = get_file_info(filename)
    return info.category if info else FileCategory.UNKNOWN


def get_supported_formats() -> Dict[str, list]:
    """Get all supported formats grouped by category."""
    result = {
        'documents': [],
        'images': [],
        'text': [],
    }
    
    for ext, info in FILE_TYPE_REGISTRY.items():
        if info.handler is None:
            continue  # Skip unsupported legacy formats
            
        item = {
            'extension': ext,
            'description': info.description,
            'mime_type': info.mime_type,
        }
        
        if info.category == FileCategory.DOCUMENT:
            result['documents'].append(item)
        elif info.category == FileCategory.IMAGE:
            result['images'].append(item)
        elif info.category == FileCategory.TEXT:
            result['text'].append(item)
    
    return result


def validate_file(filename: str, file_content: bytes, max_size_mb: int = 20) -> Tuple[bool, Optional[str]]:
    """
    Validate a file before processing.
    
    Args:
        filename: Name of the file
        file_content: Raw file bytes
        max_size_mb: Maximum allowed file size in MB
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check if extension is supported
    if not is_supported(filename):
        ext = get_extension(filename)
        return False, f"Unsupported file format: .{ext}. Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
    
    # Check file size
    size_mb = len(file_content) / (1024 * 1024)
    if size_mb > max_size_mb:
        return False, f"File too large ({size_mb:.1f}MB). Maximum size is {max_size_mb}MB."
    
    # Check for legacy formats
    info = get_file_info(filename)
    if info and info.handler is None:
        return False, f"Legacy .{info.extension} format not supported. Please convert to a modern format."
    
    return True, None


# Export commonly used items
__all__ = [
    'FileCategory',
    'FileTypeInfo',
    'FILE_TYPE_REGISTRY',
    'SUPPORTED_EXTENSIONS',
    'IMAGE_EXTENSIONS',
    'DOCUMENT_EXTENSIONS',
    'TEXT_EXTENSIONS',
    'OCR_EXTENSIONS',
    'get_extension',
    'get_file_info',
    'is_supported',
    'requires_ocr',
    'get_category',
    'get_supported_formats',
    'validate_file',
]
