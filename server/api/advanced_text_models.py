from django.db import models
from django.contrib.auth.models import User


class GeneratedContent(models.Model):
    """Store AI-generated educational content (stories, articles, dialogues)"""
    
    CONTENT_TYPES = [
        ('story', 'Story'),
        ('article', 'Article'),
        ('dialogue', 'Dialogue'),
    ]
    
    LEVELS = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Proficiency'),
    ]
    
    LANGUAGES = [
        ('en', 'English'),
        ('de', 'German'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]
    
    # Basic Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_content')
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES)
    title = models.CharField(max_length=200)
    topic = models.CharField(max_length=200)
    level = models.CharField(max_length=2, choices=LEVELS)
    target_language = models.CharField(max_length=2, choices=LANGUAGES)
    native_language = models.CharField(max_length=2, choices=LANGUAGES, default='en', help_text='Translation language for content')
    
    # Content Structure (JSON)
    content_data = models.JSONField(help_text='Stores events/paragraphs/messages structure')
    
    # Metadata
    total_words = models.IntegerField(default=0)
    vocabulary_used = models.JSONField(default=list, help_text='List of vocabulary words used')
    grammar_used = models.JSONField(default=list, help_text='List of grammar points used')
    
    # Image Generation Fields
    has_images = models.BooleanField(default=False)
    images_generated_count = models.IntegerField(default=0)
    total_images_count = models.IntegerField(default=0)
    image_generation_status = models.CharField(
        max_length=20,
        choices=[
            ('none', 'No Images'),
            ('pending', 'Pending'),
            ('generating', 'Generating'),
            ('completed', 'Completed'),
            ('partial', 'Partially Completed'),
            ('failed', 'Failed'),
        ],
        default='none'
    )
    image_providers_used = models.JSONField(default=list, help_text='List of providers used for images')
    generation_time_seconds = models.FloatField(null=True, blank=True)
    
    # User Actions
    is_favorite = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'content_type']),
            models.Index(fields=['user', 'is_favorite']),
        ]
    
    def __str__(self):
        return f"{self.get_content_type_display()}: {self.title} ({self.user.username})"
    
    def increment_view_count(self):
        """Increment view count when content is accessed"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
