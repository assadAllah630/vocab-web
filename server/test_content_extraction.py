"""
Test script for content extraction service.
"""
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.content_extraction_service import (
    extract_content_from_url,
    extract_youtube_transcript,
    ContentExtractor
)

def test_content_extraction():
    print("=" * 60)
    print("Content Extraction Service Test")
    print("=" * 60)
    
    # Test 1: YouTube transcript extraction
    print("\n1. Testing YouTube transcript extraction...")
    try:
        # Use a popular video that definitely has transcripts
        result = extract_youtube_transcript('dQw4w9WgXcQ')  # Rick Astley - Never Gonna Give You Up
        print(f"   ✓ Title: {result['title']}")
        print(f"   ✓ Language: {result['language']}")
        print(f"   ✓ Word count: {result['word_count']}")
        print(f"   ✓ Transcript type: {result['metadata'].get('transcript_type')}")
        print(f"   ✓ First 100 chars: {result['content'][:100]}...")
        print("   PASSED!")
    except Exception as e:
        print(f"   ✗ FAILED: {e}")
    
    # Test 2: Article extraction (Wikipedia - always available)
    print("\n2. Testing article extraction (Wikipedia)...")
    try:
        result = extract_content_from_url('https://en.wikipedia.org/wiki/Python_(programming_language)')
        print(f"   ✓ Title: {result['title'][:50]}...")
        print(f"   ✓ Source type: {result['source_type']}")
        print(f"   ✓ Language: {result['language']}")
        print(f"   ✓ Word count: {result['word_count']}")
        print(f"   ✓ Extractor: {result['metadata'].get('extractor')}")
        print("   PASSED!")
    except Exception as e:
        print(f"   ✗ FAILED: {e}")
    
    # Test 3: YouTube ID detection
    print("\n3. Testing YouTube URL pattern detection...")
    extractor = ContentExtractor()
    
    test_urls = [
        ('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
        ('https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
        ('https://youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
        ('https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'),
        ('https://example.com/article', None),
    ]
    
    all_passed = True
    for url, expected_id in test_urls:
        result = extractor._extract_youtube_id(url)
        if result == expected_id:
            print(f"   ✓ {url[:40]}... -> {result}")
        else:
            print(f"   ✗ {url[:40]}... -> Expected {expected_id}, got {result}")
            all_passed = False
    
    if all_passed:
        print("   PASSED!")
    else:
        print("   SOME TESTS FAILED!")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == '__main__':
    test_content_extraction()
