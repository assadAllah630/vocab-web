"""
Text Formatting Service
Converts plain text to readable Markdown format without changing the content.
Adds proper structure, paragraphs, and formatting for better readability.
"""
import re
from typing import Optional


def format_text_to_markdown(text: str, source_type: str = 'unknown') -> str:
    """
    Convert plain text to readable Markdown format.
    
    This does NOT change the content - only improves formatting for
    better readability in a Markdown renderer.
    
    Args:
        text: Raw text content
        source_type: Type of source (youtube, article, pdf, etc.)
        
    Returns:
        Formatted Markdown text
    """
    if not text or not text.strip():
        return text
    
    # Apply formatting based on source type
    if source_type == 'youtube':
        return _format_youtube_transcript(text)
    elif source_type in ('article', 'webpage'):
        return _format_article(text)
    elif source_type == 'pdf':
        return _format_pdf_text(text)
    else:
        return _format_generic(text)


def _format_youtube_transcript(text: str) -> str:
    """
    Format YouTube transcript for readability.
    - Group into paragraphs (every ~150 words or natural breaks)
    - Add spacing between sections
    """
    lines = text.strip().split('\n')
    
    # Clean up lines
    lines = [line.strip() for line in lines if line.strip()]
    
    # Group into paragraphs
    paragraphs = []
    current_paragraph = []
    word_count = 0
    
    for line in lines:
        current_paragraph.append(line)
        word_count += len(line.split())
        
        # Create new paragraph at ~150 words or sentence endings
        if word_count >= 150 or (line.endswith('.') and word_count >= 50):
            paragraph_text = ' '.join(current_paragraph)
            paragraphs.append(paragraph_text)
            current_paragraph = []
            word_count = 0
    
    # Add remaining content
    if current_paragraph:
        paragraphs.append(' '.join(current_paragraph))
    
    return '\n\n'.join(paragraphs)


def _format_article(text: str) -> str:
    """
    Format article text for readability.
    - Preserve existing structure
    - Ensure proper paragraph breaks
    - Clean up extra whitespace
    """
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Split into paragraphs (preserve double newlines)
    paragraphs = re.split(r'\n\s*\n', text)
    
    # Clean each paragraph
    cleaned = []
    for para in paragraphs:
        # Normalize whitespace within paragraph
        para = ' '.join(para.split())
        if para.strip():
            cleaned.append(para)
    
    return '\n\n'.join(cleaned)


def _format_pdf_text(text: str) -> str:
    """
    Format PDF-extracted text for readability.
    PDF text often has weird line breaks mid-sentence.
    """
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    lines = text.split('\n')
    result = []
    current_paragraph = []
    
    for line in lines:
        line = line.strip()
        
        # Empty line = paragraph break
        if not line:
            if current_paragraph:
                result.append(' '.join(current_paragraph))
                current_paragraph = []
            continue
        
        # Check if this looks like a heading
        if _looks_like_heading(line):
            if current_paragraph:
                result.append(' '.join(current_paragraph))
                current_paragraph = []
            # Add as heading if short enough
            if len(line.split()) <= 10:
                result.append(f'## {line}')
            else:
                result.append(line)
            continue
        
        # Check if previous line ended mid-sentence (lowercase + no ending punctuation)
        if current_paragraph:
            prev = current_paragraph[-1]
            # If previous line ended with hyphen (word break)
            if prev.endswith('-'):
                current_paragraph[-1] = prev[:-1] + line
                continue
        
        current_paragraph.append(line)
    
    # Add final paragraph
    if current_paragraph:
        result.append(' '.join(current_paragraph))
    
    return '\n\n'.join(result)


def _format_generic(text: str) -> str:
    """
    Generic text formatting.
    """
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Split by double newlines first (preserve paragraph breaks)
    paragraphs = re.split(r'\n\s*\n', text)
    
    result = []
    for para in paragraphs:
        # Clean up single newlines within paragraph
        para = ' '.join(para.split())
        if para.strip():
            result.append(para)
    
    return '\n\n'.join(result)


def _looks_like_heading(line: str) -> bool:
    """
    Check if a line looks like a heading.
    """
    line = line.strip()
    
    # All caps or title case with short length
    words = line.split()
    if len(words) <= 8:
        if line.isupper() or line.istitle():
            return True
    
    # Numbered headings (1. Title, I. Title, etc.)
    if re.match(r'^(\d+\.|[IVXLC]+\.|[A-Z]\.) ', line):
        return True
    
    return False


def format_with_ai(text: str, client, source_type: str = 'unknown') -> str:
    """
    Optionally use AI to intelligently format text.
    This maintains content but improves structure.
    
    Args:
        text: Raw text
        client: AI client for formatting
        source_type: Type of content
        
    Returns:
        AI-formatted Markdown
    """
    prompt = f"""Format the following text into clean, readable Markdown.

RULES:
1. DO NOT change any words or meaning
2. DO NOT add any new content
3. Only add proper paragraph breaks
4. Add headings where appropriate (if text suggests section breaks)
5. Keep all original text exactly as-is

Source type: {source_type}

TEXT TO FORMAT:
{text[:10000]}  # Limit to prevent token overflow
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # or any available model
            messages=[
                {"role": "system", "content": "You are a text formatter. You ONLY format text into Markdown without changing any content."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=8000,
            temperature=0.1  # Low temp for consistency
        )
        return response.choices[0].message.content
    except Exception as e:
        # Fall back to rule-based formatting
        return format_text_to_markdown(text, source_type)
