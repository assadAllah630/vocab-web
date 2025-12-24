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
    
    @property
    def is_teacher(self):
        """Check if user has a teacher profile."""
        return hasattr(self.user, 'teacher_profile')
    
    @property
    def teacher(self):
        """Get teacher profile if exists."""
        return getattr(self.user, 'teacher_profile', None)

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
    

class TeacherApplication(models.Model):
    """
    Application to become a teacher.
    Requires admin approval.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Application Details
    resume_link = models.URLField(max_length=500, help_text="Link to CV/Resume (Google Drive, LinkedIn, etc.)")
    intro_video_link = models.URLField(max_length=500, help_text="Link to introduction video")
    experience_years = models.IntegerField(default=0)
    teaching_languages = models.JSONField(default=list, help_text="List of languages you can teach")
    bio = models.TextField(help_text="Why do you want to teach here?")
    
    # Admin Feedback
    admin_feedback = models.TextField(blank=True, help_text="Reason for rejection or internal notes")
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Application from {self.user.username} ({self.status})"

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
    
    # Template System (New)
    is_template = models.BooleanField(default=False, help_text="Is this a master exam template?")
    cloned_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='clones')
    
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


# =============================================================================
# External Podcast Integration - RSS Feed Podcasts (not AI-generated)
# =============================================================================

class ExternalPodcast(models.Model):
    """
    External podcast from RSS feed.
    Stores metadata and points to episodes for streaming.
    Audio is NOT stored locally - streamed directly from source.
    """
    
    LEVEL_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Mastery'),
    ]
    
    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
        ('fr', 'French'),
        ('es', 'Spanish'),
    ]
    
    # Identity
    name = models.CharField(max_length=255, db_index=True)
    feed_url = models.URLField(max_length=500, unique=True)
    artwork_url = models.URLField(max_length=500, blank=True)
    author = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    website_url = models.URLField(max_length=500, blank=True)
    
    # Target audience
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default='B1', db_index=True)
    language = models.CharField(max_length=2, choices=LANGUAGES, default='de', db_index=True)
    
    # Metadata
    episode_count = models.PositiveIntegerField(default=0)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    
    # Source tracking  
    itunes_id = models.CharField(max_length=50, blank=True, db_index=True)
    podcastindex_id = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'External Podcast'
        verbose_name_plural = 'External Podcasts'
        indexes = [
            models.Index(fields=['language', 'level']),
            models.Index(fields=['is_active', 'is_featured']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.level})"


class ExternalEpisode(models.Model):
    """
    Episode from external podcast RSS feed.
    Contains direct audio_url for streaming - no local storage.
    """
    
    podcast = models.ForeignKey(
        ExternalPodcast, 
        on_delete=models.CASCADE, 
        related_name='episodes'
    )
    
    # RSS Data
    guid = models.CharField(max_length=500, unique=True, db_index=True)
    title = models.CharField(max_length=500)
    link = models.URLField(max_length=500, blank=True) # Link to episode webpage
    description = models.TextField(blank=True)
    audio_url = models.URLField(max_length=1000)  # Direct stream URL
    duration = models.PositiveIntegerField(default=0, help_text='Duration in seconds')
    published_at = models.DateTimeField(db_index=True)
    file_size = models.BigIntegerField(default=0, help_text='Size in bytes')
    
    # Optional enhancements
    transcript = models.TextField(blank=True)
    transcript_source = models.CharField(
        max_length=20, 
        blank=True,
        choices=[('rss', 'RSS'), ('whisper', 'Whisper AI'), ('manual', 'Manual')]
    )
    image_url = models.URLField(max_length=500, blank=True)
    
    # Engagement
    listen_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-published_at']
        verbose_name = 'External Episode'
        verbose_name_plural = 'External Episodes'
        indexes = [
            models.Index(fields=['podcast', '-published_at']),
        ]
    
    def __str__(self):
        return f"{self.title[:50]} - {self.podcast.name}"
    
    @property
    def duration_formatted(self):
        """Return duration as MM:SS or HH:MM:SS."""
        if not self.duration:
            return '0:00'
        mins, secs = divmod(self.duration, 60)
        hours, mins = divmod(mins, 60)
        if hours:
            return f'{hours}:{mins:02d}:{secs:02d}'
        return f'{mins}:{secs:02d}'


class ExternalPodcastSubscription(models.Model):
    """User subscription to an external podcast with progress tracking."""
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='external_podcast_subscriptions'
    )
    podcast = models.ForeignKey(
        ExternalPodcast, 
        on_delete=models.CASCADE, 
        related_name='subscriptions'
    )
    
    # Progress tracking
    last_played_episode = models.ForeignKey(
        ExternalEpisode, 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+'
    )
    last_position = models.PositiveIntegerField(default=0, help_text='Playback position in seconds')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'podcast']
        verbose_name = 'Podcast Subscription'
        verbose_name_plural = 'Podcast Subscriptions'
    
    def __str__(self):
        return f"{self.user.username} → {self.podcast.name}"


# =============================================================================
# Teacher & Classroom System
# =============================================================================

class Teacher(models.Model):
    """Teacher profile extending User for classroom management."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    organization_name = models.CharField(max_length=200, blank=True)  # School/company name
    subjects = models.JSONField(default=list)  # ["German", "English"]
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    max_classrooms = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teachers'
    
    def __str__(self):
        return f"Teacher: {self.user.username}"


