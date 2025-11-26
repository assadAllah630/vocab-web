import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Vocabulary

def check_users():
    print("="*60)
    print("USER ACCOUNT CHECK")
    print("="*60)
    
    users = User.objects.all()
    for u in users:
        vocab_count = Vocabulary.objects.filter(created_by=u).count()
        print(f"User: {u.username} (ID: {u.id}) | Email: {u.email} | Vocab Count: {vocab_count}")

if __name__ == "__main__":
    check_users()
