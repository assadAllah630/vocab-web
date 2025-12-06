from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    VocabularyViewSet, UserProgressViewSet, QuizViewSet,
    signup, signin, update_progress, user_statistics, update_profile,
    PublicVocabularyViewSet, ExamViewSet,
    get_vocab_by_status,
    get_words_for_practice, record_practice_result, get_review_stats,
    get_random_words, get_matching_game_words,
    UserProfileViewSet, UserSearchView, follow_user, health_check
)
from .ai_views import ai_assistant, validate_key, generate_exam, bulk_translate
from .feature_views import (
    GrammarTopicViewSet,
    PodcastViewSet,
    SavedTextViewSet,
    generate_text,
    generate_podcast,
    user_profile,
    analyze_text
)
from .tts_views import (
    list_tts_voices,
    list_voices_for_language,
    generate_speech,
    validate_google_tts_key,
    validate_deepgram_key,
    list_speechify_voices,
    validate_speechify_key
)
from .semantic_search_views import (
    semantic_search,
    generate_embeddings,
    validate_openrouter_key
)
from .google_auth import (
    google_oauth_login,
    send_otp,
    verify_otp,
    send_exam_share_notification
)
from .password_views import (
    set_password,
    change_password,
    check_password_status
)
from .advanced_text_views import (
    generate_advanced_text,
    list_generated_content,
    get_generated_content,
    toggle_favorite,
    delete_generated_content,
    get_image_generation_status,
    get_image_generation_status,
    retry_image_generation
)
from .image_generation_sse import stream_image_generation_progress
from .text_extraction_views import TextExtractionView, SupportedFormatsView
from .content_extraction_views import ContentExtractionView, YouTubeTranscriptView
from .text_converter_views import TextConverterAgentView, QuickFormatView
from .notification_views import (
    subscribe_push,
    unsubscribe_push,
    notification_preferences,
    notification_status,
    send_test_notification
)

router = DefaultRouter()
router.register(r'vocab', VocabularyViewSet, basename='vocabulary')
router.register(r'progress', UserProgressViewSet, basename='progress')
router.register(r'quiz', QuizViewSet, basename='quiz')
router.register(r'public-vocab', PublicVocabularyViewSet, basename='public-vocabulary')
router.register(r'grammar', GrammarTopicViewSet, basename='grammar')
router.register(r'podcasts', PodcastViewSet, basename='podcast')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'users', UserProfileViewSet, basename='user-profile')
router.register(r'search/users', UserSearchView, basename='user-search')
router.register(r'saved-texts', SavedTextViewSet, basename='saved-text')

urlpatterns = [
    # Custom vocab endpoints must come BEFORE router.urls to avoid conflicts
    path('vocab/by-status/', get_vocab_by_status),
    
    # Semantic Search - MUST be before router.urls
    path('vocab/semantic-search/', semantic_search, name='semantic_search'),
    path('vocab/generate-embeddings/', generate_embeddings, name='generate_embeddings'),
    path('vocab/validate-openrouter/', validate_openrouter_key, name='validate_openrouter_key'),

    # Router URLs (includes vocab/, progress/, etc.)
    path('', include(router.urls)),

    # Auth
    path('auth/signup/', signup),
    path('auth/signin/', signin),
    path('auth/verify-email/', views.verify_email),
    path('auth/resend-otp/', views.resend_otp),
    path('auth/check-username/', views.check_username),
    
    # Google OAuth
    path('auth/google/', google_oauth_login, name='google_oauth_login'),
    path('auth/send-otp/', send_otp, name='send_otp'),
    path('auth/verify-otp/', verify_otp, name='verify_otp'),
    
    # Password Management
    path('auth/set-password/', set_password, name='set_password'),
    path('auth/change-password/', change_password, name='change_password'),
    path('auth/password-status/', check_password_status, name='check_password_status'),
    
    # Notifications
    path('notifications/share-exam/', send_exam_share_notification, name='share_exam_notification'),
    
    path('progress/update/', update_progress),
    path('stats/', user_statistics),

    # AI
    path('ai/chat/', ai_assistant),
    path('ai/validate-key/', validate_key),
    path('ai/generate-exam/', generate_exam),
    path('ai/bulk-translate/', bulk_translate),
    
    # Advanced Text Generator
    path('ai/generate-advanced-text/', generate_advanced_text, name='generate_advanced_text'),
    path('ai/generated-content/', list_generated_content, name='list_generated_content'),
    path('ai/generated-content/<int:pk>/', get_generated_content, name='get_generated_content'),
    path('ai/generated-content/<int:pk>/favorite/', toggle_favorite, name='toggle_favorite'),
    path('ai/generated-content/<int:pk>/delete/', delete_generated_content, name='delete_generated_content'),
    path('ai/generated-content/<int:pk>/images/status/', get_image_generation_status, name='get_image_generation_status'),
    path('ai/generated-content/<int:pk>/images/stream/', stream_image_generation_progress, name='stream_image_generation_progress'),
    path('ai/generated-content/<int:pk>/images/<int:event_number>/retry/', retry_image_generation, name='retry_image_generation'),

    # Text and Podcast generation
    path('generate-text/', generate_text),
    path('generate-podcast/', generate_podcast),
    path('analyze-text/', analyze_text),
    
    # Text Extraction (multi-format file upload)
    path('extract-text/', TextExtractionView.as_view(), name='extract_text'),
    path('extract-text/formats/', SupportedFormatsView.as_view(), name='supported_formats'),
    
    # Web Content Extraction (articles, YouTube, web pages)
    path('extract-content/', ContentExtractionView.as_view(), name='extract_content'),
    path('extract-youtube/', YouTubeTranscriptView.as_view(), name='extract_youtube'),
    
    # AI Text Converter (multi-agent pipeline)
    path('convert-text/', TextConverterAgentView.as_view(), name='convert_text'),
    path('quick-format/', QuickFormatView.as_view(), name='quick_format'),

    # Google TTS endpoints
    path('tts/voices/', list_tts_voices),
    path('tts/voices/<str:language_code>/', list_voices_for_language),
    path('tts/generate/', generate_speech),
    path('tts/validate/', validate_google_tts_key),
    path('tts/validate-deepgram/', validate_deepgram_key),
    path('tts/validate-speechify/', validate_speechify_key),
    path('tts/speechify-voices/', list_speechify_voices),

    # User profile & Social
    path('profile/', user_profile),
    path('update_profile/', views.update_profile, name='update_profile'),  # For language switching
    path('users/follow/', follow_user),

    # HLR Practice & Games
    path('practice/words/', views.get_words_for_practice, name='get_words_for_practice'),
    path('practice/random/', views.get_random_words, name='get_random_words'),
    path('practice/result/', views.record_practice_result, name='record_practice_result'),
    path('practice/stats/', views.get_review_stats, name='get_review_stats'),
    path('games/matching/', views.get_matching_game_words, name='get_matching_game_words'),
    
    # Push Notifications
    path('notifications/subscribe/', subscribe_push, name='subscribe_push'),
    path('notifications/unsubscribe/', unsubscribe_push, name='unsubscribe_push'),
    path('notifications/preferences/', notification_preferences, name='notification_preferences'),
    path('notifications/status/', notification_status, name='notification_status'),
    path('notifications/test/', send_test_notification, name='send_test_notification'),
    
    # Monitoring
    path('health/', health_check, name='health_check'),
    
    # Admin Panel API
    path('admin/', include('api.admin_urls')),
]

