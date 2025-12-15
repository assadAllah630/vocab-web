
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from api.models import Podcast

def check_latest_marks():
    try:
        # Get latest podcast by ID (which is sequential)
        podcast = Podcast.objects.order_by('-id').first()
        if not podcast:
            print("No podcasts found.")
            return
            
        print(f"Podcast ID: {podcast.id}")
        print(f"Title: {podcast.title}")
        
        marks = podcast.speech_marks
        print(f"Marks Type: {type(marks)}")
        print(f"Marks Count: {len(marks)}")
        
        if len(marks) > 0:
            print("First 5 marks:")
            print(json.dumps(marks[:5], indent=2))
        else:
            print("Marks are empty!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_latest_marks()