class Classroom(models.Model):
    """Virtual classroom managed by a teacher."""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='classrooms')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Language settings (for automatic path linking)
    speaking_language = models.CharField(max_length=10, default='en', help_text="Students' native language")
    target_language = models.CharField(max_length=10, default='de', help_text="Language being taught")
    
    # Current position in the learning path (null = not following a path yet)
    current_sublevel = models.ForeignKey(
        'PathSubLevel', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='classrooms',
        help_text="Current sublevel (e.g., A1.1) - determines what content students see"
    )
    
    # Explicit path assignment (for class-level progress tracking)
    linked_path = models.ForeignKey(
        'LearningPath',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_classrooms',
        help_text="The learning path this classroom follows (all students share progress)"
    )
    
    # Settings
    LEVEL_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Mastery'),
        ('mixed', 'Mixed Levels'),
    ]
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='B1')
    max_students = models.IntegerField(default=30)
    
    # Access
    invite_code = models.CharField(max_length=8, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Classroom'
        verbose_name_plural = 'Classrooms'
        indexes = [
            models.Index(fields=['teacher', '-created_at']),
            models.Index(fields=['is_active', 'level']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.teacher.user.username})"
    
    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self._generate_invite_code()
        super().save(*args, **kwargs)
    
    def _generate_invite_code(self):
        import secrets
        import string
        chars = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(chars) for _ in range(8))
            if not Classroom.objects.filter(invite_code=code).exists():
                return code


class ClassMembership(models.Model):
    """Student enrollment in a classroom."""
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='memberships')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='class_memberships')
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('removed', 'Removed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['classroom', 'student']
        ordering = ['-joined_at']
        verbose_name = 'Class Membership'
        verbose_name_plural = 'Class Memberships'
        indexes = [
            models.Index(fields=['classroom', 'status']),
            models.Index(fields=['student', 'status']),
        ]
    
    def __str__(self):
        return f"{self.student.username} in {self.classroom.name}"


class ClassPathProgress(models.Model):
    """
    Tracks CLASS-LEVEL progress for each step in a learning path.
    All students in the classroom share this progress (not individual).
    Teacher updates this via session evaluations or manual input.
    """
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='path_progress')
    node = models.ForeignKey('PathNode', on_delete=models.CASCADE, related_name='class_progress')
    
    # Progress
    completion_percent = models.IntegerField(default=0, help_text="0-100, class-wide completion")
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # What activity contributed to this progress
    last_session = models.ForeignKey('LiveSession', on_delete=models.SET_NULL, null=True, blank=True)
    last_assignment = models.ForeignKey('Assignment', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Teacher notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['classroom', 'node']
        verbose_name = "Class Path Progress"
        verbose_name_plural = "Class Path Progress"
        ordering = ['node__sublevel', 'node__order']
    
    def __str__(self):
        return f"{self.classroom.name} - {self.node.title}: {self.completion_percent}%"


class StudentRemediation(models.Model):
    """
    Tracks students who need to catch up on a step.
    Created when student misses a live session or fails an assignment.
    """
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='remediations')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='remediations')
    node = models.ForeignKey('PathNode', on_delete=models.CASCADE, related_name='remediations')
    
    REASON_CHOICES = [
        ('missed_session', 'Missed Live Session'),
        ('failed_assignment', 'Failed Assignment'),
        ('absent', 'Absent/Inactive'),
    ]
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    
    REMEDIATION_TYPES = [
        ('watch_recording', 'Watch Session Recording'),
        ('take_test', 'Take Makeup Test'),
        ('extra_assignment', 'Complete Extra Assignment'),
    ]
    remediation_type = models.CharField(max_length=30, choices=REMEDIATION_TYPES, default='watch_recording')
    
    # Progress
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Reference to remediation content
    content_id = models.IntegerField(null=True, blank=True)  # Recording ID, exam ID, etc.
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'classroom', 'node']
        ordering = ['-created_at']
    
    def __str__(self):
        status = "✓" if self.completed else "⌛"
        return f"{status} {self.student.username} - {self.node.title} ({self.reason})"


