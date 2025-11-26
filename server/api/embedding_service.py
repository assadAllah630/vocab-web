"""
Embedding service for generating vector embeddings using OpenRouter API.
"""
import requests
import json
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating embeddings via OpenRouter API."""
    
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    # Free embedding model compatible with OpenRouter
    # Using text-embedding-3-small which is available through OpenRouter
    DEFAULT_MODEL = "openai/text-embedding-3-small"
    EMBEDDING_DIMENSION = 1536
    
    @staticmethod
    def generate_embedding(text: str, api_key: str, model: str = None) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            api_key: OpenRouter API key
            model: Embedding model to use (default: text-embedding-3-small)
            
        Returns:
            List of floats representing the embedding vector
        """
        if not text or not text.strip():
            return [0.0] * EmbeddingService.EMBEDDING_DIMENSION
            
        model = model or EmbeddingService.DEFAULT_MODEL
        
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "model": model,
                "input": text.strip()
            }
            
            response = requests.post(
                f"{EmbeddingService.OPENROUTER_BASE_URL}/embeddings",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            data = response.json()
            
            if 'data' in data and len(data['data']) > 0:
                return data['data'][0]['embedding']
            else:
                logger.error(f"Unexpected response format: {data}")
                return [0.0] * EmbeddingService.EMBEDDING_DIMENSION
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise Exception(f"Failed to generate embedding: {str(e)}")
    
    @staticmethod
    def generate_embeddings_batch(texts: List[str], api_key: str, model: str = None) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch.
        
        Args:
            texts: List of texts to embed
            api_key: OpenRouter API key
            model: Embedding model to use
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
            
        # Filter out empty texts
        valid_texts = [t.strip() for t in texts if t and t.strip()]
        if not valid_texts:
            return [[0.0] * EmbeddingService.EMBEDDING_DIMENSION] * len(texts)
        
        model = model or EmbeddingService.DEFAULT_MODEL
        
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "model": model,
                "input": valid_texts
            }
            
            response = requests.post(
                f"{EmbeddingService.OPENROUTER_BASE_URL}/embeddings",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            if 'data' in data:
                # Sort by index to maintain order
                sorted_data = sorted(data['data'], key=lambda x: x.get('index', 0))
                return [item['embedding'] for item in sorted_data]
            else:
                logger.error(f"Unexpected response format: {data}")
                return [[0.0] * EmbeddingService.EMBEDDING_DIMENSION] * len(texts)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            raise Exception(f"Failed to generate batch embeddings: {str(e)}")
    
    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """
        Validate OpenRouter API key by making a test request.
        
        Args:
            api_key: OpenRouter API key to validate
            
        Returns:
            True if valid, False otherwise
        """
        try:
            EmbeddingService.generate_embedding("test", api_key)
            return True
        except Exception:
            return False
