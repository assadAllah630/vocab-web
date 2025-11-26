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

def test_priority_sorting():
    print("Testing HLR Priority Sorting...")
    
    # Mock data
    # 1. Urgent Word (Forgot)
    urgent_p = HLRScheduler.get_priority_score(correct_count=1, wrong_count=2, total_count=3, days_since_last_practice=10)
    print(f"Urgent Word Priority: {urgent_p:.4f} (Should be high)")
    
    # 2. Mastered Word
    mastered_p = HLRScheduler.get_priority_score(correct_count=10, wrong_count=0, total_count=10, days_since_last_practice=1)
    print(f"Mastered Word Priority: {mastered_p:.4f} (Should be low)")
    
    # 3. New Word
    new_p = 0.5
    print(f"New Word Priority: {new_p:.4f} (Fixed default)")
    
    # Simulate sorting
    items = [
        ('Urgent', urgent_p),
        ('Mastered', mastered_p),
        ('New', new_p)
    ]
    
    items.sort(key=lambda x: x[1], reverse=True)
    
    print("\nSorted Order (Expected: Urgent -> New -> Mastered):")
    for name, p in items:
        print(f"  {name}: {p:.4f}")
        
    if items[0][0] == 'Urgent' and items[1][0] == 'New' and items[2][0] == 'Mastered':
        print("\n[PASS] Sorting logic is correct!")
    else:
        print("\n[FAIL] Sorting logic is incorrect!")

if __name__ == "__main__":
    test_priority_sorting()
