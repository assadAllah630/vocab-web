import os
import sys
import django
import traceback

sys.path.append('e:\\vocab_web\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.unified_ai import generate_ai_content
from django.contrib.auth.models import User

try:
    u = User.objects.first()
    print(f"Testing with user: {u.username}")
    print(generate_ai_content(u, 'test'))
except Exception:
    print("Top level exception caught:")
    traceback.print_exc()