class Assignment(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    CONTENT_TYPES = [('exam','Exam'),('story','Story'),('article','Article'),
                     ('grammar','Grammar'),('vocab_list','Vocab'),('podcast','Podcast'),
                     ('writing', 'Writing'), ('path', 'Learning Path')]
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    content_id = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    is_required = models.BooleanField(default=True)
    max_attempts = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    MAX_ATTEMPTS_DEFAULT = 1
    
    # Link to Curriculum
    linked_path_node = models.ForeignKey('PathNode', on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    
    # Advanced Config
    metadata = models.JSONField(default=dict, blank=True, help_text="Settings: timer, match_mode, pass_score, etc.")
    
    def __str__(self):
        return f"{self.title} ({self.classroom.name})"

class AssignmentProgress(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='progress')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    STATUS = [('not_started','Not Started'),('in_progress','In Progress'),
              ('submitted','Submitted'),('graded','Graded')]
    status = models.CharField(max_length=20, choices=STATUS, default='not_started')
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    # Specific Exam Instance Link
    linked_exam = models.ForeignKey('Exam', on_delete=models.SET_NULL, null=True, blank=True)
    # Specific Writing Submission Link
    linked_writing_submission = models.ForeignKey('WritingSubmission', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Detailed Tracking
    progress_data = models.JSONField(default=dict, blank=True, help_text="Type-specific progress")
    time_spent = models.IntegerField(default=0, help_text="Time spent in seconds")
    
    class Meta:
        unique_together = ['assignment', 'student']

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"


# Signal to auto-create UserProfile for new users
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

# --- Updated Models for Advanced Assignments ---

# Update Assignment to link to Learning Path
# (We add fields to existing models by replacing the class definition if possible, 
# or here we are modifying the existing class in place via multi_replace rules)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class ExternalEpisodeInteraction(models.Model):
    """
    Track user interactions with specific episodes.
    Like (Heart) and Save (Bookmark).
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='episode_interactions'
    )
    episode = models.ForeignKey(
        ExternalEpisode,
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    
    is_liked = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'episode']
        indexes = [
            models.Index(fields=['user', 'is_saved']), # For "Saved Episodes" list
            models.Index(fields=['user', 'is_liked']),
        ]
        
    def __str__(self):
        return f"{self.user.username} - {self.episode.title[:20]}"


class LearningEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    EVENT_TYPES = [
        ('practice_start', 'Practice Started'),
        ('practice_end', 'Practice Ended'),
        ('word_correct', 'Word Correct'),
        ('word_incorrect', 'Word Incorrect'),
        ('exam_answer', 'Exam Answer'),
        ('content_view', 'Content Viewed'),
        ('content_complete', 'Content Completed'),
        ('assignment_submit', 'Assignment Submitted'),  # Added this one
    ]
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    context = models.JSONField(default=dict)  # word_id, exam_id, etc.
    classroom = models.ForeignKey(Classroom, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [models.Index(fields=['user', 'event_type', 'created_at'])]

    def __str__(self):
        return f"{self.user.username} - {self.event_type} ({self.created_at})"


class Skill(models.Model):
    """
    Trackable skill category (e.g., 'vocab_b1', 'grammar_past_tense').
    """
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    CATEGORIES = [
        ('vocabulary', 'Vocabulary'),
        ('grammar', 'Grammar'),
        ('listening', 'Listening'),
        ('reading', 'Reading'),
        ('speaking', 'Speaking')
    ]
    category = models.CharField(max_length=20, choices=CATEGORIES)
    level = models.CharField(max_length=5, blank=True)  # CEFR level: A1, A2, etc.
    description = models.TextField(blank=True)
    
    # BKT Default Parameters (can be tuned per skill)
    default_p_slip = models.FloatField(default=0.1)
    default_p_guess = models.FloatField(default=0.2)
    default_p_transit = models.FloatField(default=0.1)

    def __str__(self):
        return f"{self.name} ({self.level})"


class SkillMastery(models.Model):
    """
    User's mastery level of a specific skill.
    Uses Bayesian Knowledge Tracing (BKT) or similar metric.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_masteries')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    # BKT State
    mastery_probability = models.FloatField(default=0.3)  # P(L) - probability of mastery
    
    # Simple Stats
    total_attempts = models.IntegerField(default=0)
    correct_attempts = models.IntegerField(default=0)
    last_practiced = models.DateTimeField(null=True)
    
    # History
    history = models.JSONField(default=list, blank=True) # Store recent p_mastery values for graphing
    
    class Meta:
        unique_together = ['user', 'skill']
        indexes = [
            models.Index(fields=['user', 'mastery_probability']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.skill.code}: {self.mastery_probability:.2f}"


class LearningPath(models.Model):
    """
    Structured learning curriculum for a language pair.
    Unique per speaking_language + target_language combination.
    """
    # Language pair (unique together)
    speaking_language = models.CharField(max_length=10, default='en', help_text="Student's native language (ISO code)")
    target_language = models.CharField(max_length=10, default='de', help_text="Language being learned (ISO code)")
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Structure
    estimated_hours = models.FloatField(default=100)  # Total for entire path
    is_published = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['speaking_language', 'target_language']
        unique_together = ['speaking_language', 'target_language']
    
    def __str__(self):
        return f"{self.speaking_language.upper()} → {self.target_language.upper()}: {self.title}"


class PathSubLevel(models.Model):
    """
    Sub-level within a learning path (e.g., A1.1, A1.2).
    Contains ordered path nodes.
    """
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='sublevels')
    
    # Level (A1, A2, B1, B2, C1, C2)
    LEVEL_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Mastery'),
    ]
    level_code = models.CharField(max_length=5, choices=LEVEL_CHOICES)
    
    # Sub-level code (A1.1, A1.2, etc.)
    sublevel_code = models.CharField(max_length=10)  # A1.1, A1.2, B1.1, etc.
    title = models.CharField(max_length=100)  # "First Steps", "Daily Life"
    description = models.TextField(blank=True)
    
    order = models.IntegerField(default=0)
    estimated_hours = models.FloatField(default=10)
    
    # AI-generated objectives for this sublevel
    objectives = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['path', 'order']
        unique_together = ['path', 'sublevel_code']
    
    def __str__(self):
        return f"{self.path}: {self.sublevel_code} - {self.title}"


class PathNode(models.Model):
    """Single item in a learning path sublevel."""
    sublevel = models.ForeignKey(PathSubLevel, on_delete=models.CASCADE, related_name='nodes')
    order = models.IntegerField(default=0)
    
    NODE_TYPES = [
        ('lesson', 'Lesson'),      # Text/video content
        ('exercise', 'Exercise'),  # Practice activity
        ('exam', 'Exam'),          # Assessment
        ('checkpoint', 'Checkpoint'),  # Progress marker
    ]
    node_type = models.CharField(max_length=20, choices=NODE_TYPES)
    
    # Content reference (polymorphic)
    content_type = models.CharField(max_length=30, blank=True)  # story, grammar, exam, etc.
    content_id = models.IntegerField(null=True, blank=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_minutes = models.IntegerField(default=15)
    
    # Requirements
    pass_threshold = models.IntegerField(default=70)  # For exams
    
    # Rich Content
    objectives = models.JSONField(default=list, blank=True, help_text="List of learning goals")
    teacher_guide = models.TextField(blank=True, help_text="Private instructions for the teacher")
    student_summary = models.TextField(blank=True, help_text="Mission Briefing for students")
    resources = models.JSONField(default=list, blank=True, help_text="[{title, url, type, is_teacher_only}]")
    skills = models.ManyToManyField(Skill, blank=True, related_name='path_nodes')
    
    class Meta:
        ordering = ['sublevel', 'order']
        unique_together = ['sublevel', 'order']


def path_material_upload_path(instance, filename):
    """Generate upload path for path node materials."""
    return f'path_materials/{instance.node.sublevel.path.id}/{instance.node.sublevel.id}/{instance.node.id}/{filename}'


class PathNodeMaterial(models.Model):
    """Uploaded file for a learning path node."""
    node = models.ForeignKey(PathNode, on_delete=models.CASCADE, related_name='materials')
    file = models.FileField(upload_to=path_material_upload_path)
    filename = models.CharField(max_length=255)  # Original filename
    file_type = models.CharField(max_length=100, blank=True)  # MIME type
    file_size = models.IntegerField(default=0)  # Size in bytes
    
    # Access control
    is_teacher_only = models.BooleanField(default=False)
    
    # Metadata
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.filename} ({self.node.title})"


class PathEnrollment(models.Model):
    """User enrollment in a learning path."""
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    classroom = models.ForeignKey(Classroom, null=True, on_delete=models.SET_NULL)
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True)
    
    class Meta:
        unique_together = ['path', 'student']


class NodeProgress(models.Model):
    """Progress on a single path node."""
    enrollment = models.ForeignKey(PathEnrollment, on_delete=models.CASCADE, related_name='progress')
    node = models.ForeignKey(PathNode, on_delete=models.CASCADE)
    
    STATUS = [('locked','Locked'),('available','Available'),
              ('in_progress','In Progress'),('completed','Completed')]
    status = models.CharField(max_length=20, default='locked')
    
    started_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)
    score = models.FloatField(null=True)
    attempts = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['enrollment', 'node']


