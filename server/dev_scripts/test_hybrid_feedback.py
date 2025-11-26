import os
import django
import sys
from datetime import timedelta

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Vocabulary
from rest_framework.test import APIRequestFactory
from api.views import record_practice_result
from rest_framework import status

def test_hybrid_feedback():
    print("Testing Hybrid HLR+SM2 Feedback...")
    
    # Create a mock user and vocab
    try:
        user = User.objects.get(username='test_user')
    except User.DoesNotExist:
        user = User.objects.create_user(username='test_user', password='password')
        
    vocab = Vocabulary.objects.create(
        word='TestWord',
        translation='TestTranslation',
        type='noun',
        created_by=user,
        correct_count=0,
        wrong_count=0,
        total_practice_count=0
    )
    
    factory = APIRequestFactory()
    
    # Helper function to make request
    def send_feedback(difficulty, expected_correct, expected_wrong):
        print(f"\nSending '{difficulty}' feedback...")
        request = factory.post('/api/practice/result/', {
            'word_id': vocab.id,
            'difficulty': difficulty
        }, format='json')
        request.user = user
        response = record_practice_result(request)
        
        vocab.refresh_from_db()
        print(f"  Result: Correct={vocab.correct_count}, Wrong={vocab.wrong_count}")
        
        if vocab.correct_count == expected_correct and vocab.wrong_count == expected_wrong:
            print("  [PASS]")
        else:
            print(f"  [FAIL] Expected Correct={expected_correct}, Wrong={expected_wrong}")

    # Test 1: Again (Fail) -> Correct +0, Wrong +1
    send_feedback('again', 0, 1)
    
    # Test 2: Hard (Struggle) -> Correct +1, Wrong +1 (Net +1 Wrong total) => Correct=1, Wrong=2
    send_feedback('hard', 1, 2)
    
    # Test 3: Good (Normal) -> Correct +1 => Correct=2, Wrong=2
    send_feedback('good', 2, 2)
    
    # Test 4: Easy (Perfect) -> Correct +2 => Correct=4, Wrong=2
    send_feedback('easy', 4, 2)
    
    # Cleanup
    vocab.delete()
    # user.delete() # Keep user for other tests if needed

if __name__ == "__main__":
    test_hybrid_feedback()
