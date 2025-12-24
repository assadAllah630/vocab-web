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
    UserProfileViewSet, UserSearchView, follow_user, health_check, admin_activity_feed
)
from .ai_views import ai_assistant, validate_key, generate_exam, bulk_translate, generate_vocab_list, ai_gateway_status, ai_gateway_keys, ai_gateway_key_detail
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
    retry_image_generation,
    update_generated_content,
    save_material
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
    send_test_notification,
    register_fcm_token,
    list_notifications,
    unread_count
)
from .firebase_token_auth import firebase_auth
from .views import podcast_views, vocab_views, exam_views # Added based on the provided router config
from . import feature_views # Added based on the provided router config
from .views.external_podcast_views import (
    ExternalPodcastListView,
    ExternalPodcastDetailView,
    ExternalEpisodeListView,
    add_podcast_by_url,
    sync_podcast_feed,
    subscribe_to_podcast,
    unsubscribe_from_podcast,
    UserSubscriptionsView,
    search_podcasts_itunes,
    import_opml,
    scrape_episode_transcript,
    update_episode_transcript,
    proxy_image,
    test_notification,
    toggle_episode_like,
    toggle_episode_save,
)
from .views.teacher_views import (
    become_teacher,
    get_teacher_profile,
    update_teacher_profile,
    check_teacher_status,
)
from .views.teacher_application_views import (
    apply_for_teacher,
    get_my_application,
    list_applications,
    approve_application,
    reject_application
)
from .views.teacher_dashboard_views import (
    dashboard_overview,
    classroom_stats,
    recent_activity,
    student_performance,
)
from .views.classroom_views import (
    ClassroomViewSet,
    validate_invite_code,
    join_with_code,
    get_share_link,
    send_invite_emails,
    list_classroom_students,
    approve_membership,
    reject_membership,
    remove_student,
    pause_student,
    reactivate_student,
    leave_classroom,
    pending_requests,
)
from .views import (
    assignment_views, 
    teacher_dashboard_views, 
    teacher_views,
    weakness_views, 
    agent_views, 
    recommendation_views, 
    skill_views,
    learning_path_views,
    live_session_views,
    organization_views,
    livekit_webhook_views,
    game_views
)

router = DefaultRouter()
router.register(r'classrooms', ClassroomViewSet, basename='classroom')
router.register(r'vocab', vocab_views.VocabularyViewSet, basename='vocabulary')
router.register(r'progress', UserProgressViewSet, basename='progress')
router.register(r'quiz', QuizViewSet, basename='quiz')
router.register(r'public-vocab', PublicVocabularyViewSet, basename='public-vocabulary')
router.register(r'grammar', GrammarTopicViewSet, basename='grammar')
router.register(r'exams', exam_views.ExamViewSet, basename='exams')
router.register(r'podcasts/categories', podcast_views.PodcastCategoryViewSet, basename='podcast-categories')
router.register(r'podcasts', podcast_views.PodcastViewSet, basename='podcasts')
router.register(r'users', UserProfileViewSet, basename='users')
router.register(r'search/users', UserSearchView, basename='user-search')
router.register(r'saved-texts', SavedTextViewSet, basename='saved-texts')
router.register(r'assignments', assignment_views.AssignmentViewSet, basename='assignment')
router.register(r'weakness', weakness_views.WeaknessViewSet, basename='weakness')
router.register(r'paths', learning_path_views.LearningPathViewSet, basename='learningpath')
router.register(r'path-sublevels', learning_path_views.PathSubLevelViewSet, basename='pathsublevel')
router.register(r'path-nodes', learning_path_views.PathNodeViewSet, basename='pathnode')
router.register(r'path-node-materials', learning_path_views.PathNodeMaterialViewSet, basename='pathnodematerial')
router.register(r'sessions', live_session_views.LiveSessionViewSet, basename='livesession')
router.register(r'game-configs', game_views.GameConfigViewSet, basename='game-config')
router.register(r'game-sessions', game_views.GameSessionViewSet, basename='game-session')
router.register(r'organizations', organization_views.OrganizationViewSet, basename='organization')
router.register(r'writing-exercises', assignment_views.WritingExerciseViewSet, basename='writing-exercise')
router.register(r'teachers', teacher_views.TeacherViewSet, basename='teachers')

