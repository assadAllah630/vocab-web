from django.db import models
from django.contrib.auth.models import User

class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    native_language = models.CharField(max_length=2, choices=LANGUAGES, default='en')
    target_language = models.CharField(max_length=2, choices=LANGUAGES, default='de')
    # Deepgram TTS settings
    deepgram_api_key = models.CharField(max_length=500, blank=True, default='', help_text='Deepgram API Key for Text-to-Speech')
    speechify_api_key = models.CharField(max_length=500, blank=True, default='', help_text='Speechify API Key for Text-to-Speech')
    speechify_api_key_2 = models.CharField(max_length=500, blank=True, default='', help_text='Secondary Speechify API Key')
    speechify_api_key_3 = models.CharField(max_length=500, blank=True, default='', help_text='Tertiary Speechify API Key')
    speechify_api_key_4 = models.CharField(max_length=500, blank=True, default='', help_text='Quaternary Speechify API Key')
    
    # AI Provider Keys
    ocrspace_api_key = models.CharField(max_length=500, blank=True, default='', help_text='OCR.space API Key for image text extraction')
    stable_horde_api_key = models.CharField(max_length=500, blank=True, default='', help_text='Stable Horde API Key')


    # OTP & Verification
    is_email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    # Social Profile Fields
    bio = models.TextField(blank=True, max_length=500)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    
    # Notification Settings
    fcm_token = models.CharField(max_length=500, blank=True, null=True, help_text='Firebase Cloud Messaging Token')
    allow_notifications = models.BooleanField(default=True)
    
    # Firebase Auth
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True, help_text='Firebase User ID')
    avatar_url = models.URLField(max_length=500, blank=True, null=True, help_text='Profile picture URL from social providers')

    def __str__(self):
        return f"{self.user.username}'s Profile"

class UserRelationship(models.Model):
    follower = models.ForeignKey(User, related_name='following', on_delete=models.CASCADE)
    following = models.ForeignKey(User, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


class Vocabulary(models.Model):
    WORD_TYPES = [
        ('noun', 'Nomen (or Substantiv / Hauptwort)'),
        ('verb', 'Verb (or Zeitwort / Tätigkeitswort)'),
        ('adjective', 'Adjective (or Eigenschaftswort)'),
        ('article', 'Artikel (or Begleiter / Geschlechtswort)'),
        ('pronoun', 'Pronomen (or Fürwort)'),
        ('numeral', 'Numerale (or Zahlwort)'),
        ('adverb', 'Adverb (or Umstandswort)'),
        ('preposition', 'Präposition (or Verhältniswort)'),
        ('conjunction', 'Konjunktion (or Bindewort)'),
        ('interjection', 'Interjektion (or Ausrufewort)'),
        ('phrase', 'Phrase'),
        ('other', 'Other'),
    ]

    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]

    word = models.CharField(max_length=100, db_index=True)
    translation = models.CharField(max_length=100)
    example = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=20, choices=WORD_TYPES)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    tags = models.ManyToManyField(Tag, blank=True)
    synonyms = models.JSONField(default=list, blank=True)
    antonyms = models.JSONField(default=list, blank=True)
    related_words = models.ManyToManyField('self', blank=True, symmetrical=True)
    related_concepts = models.JSONField(default=list, blank=True)  # New field for abstract concepts
    is_public = models.BooleanField(default=False)
    language = models.CharField(max_length=2, choices=LANGUAGES, default='de', db_index=True)
    native_language = models.CharField(max_length=2, choices=LANGUAGES, default='en', db_index=True, help_text='User native language for translation context')
    
    # HLR Spaced Repetition Fields
    correct_count = models.IntegerField(default=0)
    wrong_count = models.IntegerField(default=0)
    total_practice_count = models.IntegerField(default=0)
    last_practiced_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "Vocabulary"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', 'language']),
            models.Index(fields=['created_by', 'language', 'native_language']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['created_by', 'type']),
            models.Index(fields=['created_by', 'last_practiced_at']),
        ]
    
    def __str__(self):
        return f"{self.word} ({self.language})"