class LiveSession(models.Model):
    """Scheduled live class or meeting."""
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='sessions')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Scheduling
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    timezone = models.CharField(max_length=50, default='UTC')
    
    SESSION_TYPES = [('video','Video Call'),('audio','Audio Only'),
                     ('in_person','In Person'),('hybrid','Hybrid')]
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='video')
    
    meeting_url = models.URLField(blank=True)
    meeting_id = models.CharField(max_length=100, blank=True)
    meeting_password = models.CharField(max_length=50, blank=True)
    
    STATUS = [('scheduled','Scheduled'),('live','Live'),
              ('completed','Completed'),('cancelled','Cancelled')]
    status = models.CharField(max_length=20, default='scheduled')
    
    materials = models.JSONField(default=list)
    recording_url = models.URLField(blank=True)
    
    # Curriculum integration
    linked_path_node = models.ForeignKey('PathNode', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['scheduled_at']


class SessionAttendance(models.Model):
    """Track who attended a session."""
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='attendance')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    
    STATUS = [('registered','Registered'),('attended','Attended'),
              ('absent','Absent'),('excused','Excused')]
    status = models.CharField(max_length=20, default='registered')
    
    joined_at = models.DateTimeField(null=True)
    left_at = models.DateTimeField(null=True)
    duration_minutes = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['session', 'student']


