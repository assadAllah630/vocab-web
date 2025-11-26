import os
import django
import sys

# Setup Django environment
sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from api.views import VocabularyViewSet
from api.models import Vocabulary
from django.contrib.auth.models import User

def test_delete_vocab():
    print("Testing Vocabulary Deletion...")
    
    # Create user
    try:
        user = User.objects.get(username='test_user')
    except User.DoesNotExist:
        user = User.objects.create_user(username='test_user', password='password')
        
    # Create word
    vocab = Vocabulary.objects.create(
        word='DeleteMe',
        translation='LöschMich',
        type='noun',
        created_by=user
    )
    vocab_id = vocab.id
    print(f"Created word '{vocab.word}' with ID: {vocab_id}")
    
    # Test Delete
    factory = APIRequestFactory()
    view = VocabularyViewSet.as_view({'delete': 'destroy'})
    
    request = factory.delete(f'/api/vocab/{vocab_id}/')
    force_authenticate(request, user=user)
    
    response = view(request, pk=vocab_id)
    print(f"Delete Response Code: {response.status_code}")
    
    # Verify deletion
    if Vocabulary.objects.filter(id=vocab_id).exists():
        print("  [FAIL] Word still exists in DB")
    else:
        print("  [PASS] Word deleted from DB")

if __name__ == "__main__":
    test_delete_vocab()
