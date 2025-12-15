
import threading
import logging
from api.models import Exam, UserProfile
from api.unified_ai import generate_ai_content
from firebase_admin import messaging, credentials, initialize_app
import json
import time

logger = logging.getLogger(__name__)

# Initialize Firebase Admin if not already initialized
try:
    # Use default credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
    # or specific if needed. For now assume env setup or add later.
    # Actually, initializing without credential assumes ADC (Application Default Credentials)
    # or FIREBASE_CONFIG env var.
    # Since we are in dev, providing credentials might be tricky without a file.
    # But for a robust "senior dev" solution, we'll try-except the init.
    import os
    from firebase_admin import credentials

    # Fallback to hardcoded ID if env var fails
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT') or os.environ.get('FIREBASE_PROJECT_ID') or 'vocabmaster-6a729'
    
    # CRITICAL: Force set the environment variable for Google Auth library (ADC)
    os.environ['GOOGLE_CLOUD_PROJECT'] = project_id
    
    # Policy:
    # 1. Look for serviceAccountKey.json (Local Dev)
    # 2. Look for FIREBASE_CREDENTIALS_JSON env var (Production/Render) -> Parse as dict
    # 3. Fallback to ADC (Application Default Credentials)
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    key_path = os.path.join(base_dir, 'serviceAccountKey.json')
    
    cred = None
    if os.path.exists(key_path):
        logger.info(f"Loading Firebase credentials from file: {key_path}")
        cred = credentials.Certificate(key_path)
    elif os.environ.get('FIREBASE_CREDENTIALS_JSON'):
        logger.info("Loading Firebase credentials from FIREBASE_CREDENTIALS_JSON env var")
        import json
        cred_dict = json.loads(os.environ.get('FIREBASE_CREDENTIALS_JSON'))
        
        if cred_dict.get('type') == 'authorized_user':
            # Handle SDK/CLI generated credentials
            logger.info("Detected 'authorized_user' credentials (GCloud SDK)")
            cred = credentials.RefreshToken(
                refresh_token=cred_dict.get('refresh_token'),
                client_id=cred_dict.get('client_id'),
                client_secret=cred_dict.get('client_secret'),
                quota_project_id=cred_dict.get('quota_project_id')
            )
        else:
            # Handle standard Service Account Key
            logger.info("Detected Service Account credentials")
            cred = credentials.Certificate(cred_dict)

    options = {'projectId': project_id} if project_id else None
    
    if cred:
        initialize_app(cred, options)
    else:
        # ADC fallback
        initialize_app(options=options)
except ValueError:
    # Already initialized
    pass
except Exception as e:
    logger.warning(f"Firebase Admin init failed (Notifications won't work): {e}")

