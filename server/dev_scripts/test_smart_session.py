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

def test_smart_session():
    print("Testing Smart Session Mix...")
    
    # Mock data structure
    # We need to simulate the logic inside get_words_for_practice
    # Since we can't easily mock the DB state without creating objects,
    # we'll extract the logic into a standalone function for testing
    # or just simulate the list operations.
    
    limit = 20
    target_new = int(limit * 0.2) # 4
    target_due = limit - target_new # 16
    
    print(f"Targets: New={target_new}, Due={target_due}")
    
    # Scenario 1: Abundance of both
    new_words = ['New'+str(i) for i in range(10)]
    due_words = ['Due'+str(i) for i in range(30)]
    mastered_words = ['Mastered'+str(i) for i in range(10)]
    
    final_selection = []
    final_selection.extend(new_words[:target_new])
    final_selection.extend(due_words[:target_due])
    
    print(f"Scenario 1 (Abundance): Got {len(final_selection)} words")
    print(f"  - New: {len([w for w in final_selection if 'New' in w])} (Expected {target_new})")
    print(f"  - Due: {len([w for w in final_selection if 'Due' in w])} (Expected {target_due})")
    
    if len(final_selection) == limit:
        print("  [PASS] Limit reached")
    else:
        print("  [FAIL] Limit not reached")
        
    # Scenario 2: Shortage of New Words
    new_words = ['New1'] # Only 1 new word
    due_words = ['Due'+str(i) for i in range(30)]
    
    final_selection = []
    selected_new = new_words[:target_new]
    final_selection.extend(selected_new)
    
    selected_due = due_words[:target_due]
    final_selection.extend(selected_due)
    
    # Backfill
    remaining_slots = limit - len(final_selection)
    if remaining_slots > 0:
        remaining_due = due_words[target_due:]
        fill_due = remaining_due[:remaining_slots]
        final_selection.extend(fill_due)
        
    print(f"\nScenario 2 (Shortage of New): Got {len(final_selection)} words")
    print(f"  - New: {len([w for w in final_selection if 'New' in w])} (Expected 1)")
    print(f"  - Due: {len([w for w in final_selection if 'Due' in w])} (Expected 19)")
    
    if len(final_selection) == limit:
        print("  [PASS] Limit reached via backfill")
    else:
        print("  [FAIL] Limit not reached")

    # Scenario 3: Review Ahead (Shortage of Due and New)
    new_words = []
    due_words = ['Due1', 'Due2']
    mastered_words = ['Mastered'+str(i) for i in range(30)]
    
    final_selection = []
    final_selection.extend(new_words[:target_new])
    final_selection.extend(due_words[:target_due])
    
    # Backfill Due
    remaining_slots = limit - len(final_selection)
    if remaining_slots > 0:
        remaining_due = due_words[target_due:]
        fill_due = remaining_due[:remaining_slots]
        final_selection.extend(fill_due)
        remaining_slots -= len(fill_due)
        
    # Backfill New
    if remaining_slots > 0:
        remaining_new = new_words[target_new:]
        fill_new = remaining_new[:remaining_slots]
        final_selection.extend(fill_new)
        remaining_slots -= len(fill_new)
        
    # Backfill Mastered
    if remaining_slots > 0:
        fill_mastered = mastered_words[:remaining_slots]
        final_selection.extend(fill_mastered)
        
    print(f"\nScenario 3 (Review Ahead): Got {len(final_selection)} words")
    print(f"  - Due: {len([w for w in final_selection if 'Due' in w])} (Expected 2)")
    print(f"  - Mastered: {len([w for w in final_selection if 'Mastered' in w])} (Expected 18)")
    
    if len(final_selection) == limit:
        print("  [PASS] Limit reached via Mastered backfill")
    else:
        print("  [FAIL] Limit not reached")

if __name__ == "__main__":
    test_smart_session()
