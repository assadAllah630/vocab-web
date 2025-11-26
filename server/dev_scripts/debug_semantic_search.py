import os
import sys
import django
import numpy as np
import io

# Force UTF-8 encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.models import Vocabulary, UserProfile
from api.embedding_service import EmbeddingService
from django.contrib.auth.models import User

def debug_semantic_search():
    print("="*60)
    print("DEBUGGING SEMANTIC SEARCH")
    print("="*60)
    
    # API Key
    api_key = "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"
    print(f"Using API Key: {api_key[:10]}...")

    # 1. Check User Vocabulary
    print("\n" + "="*60)
    print("DEBUGGING USER VOCABULARY")
    print("="*60)
    
    try:
        user = User.objects.get(username="assad")
        print(f"User found: {user.username} (ID: {user.id})")
        
        target_lang = 'de'
        try:
            profile = user.profile
            target_lang = profile.target_language
        except:
            pass
            
        vocab_count = Vocabulary.objects.filter(created_by=user, language=target_lang).count()
        print(f"Vocabulary Count for {user.username} ({target_lang}): {vocab_count}")
        
    except User.DoesNotExist:
        print("User 'assad' not found.")
        return

    # 2. Test Improved Embedding Formats
    print("\n" + "="*60)
    print("TESTING IMPROVED EMBEDDING FORMATS")
    print("="*60)
    
    test_cases = [
        ("katze", "cat", "animal"),
        ("Apfel", "Apple", "animal"),
        ("langsam", "slow", "بطيئ"),
        ("Gehen", "Walk", "بطيئ")
    ]
    
    for word, trans, query in test_cases:
        print(f"\nTarget: {word} ({trans}) | Query: {query}")
        
        text1 = f"{word} {trans} Die Katze schläft auf dem Sofa." # Mock old format
        text3 = f"{word} {trans}" # New format
        
        try:
            emb1 = EmbeddingService.generate_embedding(text1, api_key)
            emb3 = EmbeddingService.generate_embedding(text3, api_key)
            query_emb = EmbeddingService.generate_embedding(query, api_key)
            
            def calc_sim(e1, e2):
                return np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2))
                
            sim1 = calc_sim(query_emb, emb1)
            sim3 = calc_sim(query_emb, emb3)
            
            print(f"  Format 1 (Old):    '{text1}' -> {sim1:.4f}")
            print(f"  Format 3 (Simple): '{text3}' -> {sim3:.4f}")
            
        except Exception as e:
            print(f"  ❌ Error: {e}")

    # 3. Test Batch Generation
    print("\n" + "="*60)
    print("TESTING BATCH GENERATION")
    print("="*60)
    
    batch_texts = ["Hello World", "Testing Batch", "OpenRouter API"]
    try:
        print(f"Sending batch of {len(batch_texts)} items...")
        embeddings = EmbeddingService.generate_embeddings_batch(batch_texts, api_key)
        print(f"Received {len(embeddings)} embeddings")
        
        is_zero = all(all(x == 0.0 for x in emb) for emb in embeddings)
        if is_zero:
            print("❌ FAILURE: Received ZERO vectors!")
        else:
            print("✅ SUCCESS: Received valid embeddings.")
            
    except Exception as e:
        print(f"❌ ERROR in Batch: {e}")

    # 5. FORCE UPDATE DATABASE
    print("\n" + "="*60)
    print("FORCE UPDATING DATABASE EMBEDDINGS")
    print("="*60)
    
    try:
        vocab_list = Vocabulary.objects.filter(created_by=user, language=target_lang)
        count = vocab_list.count()
        print(f"Updating {count} items for user {user.username}...")
        
        updated = 0
        for vocab in vocab_list:
            # Use Format 3 (Simple)
            text = f"{vocab.word} {vocab.translation}"
            try:
                embedding = EmbeddingService.generate_embedding(text, api_key)
                vocab.embedding = embedding
                vocab.save(update_fields=['embedding'])
                print(f"✅ Updated: {vocab.word} ({vocab.translation})")
                updated += 1
            except Exception as e:
                print(f"❌ Failed to update {vocab.word}: {e}")
                
        print(f"\nSuccessfully updated {updated}/{count} items.")
        
    except Exception as e:
        print(f"❌ Critical Error in Force Update: {e}")

if __name__ == "__main__":
    debug_semantic_search()
