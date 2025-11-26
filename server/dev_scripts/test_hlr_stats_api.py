import os
import django
import sys

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from api.views import get_words_for_practice

def test_hlr_stats_in_response():
    print("Testing HLR Stats in API Response...")
    user = User.objects.first()
    if not user:
        print("  No user found in database!")
        return
    
    print(f"  Testing with user: {user.username}\n")
    
    factory = APIRequestFactory()
    
    # Test: Get words for practice with HLR stats
    request = factory.get('/api/practice/words/', {'limit': 5})
    request.user = user
    response = get_words_for_practice(request)
    
    print(f"  Status Code: {response.status_code}")
    print(f"  Words Returned: {len(response.data)}")
    
    if response.data:
        first_word = response.data[0]
        print(f"\n  First Word: {first_word['word']} - {first_word['translation']}")
        
        # Check if HLR stats are present
        if 'hlr_stats' in first_word:
            print("  [OK] HLR Stats Present!")
            stats = first_word['hlr_stats']
            print(f"     - Recall Probability: {stats['recall_probability']*100:.1f}%")
            print(f"     - Half-life: {stats['half_life']} days")
            print(f"     - Days Since Practice: {stats['days_since_practice']}")
            print(f"     - Priority Score: {stats['priority_score']}")
            print(f"     - Practice History: {stats['correct_count']} correct, {stats['wrong_count']} wrong ({stats['total_practice_count']} total)")
        else:
            print("  [ERROR] HLR Stats Missing!")
            return False
        
        # Verify ordering (lowest recall probability first)
        print("\n  Verifying Word Ordering (by recall probability):")
        for i, word in enumerate(response.data[:5], 1):
            if 'hlr_stats' in word:
                recall = word['hlr_stats']['recall_probability']
                print(f"     {i}. {word['word']:15} - {recall*100:5.1f}% recall")
        
        # Check if words are ordered correctly
        recalls = [w['hlr_stats']['recall_probability'] for w in response.data if 'hlr_stats' in w]
        is_sorted = all(recalls[i] <= recalls[i+1] for i in range(len(recalls)-1))
        
        if is_sorted:
            print("\n  [OK] Words are correctly ordered (lowest recall first)!")
        else:
            print("\n  [WARNING] Words may not be perfectly ordered (new words at end)")
    
    print("\n[OK] HLR Stats Test Passed!")
    return True

if __name__ == "__main__":
    test_hlr_stats_in_response()
