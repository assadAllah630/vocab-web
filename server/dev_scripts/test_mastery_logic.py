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
from api.hlr import HLRScheduler

def test_mastery_logic():
    print("Testing Mastery Logic...")
    
    # Define test cases
    # (correct, wrong, total, days_since, expected_status)
    test_cases = [
        # Case 1: High recall but low practice count -> Learning
        (2, 0, 2, 0, 'learning'), 
        
        # Case 2: High recall and high practice count -> Mastered
        (5, 0, 5, 0, 'mastered'),
        
        # Case 3: Low recall -> Needs Review (New/Weak)
        (1, 2, 3, 10, 'new'), # In get_vocab_by_status, recall < 0.5 is 'new'
        
        # Case 4: Moderate recall -> Learning
        (3, 1, 4, 2, 'learning')
    ]
    
    for i, (correct, wrong, total, days, expected) in enumerate(test_cases):
        recall_prob = HLRScheduler.predict_recall_probability(correct, wrong, total, days)
        
        # Logic from views.py
        is_mastered = total >= 3 and recall_prob > 0.9
        
        if is_mastered:
            status = 'mastered'
        elif recall_prob < 0.5:
            status = 'new'
        else:
            status = 'learning'
            
        print(f"Case {i+1}: Correct={correct}, Total={total}, Days={days}, Recall={recall_prob:.2f}")
        print(f"  -> Status: {status} (Expected: {expected})")
        
        if status == expected:
            print("  [PASS]")
        else:
            print("  [FAIL]")

if __name__ == "__main__":
    test_mastery_logic()
