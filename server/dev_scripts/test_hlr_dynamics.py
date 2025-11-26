import os
import django
import sys
import time
from datetime import timedelta

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Vocabulary
from api.hlr import HLRScheduler

def test_hlr_dynamics():
    print("Testing HLR Dynamics...")
    user = User.objects.first()
    if not user:
        print("No user found!")
        return

    # 1. Create a test word
    word, created = Vocabulary.objects.get_or_create(
        word="test_dynamic",
        translation="test_dynamic",
        created_by=user,
        language='de'
    )
    # Reset stats
    word.correct_count = 0
    word.wrong_count = 0
    word.total_practice_count = 0
    word.last_practiced_at = None
    word.save()
    
    print(f"\n1. New Word Created: '{word.word}'")
    print("   - Last Practiced: Never")
    print("   - Priority: (New words are handled separately, effectively high priority)")

    # 2. Simulate Practice (Correct)
    print("\n2. Simulating Practice (Correct Answer)...")
    word.correct_count += 1
    word.total_practice_count += 1
    word.last_practiced_at = timezone.now()
    word.save()
    
    # Calculate immediate priority
    days_since = 0
    priority_immediate = HLRScheduler.get_priority_score(
        word.correct_count, word.wrong_count, word.total_practice_count, days_since
    )
    recall_immediate = HLRScheduler.predict_recall_probability(
        word.correct_count, word.wrong_count, word.total_practice_count, days_since
    )
    
    print(f"   - Immediate Recall Prob: {recall_immediate*100:.1f}%")
    print(f"   - Immediate Priority: {priority_immediate:.4f}")
    
    # 3. Simulate Time Passing (1 day later)
    print("\n3. Simulating 1 Day Passing...")
    days_later = 1
    priority_later = HLRScheduler.get_priority_score(
        word.correct_count, word.wrong_count, word.total_practice_count, days_later
    )
    recall_later = HLRScheduler.predict_recall_probability(
        word.correct_count, word.wrong_count, word.total_practice_count, days_later
    )
    
    print(f"   - Recall Prob after 1 day: {recall_later*100:.1f}%")
    print(f"   - Priority after 1 day: {priority_later:.4f}")
    
    if priority_later > priority_immediate:
        print("   [OK] Priority INCREASED as time passed (Correct behavior)")
    else:
        print("   [FAIL] Priority did not increase (Unexpected)")

    # 4. Simulate Wrong Answer
    print("\n4. Simulating Wrong Answer (Today)...")
    word.wrong_count += 1
    word.total_practice_count += 1
    word.last_practiced_at = timezone.now() # Reset time to now
    word.save()
    
    priority_wrong = HLRScheduler.get_priority_score(
        word.correct_count, word.wrong_count, word.total_practice_count, 0
    )
    recall_wrong = HLRScheduler.predict_recall_probability(
        word.correct_count, word.wrong_count, word.total_practice_count, 0
    )
    
    print(f"   - Recall Prob after wrong: {recall_wrong*100:.1f}%")
    print(f"   - Priority after wrong: {priority_wrong:.4f}")
    
    if priority_wrong > priority_immediate:
         print("   [OK] Priority is HIGHER after wrong answer than initial correct answer (Correct behavior)")

if __name__ == "__main__":
    test_hlr_dynamics()