class SessionReminder(models.Model):
    """Scheduled reminders for sessions."""
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='reminders')
    remind_before_minutes = models.IntegerField(default=30)
    sent_at = models.DateTimeField(null=True)
    
    class Meta:
        unique_together = ['session', 'remind_before_minutes']


class Organization(models.Model):
    """Language school, company, or institution."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    
    logo_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    
    ORG_TYPES = [('school','Language School'),('corporate','Corporate'),
                 ('university','University'),('other','Other')]
    org_type = models.CharField(max_length=20, choices=ORG_TYPES, default='school')
    
    max_teachers = models.IntegerField(default=5)
    max_students = models.IntegerField(default=100)
    
    admin_email = models.EmailField()
    website = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    """User's role within an organization."""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='org_memberships')
    
    ROLES = [('admin','Admin'),('teacher','Teacher'),('student','Student')]
    role = models.CharField(max_length=20, choices=ROLES, default='student')
    
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='+')
    
    class Meta:
        unique_together = ['organization', 'user']


# Import GeneratedContent model for advanced text generator
from .advanced_text_models import GeneratedContent

# Import admin models to ensure they are registered
from .admin_models import AdminRole, AdminAuditLog, SystemMetrics, APIUsageLog, UserActivityLog

class WritingExercise(models.Model):
    """
    Defines a writing prompt and constraints.
    Linked to via Assignment(content_type='writing', content_id=id).
    """
    topic = models.CharField(max_length=255)
    prompt_text = models.TextField(help_text="The detailed question or prompt for the student.")
    min_words = models.IntegerField(default=100)
    time_limit = models.IntegerField(default=0, help_text="Time limit in seconds (0 = no limit)")
    rubric = models.JSONField(default=dict, blank=True, help_text="Grading criteria and scoring weights")
    
    # Advanced
    ai_grading_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.topic


