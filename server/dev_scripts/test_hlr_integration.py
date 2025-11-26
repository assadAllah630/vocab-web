import os
import django
import sys
import math
from datetime import timedelta

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.models import Vocabulary
from api.hlr import HLRScheduler
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from api.views import get_words_for_practice, record_practice_result, get_review_stats

def test_hlr_math():
    print("Testing HLR Math...")
    # Test 1: New item (0 correct, 0 wrong)
    h = HLRScheduler.estimate_half_life(0, 0, 0)
    print(f"  Half-life (0,0,0): {h:.4f} days")
    
    # Test 2: Correct item
    h_correct = HLRScheduler.estimate_half_life(1, 0, 1)
    print(f"  Half-life (1,0,1): {h_correct:.4f} days")
    assert h_correct > h, "Correct answer should increase stability"
    
    # Test 3: Wrong item
    h_wrong = HLRScheduler.estimate_half_life(0, 1, 1)
    print(f"  Half-life (0,1,1): {h_wrong:.4f} days")
    assert h_wrong < h, "Wrong answer should decrease stability"
    
    # Test 4: Recall Probability
    p = HLRScheduler.predict_recall_probability(1, 0, 1, 1) # 1 day since practice
    print(f"  Recall Prob (1,0,1, 1 day): {p:.4f}")
    
    print("HLR Math Tests Passed!\n")

def test_db_integration():
    print("Testing DB Integration...")
    user = User.objects.first()
    if not user:
        print("  Skipping DB tests (no user)")
        return

    # Create test word
    vocab, _ = Vocabulary.objects.get_or_create(
        word="HLR_TEST_WORD",
        defaults={
            'translation': 'Test',
            'type': 'noun',
            'created_by': user,
            'language': 'de'
        }
    )
    
    # Reset stats
    vocab.correct_count = 0
    vocab.wrong_count = 0
    vocab.total_practice_count = 0
    vocab.last_practiced_at = None
    vocab.save()
    
    # Test record_practice_result
    factory = APIRequestFactory()
    
    # 1. Record Correct
    request = factory.post('/api/practice/result', {'word_id': vocab.id, 'was_correct': True}, format='json')
    request.user = user
    response = record_practice_result(request)
    assert response.status_code == 200
    
    vocab.refresh_from_db()
    assert vocab.correct_count == 1
    assert vocab.total_practice_count == 1
    assert vocab.last_practiced_at is not None
    print("  Record Correct: OK")
    
    # 2. Record Wrong
    request = factory.post('/api/practice/result', {'word_id': vocab.id, 'was_correct': False}, format='json')
    request.user = user
    response = record_practice_result(request)
    assert response.status_code == 200
    
    vocab.refresh_from_db()
    assert vocab.wrong_count == 1
    assert vocab.total_practice_count == 2
    print("  Record Wrong: OK")
    
    # 3. Get Words for Practice
    request = factory.get('/api/practice/words?limit=5')
    request.user = user
    response = get_words_for_practice(request)
    assert response.status_code == 200
    data = response.data
    print(f"  Get Words: Returned {len(data)} words")
    
    # Verify our test word is in there (it might not be first if others have lower recall)
    found = any(w['id'] == vocab.id for w in data)
    print(f"  Test word found in practice list: {found}")
    
    # 4. Get Stats
    request = factory.get('/api/practice/stats')
    request.user = user
    response = get_review_stats(request)
    assert response.status_code == 200
    print(f"  Stats: {response.data}")
    
    # Cleanup
    vocab.delete()
    print("DB Integration Tests Passed!")

if __name__ == "__main__":
    test_hlr_math()
    test_db_integration()