class SavedText(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_texts')
    title = models.CharField(max_length=200)
    content = models.TextField()  # Markdown content
    language = models.CharField(max_length=2, choices=Vocabulary.LANGUAGES, default='de')
    native_language = models.CharField(max_length=2, choices=Vocabulary.LANGUAGES, default='en', help_text='User native language context')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Semantic Search - Vector Embedding
    # Using JSONField as a temporary solution until pgvector is properly installed
    # This will store the embedding as a list of floats
    embedding = models.JSONField(null=True, blank=True, default=None)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vocab = models.ForeignKey(Vocabulary, on_delete=models.CASCADE)
    repetition_stage = models.IntegerField(default=0)
    mistakes = models.IntegerField(default=0)
    easiness_factor = models.FloatField(default=2.5)
    interval = models.IntegerField(default=0)
    next_review_date = models.DateTimeField(auto_now_add=True, db_index=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'vocab')
        indexes = [
            models.Index(fields=['user', 'next_review_date']),
            models.Index(fields=['user', '-last_seen']),
        ]

class Quiz(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vocab = models.ForeignKey(Vocabulary, on_delete=models.CASCADE)
    score = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

class Exam(models.Model):
    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exams')
    language = models.CharField(max_length=2, choices=LANGUAGES, default='de')
    native_language = models.CharField(max_length=2, choices=LANGUAGES, default='en', help_text='Translation language for exam questions')
    topic = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=50)
    questions = models.JSONField(default=list)  # Stores the generated questions
    is_public = models.BooleanField(default=False) # Allow sharing
    
    # Background Job Status
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    # Denormalized fields for quick access
    best_score = models.IntegerField(default=0)
    attempt_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Exam: {self.topic} ({self.language}) - Best: {self.best_score}%"

class ExamAttempt(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    user_answers = models.JSONField(default=dict)  # Stores user's submitted answers
    feedback = models.JSONField(default=dict)  # Stores AI evaluation/feedback
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Attempt for {self.exam.topic} - {self.score}%"


class GrammarTopic(models.Model):
    LEVEL_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
    ]
    
    CATEGORY_CHOICES = [
        ('articles', 'Articles'),
        ('plurals', 'Plurals'),
        ('verbs', 'Verb Conjugation'),
        ('separable_verbs', 'Separable Verbs'),
        ('modal_verbs', 'Modal Verbs'),
        ('cases', 'Cases (Nominativ, Akkusativ, Dativ)'),
        ('prepositions', 'Prepositions'),
        ('sentence_structure', 'Sentence Structure'),
        ('word_order', 'Word Order'),
        ('time_expressions', 'Time Expressions'),
        ('adjective_endings', 'Adjective Endings'),
        ('comparatives', 'Comparatives & Superlatives'),
    ]

    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]
    
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField()  # Markdown content
    examples = models.JSONField(default=list, blank=True)
    order = models.IntegerField(default=0)
    language = models.CharField(max_length=2, choices=LANGUAGES, default='de')
    native_language = models.CharField(max_length=2, choices=LANGUAGES, default='en', help_text='Translation language for examples')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['level', 'order', 'category']
        unique_together = ('level', 'category', 'title', 'created_by')
    
    def __str__(self):
        return f"{self.level} - {self.get_category_display()}: {self.title}"

    # New fields for Grammar Agent
    word_count = models.IntegerField(default=0)
    mermaid_diagrams_count = models.IntegerField(default=0)
    estimated_read_time = models.CharField(max_length=20, blank=True, default="")
    sources = models.JSONField(default=list, blank=True)  # List of source dicts
    related_topics = models.ManyToManyField('self', blank=True, symmetrical=False)
    tags = models.JSONField(default=list, blank=True)
    generated_by_ai = models.BooleanField(default=False)
    generation_metadata = models.JSONField(default=dict, blank=True)

class PodcastCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    style = models.CharField(max_length=100, default='Conversational') # e.g. "Conversational", "News", "Storytelling"
    tone = models.CharField(max_length=100, default='Casual') # e.g. "Humorous", "Serious", "Excited"
    target_audience = models.CharField(max_length=100, default="Beginner")
    series_bible = models.JSONField(default=dict, blank=True, help_text="Stores series history and context")
    audio_settings = models.JSONField(default=dict, blank=True, help_text="Voice and SFX preferences")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Podcast(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(PodcastCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='episodes')
    title = models.CharField(max_length=200)
    text_content = models.TextField()
    audio_file = models.FileField(upload_to='podcasts/', blank=True, null=True)
    voice_id = models.CharField(max_length=100, default='default')
    duration = models.IntegerField(null=True, blank=True)  # seconds
    speech_marks = models.JSONField(default=list, blank=True, help_text="Timestamped lyrics/transcript")
    
    # Status Tracking
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]
    processing_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)
    current_message = models.CharField(max_length=200, default="Initializing...")
    estimated_remaining = models.IntegerField(default=120)  # seconds
    
    # Context Awareness
    episode_number = models.IntegerField(default=1)
    summary = models.TextField(blank=True, help_text="Summary for AI context of next episode")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

# Signal to auto-create UserProfile for new users
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


# Import GeneratedContent model for advanced text generator
from .advanced_text_models import GeneratedContent

# Import admin models to ensure they are registered
from .admin_models import AdminRole, AdminAuditLog, SystemMetrics, APIUsageLog, UserActivityLog
