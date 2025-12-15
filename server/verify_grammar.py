import os
import django
import sys
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vocab_server.settings")
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from api.feature_views import GrammarTopicViewSet

# Get user 'assad.allah630'
try:
    user = User.objects.get(username='assad.allah630')
    print(f"Found user: {user.username}")
except User.DoesNotExist:
    print("User assad.allah630 not found")
    sys.exit(1)

# Mock Request
factory = APIRequestFactory()
data = {
    'title': 'Test Grammar Topic',
    'language': 'de',
    'level': 'A1',
    'context_note': 'Testing AI gateway integration'
}
request = factory.post('/api/grammar/generate/', data, format='json')
request.user = user

# Call ViewSet Action
try:
    print("Calling GrammarTopicViewSet.generate...")
    view = GrammarTopicViewSet.as_view({'post': 'generate'})
    response = view(request)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        print(f"Generated Topic: {response.data.get('title')}")
    else:
        print("Failed!")
        print(f"Error: {response.data}")
except Exception as e:
    print(f"CRASHED: {e}")
    import traceback
    traceback.print_exc()