class WritingSubmission(models.Model):
    """
    A student's response to a WritingExercise.
    Linked to via AssignmentProgress(linked_writing_submission=id).
    """
    exercise = models.ForeignKey(WritingExercise, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Content
    content = models.TextField(help_text="The student's written text.")
    word_count = models.IntegerField(default=0)
    
    # Grading
    teacher_grade = models.FloatField(null=True, blank=True)
    teacher_feedback = models.TextField(blank=True)
    
    # AI Analysis
    ai_score = models.FloatField(null=True, blank=True)
    ai_feedback = models.JSONField(default=dict, blank=True, help_text="Structured feedback from AI (grammar, coherence)")
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.exercise.topic} ({self.word_count} words)"


# =============================================================================
# CLASSROOM ARENA - Multiplayer Game System
# =============================================================================

class GameConfig(models.Model):
    """
    Reusable game configuration template.
    Teachers create these to define game rules and content.
    """
    MODE_CHOICES = [
        ('velocity', 'Velocity - Speed Matching'),
        ('streamline', 'Streamline - Sentence Order'),
        ('faceoff', 'Face-Off - 1v1 True/False'),
        ('synergy', 'Synergy - Team Quiz'),
        ('discovery', 'Discovery - Cloze/Decrypt'),
    ]
    
    CONTENT_SOURCE_CHOICES = [
        ('exam', 'From Exam Template'),
        ('vocab_list', 'From Vocabulary List'),
        ('custom', 'Custom Questions'),
    ]
    
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='game_configs')
    name = models.CharField(max_length=200)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='velocity')
    
    # Game content source
    content_source = models.CharField(max_length=50, choices=CONTENT_SOURCE_CHOICES, default='exam')
    content_id = models.IntegerField(null=True, blank=True, help_text="ID of exam/vocab list if using existing content")
    custom_questions = models.JSONField(default=list, blank=True, help_text="Custom questions if content_source='custom'")
    
    # Stage configuration for multi-stage games
    stages = models.JSONField(default=list, blank=True, help_text="[{mode, time_limit, question_count}]")
    
    # Game settings
    settings = models.JSONField(default=dict, blank=True, help_text="{shuffle, show_answers, power_ups, team_size}")
    
    # Curriculum integration (using string reference to avoid circular import)
    linked_path_node = models.ForeignKey('PathNode', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_mode_display()})"


class GameSession(models.Model):
    """
    A single multiplayer game session instance.
    Created when a teacher launches a game from a GameConfig.
    """
    STATUS_CHOICES = [
        ('waiting', 'Waiting for Players'),
        ('active', 'Game in Progress'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='game_sessions')
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_games')
    config = models.ForeignKey(GameConfig, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Session state
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    current_stage = models.IntegerField(default=0, help_text="Index into config.stages")
    
    # Real-time data (polled by clients)
    participants = models.JSONField(default=list, help_text="[{user_id, username, avatar, score, is_ready, last_seen}]")
    state = models.JSONField(default=dict, help_text="Current game state (questions, timer, answers, etc.)")
    
    # Join code for easy access
    join_code = models.CharField(max_length=6, unique=True, blank=True, null=True)
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.join_code:
            import random
            import string
            self.join_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Game {self.join_code} - {self.classroom.name} ({self.get_status_display()})"


class GameParticipant(models.Model):
    """
    Tracks individual participant progress in a game session.
    """
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='participant_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Score tracking
    score = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    wrong_answers = models.IntegerField(default=0)
    
    # Timing
    avg_response_time = models.FloatField(default=0, help_text="Average time to answer in seconds")
    
    # Game state
    is_ready = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    last_heartbeat = models.DateTimeField(auto_now=True)
    
    # Power-ups used
    power_ups_used = models.JSONField(default=list, blank=True)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['session', 'user']
    
    def __str__(self):
        return f"{self.user.username} in {self.session.join_code}"
