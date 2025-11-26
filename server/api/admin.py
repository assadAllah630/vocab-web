from django.contrib import admin
from .models import Vocabulary, UserProgress, Quiz, Tag, UserProfile, GrammarTopic, Podcast

@admin.register(Vocabulary)
class VocabularyAdmin(admin.ModelAdmin):
    list_display = ['word', 'translation', 'type', 'created_by', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['word', 'translation']

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'vocab', 'repetition_stage', 'easiness_factor']
    list_filter = ['repetition_stage']

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['user', 'vocab', 'score', 'timestamp']
    list_filter = ['timestamp']

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'native_language', 'target_language']
    list_filter = ['native_language', 'target_language']

@admin.register(GrammarTopic)
class GrammarTopicAdmin(admin.ModelAdmin):
    list_display = ['level', 'category', 'title', 'order', 'created_at']
    list_filter = ['level', 'category']
    search_fields = ['title', 'content']
    ordering = ['level', 'order', 'category']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('level', 'category', 'title', 'order')
        }),
        ('Content', {
            'fields': ('content', 'examples')
        }),
    )

@admin.register(Podcast)
class PodcastAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'voice_id', 'duration', 'created_at']
    list_filter = ['created_at', 'voice_id']
    search_fields = ['title', 'text_content']
    readonly_fields = ['created_at']
