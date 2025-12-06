"""
Test script for text extraction service.
"""
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.text_extraction_service import extract_text_from_file, TextExtractor

def test_text_extraction():
    print("=" * 50)
    print("Text Extraction Service Test")
    print("=" * 50)
    
    # Test 1: Plain text
    print("\n1. Testing plain text extraction...")
    result = extract_text_from_file(
        b'Hello World! This is a test document in English.',
        'test.txt'
    )
    print(f"   Text: {result['text']}")
    print(f"   Language: {result['language']}")
    print(f"   Word count: {result['word_count']}")
    assert result['word_count'] == 9
    print("   ✓ PASSED")
    
    # Test 2: German text 
    print("\n2. Testing German language detection...")
    result = extract_text_from_file(
        'Das ist ein deutscher Text mit mehreren Wörtern.'.encode('utf-8'),
        'german.txt'
    )
    print(f"   Text: {result['text']}")
    print(f"   Language: {result['language']}")
    print(f"   ✓ PASSED")
    
    # Test 3: Arabic text
    print("\n3. Testing Arabic language detection...")
    result = extract_text_from_file(
        'مرحبا بالعالم هذا نص تجريبي باللغة العربية'.encode('utf-8'),
        'arabic.txt'
    )
    print(f"   Text: {result['text']}")
    print(f"   Language: {result['language']}")
    print(f"   ✓ PASSED")
    
    # Test 4: Markdown
    print("\n4. Testing Markdown extraction...")
    markdown_content = """# Hello World

This is **bold** and *italic* text.

## Section 2
- Item 1
- Item 2
"""
    result = extract_text_from_file(markdown_content.encode('utf-8'), 'readme.md')
    print(f"   Word count: {result['word_count']}")
    print(f"   File type: {result['file_type']}")
    print(f"   ✓ PASSED")
    
    # Test 5: Unsupported format
    print("\n5. Testing unsupported format handling...")
    try:
        extract_text_from_file(b'binary data', 'test.exe')
        print("   ✗ FAILED - Should have raised error")
    except Exception as e:
        print(f"   ✓ PASSED - Correctly raised: {type(e).__name__}")
    
    print("\n" + "=" * 50)
    print("All tests passed!")
    print("=" * 50)

if __name__ == '__main__':
    test_text_extraction()