urlpatterns = [
    # Custom vocab endpoints must come BEFORE router.urls to avoid conflicts
    path('vocab/by-status/', get_vocab_by_status),
    
    # Semantic Search - MUST be before router.urls
    path('vocab/semantic-search/', semantic_search, name='semantic_search'),
    path('vocab/generate-embeddings/', generate_embeddings, name='generate_embeddings'),
    path('vocab/validate-openrouter/', validate_openrouter_key, name='validate_openrouter_key'),

    # Classroom join/validate - MUST be before router.urls to avoid ViewSet interception
    path('classrooms/validate/<str:code>/', validate_invite_code, name='validate_invite'),
    path('classrooms/join/', join_with_code, name='join_classroom'),

    # Teacher endpoints - MUST be before router.urls to avoid ViewSet interception
    path('teachers/apply/', apply_for_teacher, name='apply_for_teacher'),
    path('teachers/application/', get_my_application, name='get_my_application'),
    path('teachers/become/', become_teacher, name='become_teacher'),
    path('teachers/me/', get_teacher_profile, name='teacher_profile'),
    path('teachers/me/update/', update_teacher_profile, name='update_teacher_profile'),
    path('teachers/status/', check_teacher_status, name='teacher_status'),
    path('teachers/dashboard/', teacher_dashboard_views.dashboard_overview, name='teacher_dashboard_overview'),
    path('teachers/stats/classroom/<int:id>/', teacher_dashboard_views.classroom_stats, name='teacher_classroom_stats_early'),
    path('teachers/activity/', teacher_dashboard_views.recent_activity, name='teacher_activity'),
    path('teachers/performance/classroom/<int:cid>/student/<int:sid>/', teacher_dashboard_views.student_performance, name='teacher_student_performance_early'),
    # Teacher Application Admin
    path('teachers/admin/applications/', list_applications, name='admin_list_applications'),
    path('teachers/admin/applications/<int:application_id>/approve/', approve_application, name='admin_approve_application'),
    path('teachers/admin/applications/<int:application_id>/reject/', reject_application, name='admin_reject_application'),

    # Router URLs (includes vocab/, progress/, classrooms/, etc.)
    path('', include(router.urls)),
    
    # Agent Endpoints
    path('agent/insights/', agent_views.generate_student_insights, name='student_insights'),
    path('recommendations/', recommendation_views.my_recommendations, name='my_recommendations'),
    path('skills/mine/', skill_views.SkillMasteryViewSet.as_view({'get': 'list'}), name='my_skills'),

    # Auth
    path('auth/signup/', signup),
    path('auth/signin/', signin),
    path('auth/logout/', views.logout, name='logout'),
    path('logout/', views.logout), # Backward compatibility for some frontend calls
    path('auth/verify-email/', views.verify_email),
    path('auth/resend-otp/', views.resend_otp),
    path('auth/check-username/', views.check_username),
    
    # Google OAuth
    path('auth/google/', google_oauth_login, name='google_oauth_login'),
    path('auth/firebase/', firebase_auth, name='firebase_auth'),  # Firebase ID token verification
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
    path('ai/generate-vocab/', generate_vocab_list, name='generate_vocab_list'),
    path('ai/gateway-status/', ai_gateway_status, name='ai_gateway_status'),
    
    # AI Gateway Key Management
    path('ai-gateway/keys/', ai_gateway_keys, name='ai_gateway_keys'),
    path('ai-gateway/keys/<int:key_id>/', ai_gateway_key_detail, name='ai_gateway_key_detail'),
    
    # Advanced Text Generator
    path('ai/generate-advanced-text/', generate_advanced_text, name='generate_advanced_text'),
    path('ai/generated-content/', list_generated_content, name='list_generated_content'),
    path('ai/generated-content/<int:pk>/', get_generated_content, name='get_generated_content'),
    path('ai/generated-content/<int:pk>/update/', update_generated_content, name='update_generated_content'),
    path('ai/save-material/', save_material, name='save_material'),
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

    # Admin School Management Activity
    path('admin/activity/', admin_activity_feed, name='admin_activity_feed'),
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
    path('notifications/register-fcm/', register_fcm_token, name='register_fcm_token'),
    path('notifications/subscribe/', subscribe_push, name='subscribe_push'),
    path('notifications/unsubscribe/', unsubscribe_push, name='unsubscribe_push'),
    path('notifications/preferences/', notification_preferences, name='notification_preferences'),
    path('notifications/status/', notification_status, name='notification_status'),
    path('notifications/test/', send_test_notification, name='send_test_notification'),
    path('notifications/list/', list_notifications, name='list_notifications'),
    path('notifications/unread-count/', unread_count, name='unread_count'),
    
    # ==========================================================================
    # Teacher & Classroom System (paths moved before router.urls above)
    # ==========================================================================


    # Classroom Share & Invite Management
    path('classrooms/<int:classroom_id>/share-link/', get_share_link, name='share_link'),
    path('classrooms/<int:classroom_id>/send-invites/', send_invite_emails, name='send_invites'),

    # Membership Management
    path('classrooms/<int:classroom_id>/students/', list_classroom_students, name='classroom_students'),
    path('classrooms/<int:classroom_id>/students/pending/', pending_requests, name='pending_requests'),
    path('classrooms/<int:classroom_id>/students/<int:membership_id>/approve/', approve_membership, name='approve_membership'),
    path('classrooms/<int:classroom_id>/students/<int:membership_id>/reject/', reject_membership, name='reject_membership'),
    path('classrooms/<int:classroom_id>/students/<int:student_id>/remove/', remove_student, name='remove_student'),
    path('classrooms/<int:classroom_id>/students/<int:student_id>/pause/', pause_student, name='pause_student'),
    path('classrooms/<int:classroom_id>/students/<int:student_id>/reactivate/', reactivate_student, name='reactivate_student'),
    path('classrooms/<int:classroom_id>/leave/', leave_classroom, name='leave_classroom'),

    # Assignments
    path('assignments/<int:id>/start/', assignment_views.start_assignment, name='start_assignment'),
    path('assignments/<int:id>/submit/', assignment_views.submit_assignment, name='submit_assignment'),
    path('assignments/progress/<int:id>/submit-writing/', assignment_views.submit_writing_content, name='submit_writing_content'),
    path('assignments/progress/<int:id>/grading-details/', assignment_views.get_grading_details, name='get_grading_details'),
    path('assignments/progress/<int:id>/analyze/', assignment_views.analyze_writing_submission, name='analyze_writing_submission'),
    path('assignments/progress/<int:id>/grade/', assignment_views.grade_assignment, name='grade_assignment'),
    
    # Teacher Dashboard Analytics
    path('teacher/dashboard/', dashboard_overview, name='teacher_dashboard'),
    path('teacher/classrooms/<int:id>/stats/', classroom_stats, name='teacher_classroom_stats'),
    path('teacher/activity/', recent_activity, name='teacher_recent_activity'),
    path('teacher/classrooms/<int:cid>/students/<int:sid>/performance/', student_performance, name='teacher_student_performance'),
    
    # Game Arena
    path('games/join/', game_views.join_by_code, name='game_join_by_code'),
    
    # Monitoring
    path('health/', health_check, name='health_check'),
    
    # AI Gateway - Multi-Provider API Key Management
    path('ai-gateway/', include('api.ai_gateway.urls')),
    
    # Livekit Webhook (Video Sessions)
    path('webhooks/livekit/', livekit_webhook_views.livekit_webhook, name='livekit_webhook'),
    
    # Admin Panel API
    path('admin/', include('api.admin_urls')),
    
    # ==========================================================================
    # External Podcasts - RSS Feed Integration (streaming from external sources)
    # ==========================================================================
    path('external-podcasts/', ExternalPodcastListView.as_view(), name='external_podcast_list'),
    path('external-podcasts/search/', search_podcasts_itunes, name='search_podcasts_itunes'),
    path('external-podcasts/import-opml/', import_opml, name='import_opml'),
    path('external-podcasts/add/', add_podcast_by_url, name='add_external_podcast'),
    path('external-podcasts/subscriptions/', UserSubscriptionsView.as_view(), name='user_subscriptions'),
    path('external-podcasts/<int:pk>/', ExternalPodcastDetailView.as_view(), name='external_podcast_detail'),
    path('external-podcasts/<int:pk>/sync/', sync_podcast_feed, name='sync_external_podcast'),
    path('external-podcasts/<int:pk>/subscribe/', subscribe_to_podcast, name='subscribe_podcast'),
    path('external-podcasts/<int:pk>/unsubscribe/', unsubscribe_from_podcast, name='unsubscribe_podcast'),
    path('external-podcasts/<int:podcast_id>/episodes/', ExternalEpisodeListView.as_view(), name='external_episode_list'),
    path('external-episodes/<int:pk>/scrape_transcript/', scrape_episode_transcript, name='scrape-episode-transcript'),
    path('external-episodes/<int:pk>/update_transcript/', update_episode_transcript, name='update-episode-transcript'),
    path('external-episodes/<int:pk>/like/', toggle_episode_like, name='toggle-episode-like'),
    path('external-episodes/<int:pk>/save/', toggle_episode_save, name='toggle-episode-save'),
    path('proxy-image/', proxy_image, name='proxy-image'),
    path('external-podcasts/test-notification/', test_notification, name='test_notification'),
]
