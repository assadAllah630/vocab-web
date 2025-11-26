import os
import sys
import django

# Add the server directory to the python path
sys.path.append(r'e:\vocab_web\server')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Exam

try:
    # Try to find the user, default to the first user if 'assad' doesn't exist
    try:
        user = User.objects.get(username='assad')
    except User.DoesNotExist:
        user = User.objects.first()
        if not user:
            print("No users found in database.")
            sys.exit(1)
            
    print(f"Creating exam for user: {user.username} (ID: {user.id})")
    
    # Get target language
    target_lang = 'de'
    if hasattr(user, 'profile'):
        target_lang = user.profile.target_language
        print(f"User target language: {target_lang}")
    else:
        print("User has no profile, using default 'de'")

    exam = Exam.objects.create(
        user=user,
        topic="Shell Created Exam 2",
        difficulty="B1",
        language=target_lang,
        questions=[
            {
                "id": "q1",
                "type": "multiple_choice",
                "question": "Was ist das?",
                "options": ["Ein Auto", "Ein Haus"],
                "correctAnswer": 0
            }
        ],
        is_public=False,
        attempt_count=0
    )
    print(f"Successfully created exam: {exam.id} - {exam.topic} ({exam.language})")

except Exception as e:
    print(f"Error: {e}")
