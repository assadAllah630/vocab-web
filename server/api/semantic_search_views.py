# Semantic Search Endpoints

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Vocabulary, UserProfile
from .serializers import VocabularySerializer
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def semantic_search(request):
    """
    Perform semantic search on vocabulary using embeddings.
    Expects: query (str), api_key (str), limit (int, optional)
    """
    from .embedding_service import EmbeddingService
    import numpy as np
    
    query = request.data.get('query')
    api_key = request.data.get('api_key')
    limit = request.data.get('limit', 10)
    
    if not query:
        return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not api_key:
        return Response({'error': 'OpenRouter API key is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get user's target language
        try:
            target_lang = request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
        
        # Generate embedding for query
        query_embedding = EmbeddingService.generate_embedding(query, api_key)
        
        # Get all vocabulary with embeddings
        vocab_list = Vocabulary.objects.filter(
            created_by=request.user,
            language=target_lang,
            embedding__isnull=False
        )
        
        if not vocab_list.exists():
            return Response({
                'results': [],
                'message': 'No vocabulary with embeddings found. Please generate embeddings first.'
            })
        
        # Calculate cosine similarity for each vocabulary item
        results = []
        min_similarity = 0.20  # Optimized threshold based on debug analysis
        
        for vocab in vocab_list:
            if vocab.embedding:
                # Calculate cosine similarity
                vocab_emb = np.array(vocab.embedding)
                query_emb = np.array(query_embedding)
                
                # Cosine similarity
                similarity = np.dot(query_emb, vocab_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(vocab_emb))
                
                # Only include if similarity is above threshold
                if similarity >= min_similarity:
                    results.append({
                        'vocab': VocabularySerializer(vocab).data,
                        'similarity': float(similarity)
                    })
        
        # Sort by similarity (descending)
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Return top N results
        return Response({
            'results': results[:limit],
            'total': len(results)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_embeddings(request):
    """
    Generate embeddings for all vocabulary items that don't have them.
    Expects: api_key (str)
    """
    from .embedding_service import EmbeddingService
    
    api_key = request.data.get('api_key')
    
    if not api_key:
        return Response({'error': 'OpenRouter API key is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get user's target language
        try:
            target_lang = request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        print(f"DEBUG: User: {request.user.username}, Target Lang: {target_lang}")
        
        # Get vocabulary (update all to ensure consistent embedding quality)
        vocab_list = Vocabulary.objects.filter(
            created_by=request.user,
            language=target_lang
        )
        
        count = vocab_list.count()
        print(f"DEBUG: Found {count} vocabulary items")
        
        if not vocab_list.exists():
            print("DEBUG: No vocab found, returning early")
            return Response({
                'message': 'No vocabulary items found',
                'count': 0
            })
        
        # Generate embeddings in batches
        batch_size = 100
        total_count = vocab_list.count()
        processed_count = 0
        
        for i in range(0, total_count, batch_size):
            batch = list(vocab_list[i:i+batch_size])
            
            # Create text for embedding (Simplified: Word + Translation)
            # This matches the optimized logic in VocabularyViewSet
            texts = []
            for vocab in batch:
                text = f"{vocab.word} {vocab.translation}"
                texts.append(text)
            
            # Generate embeddings
            embeddings = EmbeddingService.generate_embeddings_batch(texts, api_key)
            
            # Update vocabulary items
            for vocab, embedding in zip(batch, embeddings):
                vocab.embedding = embedding
                vocab.save(update_fields=['embedding'])
                processed_count += 1
        
        return Response({
            'message': f'Successfully generated embeddings for {processed_count} vocabulary items',
            'count': processed_count
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_openrouter_key(request):
    """
    Validate OpenRouter API key.
    """
    from .embedding_service import EmbeddingService
    
    api_key = request.data.get('api_key')
    
    if not api_key:
        return Response({'valid': False, 'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        is_valid = EmbeddingService.validate_api_key(api_key)
        return Response({'valid': is_valid})
    except Exception as e:
        return Response({'valid': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
