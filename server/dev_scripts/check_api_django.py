import os
import sys
import django
import json

# Add the server directory to the python path
sys.path.append(r'e:\vocab_web\server')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client

try:
    user = User.objects.get(username='assad')
except User.DoesNotExist:
    user = User.objects.first()

if not user:
    print("No user found")
    sys.exit(1)

client = Client()
client.force_login(user)

response = client.get('/api/grammar/', HTTP_HOST='localhost')

with open('api_check_result.txt', 'w') as f:
    f.write(f"Status Code: {response.status_code}\n")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            f.write("Response is a LIST\n")
            f.write(f"Length: {len(data)}\n")
        elif isinstance(data, dict) and 'results' in data:
            f.write("Response is PAGINATED (dict with 'results')\n")
            f.write(f"Count: {data.get('count')}\n")
        else:
            f.write("Response is UNKNOWN structure\n")
            f.write(str(type(data)) + "\n")
    else:
        f.write(f"Failed: {response.content}\n")