class ExamGenerator(threading.Thread):
    def __init__(self, exam_id, user_id, prompt_data):
        self.exam_id = exam_id
        self.user_id = user_id
        self.prompt_data = prompt_data
        threading.Thread.__init__(self)

    def run(self):
        try:
            logger.info(f"Starting background exam generation for Exam ID: {self.exam_id}")
            
            # 1. Fetch Exam (to verify it exists and is processing)
            # We use a fresh DB connection for the thread logic implicitly in Django
            # but wrapping in connection.close() logic or ensuring no reuse issues is good practice.
            # Django handles thread safety reasonably well for DB connections.
            
            # Simulate "work" for testing async flow (optional, remove in prod)
            # time.sleep(5) 

            # 2. Run AI Agent (LangGraph)
            from api.agent_exam import build_exam_graph
            
            # Reconstruct initial state from prompt_data
            initial_state = {
                "topic": self.prompt_data['topic'],
                "level": self.prompt_data['level'],
                "question_types": self.prompt_data['question_types'],
                "vocab_list": self.prompt_data.get('vocab_list'),
                "grammar_list": self.prompt_data.get('grammar_list'),
                "notes": self.prompt_data.get('notes'),
                "target_language": self.prompt_data['target_language'],
                "revision_count": 0,
                "logs": [],
                "topic_analysis": None,
                "exam_plan": None,
                "draft_questions": None,
                "critique": None,
                "critique_passed": False,
                "final_exam": None,
            }

            # Retrieve the user object (passed via start_exam_generation)
            user_obj = self.prompt_data.get('user_object')
            if not user_obj:
               # Fallback: try to fetch user if not passed (though it should be)
               from django.contrib.auth.models import User
               user_obj = User.objects.get(id=self.user_id)

            app = build_exam_graph()
            config = {"configurable": {"user": user_obj}}
            
            # Invoke the graph
            result = app.invoke(initial_state, config=config)
            
            final_exam_data = result.get('final_exam')
            
            if not final_exam_data:
                raise Exception("Agent failed to generate exam data")

            # 3. Save to Database
            exam = Exam.objects.get(id=self.exam_id)
            # FIX: The agent returns 'sections', not 'questions'
            exam.questions = final_exam_data.get('questions') or final_exam_data.get('sections', [])
            exam.status = 'completed'
            exam.save()
            
            logger.info(f"Exam {self.exam_id} completed successfully.")
            
            # 4. Notify User
            self.send_notification(exam)

        except Exception as e:
            logger.error(f"Background Exam Generation Failed: {e}")
            try:
                exam = Exam.objects.get(id=self.exam_id)
                exam.status = 'failed'
                exam.save()
                self.send_failure_notification(exam, str(e))
            except:
                pass

    def send_failure_notification(self, exam, error_msg):
        try:
            profile = UserProfile.objects.get(user_id=self.user_id)
            if not profile.fcm_token:
                return

            message = messaging.Message(
                notification=messaging.Notification(
                    title="Exam Generation Failed ❌",
                    body=f"We couldn't generate your exam. Please try again.",
                ),
                data={
                    'exam_id': str(exam.id),
                    'action': 'open_exam',
                    'url': '/m/exam', # Go to list
                    'error': error_msg
                },
                token=profile.fcm_token
            )
            messaging.send(message)
            
            # Log failure to DB
            from api.notification_models import NotificationLog
            NotificationLog.objects.create(
                user_id=self.user_id,
                notification_type='custom',
                title="Exam Generation Failed ❌",
                body=f"We couldn't generate your exam. Please try again.",
                delivered=False,
                error=error_msg
            )
        except Exception as e:
            logger.error(f"Failed to send failure notification: {e}")

    def send_notification(self, exam):
        try:
            profile = UserProfile.objects.get(user_id=self.user_id)
            if not profile.fcm_token:
                logger.info(f"No FCM token for user {self.user_id}, skipping notification.")
                return

            # WebPush requires HTTPS. Use a placeholder logic or env var if needed.
            # ideally, use FRONTEND_URL from settings.
            # For now, we use a generic valid https link if localhost, or the relative link if standard
            # Actually, FCM Python SDK *requires* https:// absolute link.
            base_url = "https://vocabmaster.app" # Placeholder for valid scheme
            
            # Construct message
            message = messaging.Message(
                notification=messaging.Notification(
                    title="Exam Ready! 🎓",
                    body=f"Your {exam.get_language_display()} {exam.topic} exam is ready.",
                ),
                data={
                    'exam_id': str(exam.id),
                    'action': 'open_exam',
                    'url': f'/m/ai/exams/{exam.id}' 
                },
                token=profile.fcm_token,
                webpush=messaging.WebpushConfig(
                    fcm_options=messaging.WebpushFCMOptions(
                        link=f'{base_url}/m/ai/exams/{exam.id}'
                    )
                )
            )

            response = messaging.send(message)
            logger.info(f"Successfully sent notification: {response}")
            
            # Log to DB for in-app history
            from api.notification_models import NotificationLog
            NotificationLog.objects.create(
                user_id=self.user_id,
                notification_type='custom',
                title="Exam Ready! 🎓",
                body=f"Your {exam.get_language_display()} {exam.topic} exam is ready.",
                delivered=True
            )

        except Exception as e:
            logger.error(f"Failed to send notification: {e}")

def start_exam_generation(exam_id, user, prompt_data):
    """
    Helper to start the thread.
    Pass user object inside prompt_data for unified_ai access.
    """
    prompt_data['user_object'] = user 
    task = ExamGenerator(exam_id, user.id, prompt_data)
    task.start()
