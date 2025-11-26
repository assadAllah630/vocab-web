import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.models import Vocabulary
from api.serializers import VocabularySerializer

try:
    vocabs = Vocabulary.objects.all()
    print(f"Found {vocabs.count()} vocab items.")
    
    for v in vocabs:
        print(f"Checking vocab: {v.id} - {v.word}")
        try:
            serializer = VocabularySerializer(v)
            data = serializer.data
            print("  Serialization successful")
        except Exception as e:
            print(f"  Serialization FAILED: {e}")
            import traceback
            traceback.print_exc()

except Exception as e:
    print(f"Script failed: {e}")
    import traceback
    traceback.print_exc()
