import os
import sys
import django
import numpy as np
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.models import Vocabulary
from api.embedding_service import EmbeddingService
from django.contrib.auth.models import User

def verify_db():
    api_key = "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"
    
    try:
        user = User.objects.get(username="assad")
        print(f"User: {user.username}")
        
        # Check 'katze'
        katze = Vocabulary.objects.filter(created_by=user, word__iexact="katze").first()
        if not katze:
            print("❌ 'katze' not found in DB!")
        else:
            print(f"Found 'katze'. Embedding length: {len(katze.embedding) if katze.embedding else 0}")
            if katze.embedding:
                # Generate 'Animal' embedding
                print("Generating embedding for 'Animal'...")
                animal_emb = EmbeddingService.generate_embedding("Animal", api_key)
                
                # Calculate similarity
                e1 = np.array(katze.embedding)
                e2 = np.array(animal_emb)
                sim = np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2))
                
                print(f"Similarity 'katze' vs 'Animal': {sim:.4f}")
                
                if sim > 0.20:
                    print("✅ Similarity is above threshold (0.20). Search SHOULD work.")
                else:
                    print("❌ Similarity is BELOW threshold (0.20). Search will FAIL.")
            else:
                print("❌ 'katze' has NO embedding!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_db()
