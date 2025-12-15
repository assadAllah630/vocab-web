
import os
import django
import sys
import logging
import uuid
from django.core.files.base import ContentFile

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

from api.models import Podcast, PodcastCategory, User
from api.services.podcast.showrunner_agent import ShowrunnerAgent
from api.services.podcast.journalist_agent import JournalistAgent
from api.services.podcast.writer_agent import WriterAgent
from api.services.podcast.producer_agent import ProducerAgent

def get_debug_user_and_category():
    user = User.objects.first()
    if not user:
        print("ERROR: No users found.")
        return None, None

    category = PodcastCategory.objects.filter(user=user).first()
    if not category:
        category = PodcastCategory.objects.create(
            user=user,
            name="Debug Show",
            style="Conversational",
            tone="Casual"
        )
    return user, category

def test_search():
    print("\n--- Testing SEARCH (JournalistAgent) ---")
    user, category = get_debug_user_and_category()
    if not user: return

    concept = {'topic': 'The History of Coffee', 'angle': 'How coffee changed the world'}
    print(f"Concept: {concept}")
    
    agent = JournalistAgent(user)
    try:
        dossier = agent.run(concept)
        print("Search Result (Dossier Keys):", dossier.keys() if dossier else "None")
        print("Summary:", str(dossier)[:500])
        return dossier
    except Exception as e:
        print(f"SEARCH FAILED: {e}")
        return None

def test_write():
    print("\n--- Testing WRITE (WriterAgent) ---")
    user, category = get_debug_user_and_category()
    if not user: return
    
    # Mock Input
    concept = {'topic': 'The History of Coffee'}
    research = {
        'summary': 'Coffee originated in Ethiopia. It spread to the Middle East and then Europe.',
        'key_points': ['Ethiopian origin', 'Coffee houses in London', 'Global trade']
    }
    
    agent = WriterAgent(user)
    try:
        script = agent.run(concept, research, category_style="Conversational")
        print("Script Result:", script.keys() if script else "None")
        print("Script Sample:", str(script)[:500])
        return script
    except Exception as e:
        print(f"WRITE FAILED: {e}")
        # Print actual failure log details
        from api.ai_gateway.models import FailureLog
        logs = FailureLog.objects.order_by('-timestamp')[:3]
        for l in logs:
            print(f"LOG: {l.error_type} - {l.error_message}")
        return None

def test_producer():
    print("\n--- Testing PRODUCER (ProducerAgent - Deepgram) ---")
    user, category = get_debug_user_and_category()
    if not user: return
    
    # Mock Script
    script = {
        'title': 'Debug Coffee Chat',
        'script': [
            {'speaker': 'Host A', 'text': 'Welcome to the show! Today we talk about coffee.'},
            {'speaker': 'Host B', 'text': 'I love coffee! It keeps me awake.'}
        ]
    }
    
    # Temp Podcast for file saving
    podcast = Podcast.objects.create(
        user=user,
        category=category,
        title="Debug Audio Test",
        text_content="Audio Test",
        episode_number=999
    )
    
    agent = ProducerAgent(user)
    try:
        success = agent.run(script, podcast)
        print(f"Producer Success: {success}")
        podcast.refresh_from_db()
        if podcast.audio_file:
            print(f"Audio File Saved: {podcast.audio_file.url}")
            print(f"Duration: {podcast.duration}s")
        else:
            print("No audio file found on instance.")
            
    except Exception as e:
        print(f"PRODUCER FAILED: {e}")

def test_full_job():
    print("\n--- Testing FULL JOB (Job + Custom Args) ---")
    user, category = get_debug_user_and_category()
    if not user: return
    
    # Mock Profile
    user.profile.target_language = 'de'
    # Ensure Speechify key is present (simulated check)
    if not user.profile.speechify_api_key:
        print("WARNING: No Speechify Key on profile. Test might fail.")
    user.profile.save()
    
    podcast = Podcast.objects.create(
        user=user,
        category=category,
        title="Debug Job: Speechify (DE)",
        text_content="Init...",
        episode_number=999
    )
    
    from api.services.background_podcast import generate_podcast_job
    try:
        generate_podcast_job(
            podcast.id,
            custom_topic="History of Berlin",
            target_level="A2",
            audio_speed=1.0 
        )
        podcast.refresh_from_db()
        print(f"Job Done. Title: {podcast.title}")
        print(f"Status: {podcast.processing_status}")
    except Exception as e:
        print(f"Job Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # If run directly allow choosing mode
    import sys
    args = sys.argv
    if len(args) > 1:
        mode = args[1]
        if mode == 'search': test_search()
        elif mode == 'write': test_write()
        elif mode == 'audio': test_producer()
        elif mode == 'job': test_full_job()
        elif mode == 'update_key': update_key()
        else: print("Usage: python debug_podcast.py [search|write|audio|job|update_key]")
    else:
        print("Running FULL JOB test...")
        test_full_job()

def update_key(provider='gemini', new_key=None):
    if not new_key:
        if provider == 'gemini':
            new_key = "AIzaSyD5LbjG_KF0uwFtocCZz0wZp4PX_EmxDVU"
        else:
            print(f"Error: Must provide key for {provider}")
            return

    print(f"\n--- Updating {provider.upper()} API Key ---")
    from api.ai_gateway.models import UserAPIKey, ModelInstance
    from api.ai_gateway.utils.encryption import encrypt_api_key
    
    user, _ = get_debug_user_and_category()
    if not user: return
    
    encrypted_key = encrypt_api_key(new_key)
    
    # 1. Update ALL UserAPIKey for Provider
    keys = UserAPIKey.objects.filter(user=user, provider=provider)
    
    if keys.exists():
        print(f"Found {keys.count()} existing keys. Updating them all...")
        keys.update(
            api_key_encrypted=encrypted_key,
            is_active=True,
            is_blocked=False,
            health_score=100
        )
    else:
        print("Creating new key...")
        UserAPIKey.objects.create(
            user=user,
            provider=provider,
            api_key_encrypted=encrypted_key,
            key_nickname=f'Debug {provider} Key',
            daily_quota=10000, # Groq has high limits
            is_active=True
        )
        
    # 2. Reset Model Instances
    provider_keys = UserAPIKey.objects.filter(user=user, provider=provider)
    instances = ModelInstance.objects.filter(api_key__in=provider_keys)
    count = instances.update(
        is_blocked=False, 
        block_reason='', 
        consecutive_failures=0, 
        remaining_daily=10000,
        health_score=100,
        confidence_score=1.0
    )
    print(f"Reset {count} model instances.")
    print("DONE. Please re-run test_write().")
