import logging
import traceback
from django.utils import timezone
from api.models import Podcast, PodcastCategory, UserProfile
from api.notification_models import NotificationLog
from .podcast.showrunner_agent import ShowrunnerAgent
from .podcast.journalist_agent import JournalistAgent
from .podcast.writer_agent import WriterAgent
from .podcast.producer_agent import ProducerAgent
from firebase_admin import messaging

logger = logging.getLogger(__name__)

def generate_podcast_job(podcast_id: int, custom_topic: str = None, target_level: str = 'B1', audio_speed: float = 1.0):
    """
    Background task to generate a podcast episode.
    """
    logger.info(f"Starting podcast generation for ID: {podcast_id} with topic: {custom_topic}")
    try:
        podcast = Podcast.objects.get(id=podcast_id)
        user = podcast.user
        category = podcast.category
        
        # 0. Initialize Producer (for final audio generation step after graph)
        producer = ProducerAgent(user)
        
        # 1. Build Graph
        from api.agent_podcast import build_podcast_graph
        app = build_podcast_graph()
        
        # 2. Initial State
        initial_state = {
            "podcast_id": podcast_id,
            "category_id": category.id,
            "user_id": user.id,
            "category_name": category.name, 
            "style": category.style,
            "tone": category.tone,
            "history_summary": "",
            "target_language": getattr(user.profile, 'target_language', 'en'),
            "target_level": target_level,
            "audio_speed": audio_speed,
            "custom_topic": custom_topic,
            "logs": [],
            "concept": None,
            "research_dossier": None,
            "draft_script": None,
            "final_script": None,
            "critique": None,
            "critique_passed": False,
            "revision_count": 0,
            "audio_files": []
        }
        
        # 3. Invoke Graph
        logger.info("Initializing Podcast Agent Graph...")
        result = app.invoke(initial_state)
        
        import json
        import ast

        final_script = result.get('final_script')
        concept = result.get('concept')
        
        # Ensure final_script is a dict
        if isinstance(final_script, str):
            try:
                final_script = json.loads(final_script)
            except:
                try:
                    final_script = ast.literal_eval(final_script)
                except:
                    pass
        
        if not final_script or not isinstance(final_script, dict):
             raise Exception("Agent failed to generate a valid script structure.")
             
        # 4. Save Script Metadata
        # REFRESH first to avoid overwriting progress/status from agents
        podcast.refresh_from_db()
        podcast.title = final_script.get('title', podcast.title)
        # Use first 200 chars of summary or script as summary
        podcast.summary = final_script.get('summary', str(final_script)[:200])
        podcast.text_content = json.dumps(final_script, default=str)
        podcast.save(update_fields=['title', 'summary', 'text_content'])
        
        # 5. Production Phase (Speechify)
        logger.info("Running Producer (Speechify)...")
        if not producer.api_key:
             raise Exception("Speechify API Key missing. Please update your profile settings.")
             
        success = producer.run(final_script, podcast, audio_speed=audio_speed)
        
        if not success:
            raise Exception("Audio generation failed. Check your Speechify API Key or credits.")

        # 6. Finalize Context
        # Manually update bible here or expose helper in agent_podcast
        # We can do it here for simplicity
        bible = category.series_bible or {}
        last_topics = bible.get('last_topics', [])
        if concept:
            last_topics.append(concept.get('topic'))
        bible['last_topics'] = last_topics
        category.series_bible = bible
        category.save()
        
        # 7. Notification
        _send_notification(user, podcast)

        # UPDATE STATUS: Completed
        # Refresh again just in case
        podcast.refresh_from_db()
        podcast.progress = 100
        podcast.processing_status = 'completed'
        podcast.current_message = "Podcast Ready!"
        podcast.estimated_remaining = 0
        podcast.save(update_fields=['progress', 'processing_status', 'current_message', 'estimated_remaining'])
        
        logger.info(f"Podcast {podcast_id} completed successfully.")

    except Exception as e:
        logger.error(f"Podcast generation failed: {str(e)}")
        traceback.print_exc()
        
        # Mark as failed in DB
        try:
            Podcast.objects.filter(id=podcast_id).update(
                processing_status='failed',
                current_message=f"Error: {str(e)[:50]}"
            )
        except:
            pass

def _send_notification(user, podcast):
    """
    Sends FCM notification.
    """
    try:
        profile = UserProfile.objects.get(user=user)
        if not profile.fcm_token:
            return

        message = messaging.Message(
            notification=messaging.Notification(
                title="Podcast Ready! 🎧",
                body=f"'{podcast.title}' is now available for listening.",
            ),
            data={
                "type": "podcast_ready",
                "podcast_id": str(podcast.id),
                "url": f"/m/podcasts/{podcast.id}" # Deep link
            },
            token=profile.fcm_token,
            webpush=messaging.WebpushConfig(
                fcm_options=messaging.WebpushFCMOptions(
                    link=f"https://vocabmaster.app/m/podcasts/{podcast.id}"
                )
            )
        )
        response = messaging.send(message)
        
        # Log it
        NotificationLog.objects.create(
            user=user,
            title="Podcast Ready! 🎧",
            body=f"'{podcast.title}' is now available.",
            notification_type="new_content",
            delivered=True
        )
        
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
        # Log failure
        NotificationLog.objects.create(
            user=user,
            title="Podcast Generation Error",
            body=f"Failed to generate podcast: {str(e)[:50]}...",
            notification_type="custom",
            delivered=False,
            error=str(e)
        )
