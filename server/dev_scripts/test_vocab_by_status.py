import os
import django
import sys

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from api.views import get_vocab_by_status, get_review_stats

def test_endpoints():
    user = User.objects.first()
    if not user:
        print("No user found in database!")
        return
    
    print(f"Testing with user: {user.username}\n")
    
    factory = APIRequestFactory()
    
    # Test 1: Get review stats
    print("1. Testing GET /api/practice/stats/")
    request = factory.get('/api/practice/stats/')
    request.user = user
    response = get_review_stats(request)
    print(f"   Status: {response.status_code}")
    print(f"   Data: {response.data}\n")
    
    # Test 2: Get vocab by status - new
    print("2. Testing GET /api/vocab/by-status/?status=new")
    request = factory.get('/api/vocab/by-status/', {'status': 'new'})
    request.user = user
    response = get_vocab_by_status(request)
    print(f"   Status: {response.status_code}")
    print(f"   Count: {len(response.data)} words")
    if response.data:
        print(f"   Sample: {response.data[0]['word']} - {response.data[0]['translation']}")
    print()
    
    # Test 3: Get vocab by status - learning
    print("3. Testing GET /api/vocab/by-status/?status=learning")
    request = factory.get('/api/vocab/by-status/', {'status': 'learning'})
    request.user = user
    response = get_vocab_by_status(request)
    print(f"   Status: {response.status_code}")
    print(f"   Count: {len(response.data)} words\n")
    
    # Test 4: Get vocab by status - mastered
    print("4. Testing GET /api/vocab/by-status/?status=mastered")
    request = factory.get('/api/vocab/by-status/', {'status': 'mastered'})
    request.user = user
    response = get_vocab_by_status(request)
    print(f"   Status: {response.status_code}")
    print(f"   Count: {len(response.data)} words\n")

if __name__ == "__main__":
    test_endpoints()
