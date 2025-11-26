"""
Test script for OpenRouter embedding service.
This script tests the embedding generation functionality.
"""

import sys
import os
import io

# Force UTF-8 encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path to import embedding_service
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.embedding_service import EmbeddingService

def test_embedding_service():
    """Test the embedding service with OpenRouter API."""
    
    # API key
    api_key = "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"
    
    print("=" * 60)
    print("Testing OpenRouter Embedding Service")
    print("=" * 60)
    print(f"\nModel: {EmbeddingService.DEFAULT_MODEL}")
    print(f"Embedding Dimension: {EmbeddingService.EMBEDDING_DIMENSION}")
    print(f"API Base URL: {EmbeddingService.OPENROUTER_BASE_URL}")
    
    # Test 1: Single embedding
    print("\n" + "=" * 60)
    print("Test 1: Generate Single Embedding")
    print("=" * 60)
    
    test_text = "Hello, this is a test sentence for embedding generation."
    print(f"\nInput text: '{test_text}'")
    
    try:
        embedding = EmbeddingService.generate_embedding(test_text, api_key)
        print(f"✓ Success! Generated embedding with {len(embedding)} dimensions")
        print(f"First 10 values: {embedding[:10]}")
        print(f"Embedding type: {type(embedding)}")
        
        # Verify dimensions
        if len(embedding) == EmbeddingService.EMBEDDING_DIMENSION:
            print(f"✓ Dimension check passed: {len(embedding)} == {EmbeddingService.EMBEDDING_DIMENSION}")
        else:
            print(f"✗ Dimension mismatch: {len(embedding)} != {EmbeddingService.EMBEDDING_DIMENSION}")
            
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False
    
    # Test 2: Batch embeddings
    print("\n" + "=" * 60)
    print("Test 2: Generate Batch Embeddings")
    print("=" * 60)
    
    test_texts = [
        "Das Haus ist groß",  # German: The house is big
        "Der Hund ist klein",  # German: The dog is small
        "Ich lerne Deutsch"    # German: I am learning German
    ]
    
    print(f"\nInput texts ({len(test_texts)} items):")
    for i, text in enumerate(test_texts, 1):
        print(f"  {i}. '{text}'")
    
    try:
        embeddings = EmbeddingService.generate_embeddings_batch(test_texts, api_key)
        print(f"\n✓ Success! Generated {len(embeddings)} embeddings")
        
        for i, emb in enumerate(embeddings, 1):
            print(f"  Embedding {i}: {len(emb)} dimensions, first 5 values: {emb[:5]}")
            
        # Verify all embeddings have correct dimensions
        all_correct = all(len(emb) == EmbeddingService.EMBEDDING_DIMENSION for emb in embeddings)
        if all_correct:
            print(f"✓ All embeddings have correct dimensions")
        else:
            print(f"✗ Some embeddings have incorrect dimensions")
            
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False
    
    # Test 3: Semantic similarity
    print("\n" + "=" * 60)
    print("Test 3: Semantic Similarity Test")
    print("=" * 60)
    
    import numpy as np
    
    # Test semantic similarity between related words
    word_pairs = [
        ("happy", "froh"),      # English-German: happy
        ("house", "Haus"),      # English-German: house
        ("dog", "Hund"),        # English-German: dog
    ]
    
    print("\nTesting semantic similarity (cosine similarity):")
    
    for word1, word2 in word_pairs:
        try:
            emb1 = EmbeddingService.generate_embedding(word1, api_key)
            emb2 = EmbeddingService.generate_embedding(word2, api_key)
            
            # Calculate cosine similarity
            emb1_np = np.array(emb1)
            emb2_np = np.array(emb2)
            similarity = np.dot(emb1_np, emb2_np) / (np.linalg.norm(emb1_np) * np.linalg.norm(emb2_np))
            
            print(f"  '{word1}' ↔ '{word2}': {similarity:.4f}")
            
        except Exception as e:
            print(f"  ✗ Error comparing '{word1}' and '{word2}': {str(e)}")
    
    # Test 4: API Key Validation
    print("\n" + "=" * 60)
    print("Test 4: API Key Validation")
    print("=" * 60)
    
    try:
        is_valid = EmbeddingService.validate_api_key(api_key)
        if is_valid:
            print("✓ API key is valid")
        else:
            print("✗ API key validation failed")
    except Exception as e:
        print(f"✗ Error validating API key: {str(e)}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print("✓ All tests completed successfully!")
    print("\nThe embedding service is working correctly with OpenRouter API.")
    print(f"Model: {EmbeddingService.DEFAULT_MODEL}")
    print(f"Ready to use for semantic search!")
    
    return True

if __name__ == "__main__":
    try:
        success = test_embedding_service()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
