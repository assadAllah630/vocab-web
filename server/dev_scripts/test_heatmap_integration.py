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
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views import record_practice_result, user_statistics
from api.models import Vocabulary, Quiz

def test_heatmap_integration():
    print("Testing Heatmap Integration (API -> DB -> Stats)...")
    user = User.objects.first()
    if not user:
        print("No user found!")
        return

    # 1. Create a test word
    word, _ = Vocabulary.objects.get_or_create(
        word="heatmap_test",
        translation="test",
        created_by=user,
        language='de'
    )
    print(f"Test Word ID: {word.id}")

    # 2. Call record_practice_result API
    factory = APIRequestFactory()
    data = {'word_id': word.id, 'was_correct': True}
    request = factory.post('/api/practice/result/', data, format='json')
    force_authenticate(request, user=user)
    
    print("Calling record_practice_result...")
    response = record_practice_result(request)
    print(f"Record Result Status: {response.status_code}")
    
    if response.status_code != 200:
        print("Failed to record result!")
        return

    # 3. Verify Quiz Object Created
    quiz_count = Quiz.objects.filter(user=user, vocab=word).count()
    print(f"Quiz entries for word: {quiz_count}")
    if quiz_count == 0:
        print("[FAIL] No Quiz entry created!")
        return
    else:
        print("[OK] Quiz entry created.")

    # 4. Call user_statistics API to check Heatmap Data
    request_stats = factory.get('/api/stats/')
    force_authenticate(request_stats, user=user)
    
    print("Calling user_statistics...")
    stats_response = user_statistics(request_stats)
    
    if 'activity_log' in stats_response.data:
        log = stats_response.data['activity_log']
        today_str = timezone.now().strftime('%Y-%m-%d')
        
        if today_str in log:
            print(f"  [OK] Found activity for today ({today_str}): {log[today_str]}")
            if log[today_str] >= 1:
                print("  [PASS] Heatmap data is correct!")
            else:
                print("  [FAIL] Activity count is 0!")
        else:
            print(f"  [FAIL] Today's date {today_str} not in activity log!")
            print(f"  Log keys: {list(log.keys())}")
    else:
        print("[FAIL] activity_log missing from response")

if __name__ == "__main__":
    test_heatmap_integration()
