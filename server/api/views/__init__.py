"""
API Views Package

This package organizes the API views into logical modules:
- auth_views: Authentication (signup, signin, verify, OTP)
- vocab_views: Vocabulary CRUD operations
- practice_views: Progress tracking and practice
- profile_views: User profile management
- stats_views: User statistics
- exam_views: Exam management
- monitoring_views: Health checks

The main views.py import in `api.urls` relies on this package exporting everything.
"""

# Auth views
from .auth_views import (
    signup,
    signin,
    verify_email,
    resend_otp,
    check_username,
    logout,
)

# Vocabulary views
from .vocab_views import (
    VocabularyViewSet,
    PublicVocabularyViewSet,
    enrich_vocabulary_with_ai,
    get_vocab_by_status,
)

# Practice & Progress views
from .practice_views import (
    UserProgressViewSet,
    update_progress,
    QuizViewSet,
    get_words_for_practice,
    record_practice_result,
    get_random_words,
    get_matching_game_words,
    get_review_stats,
)

# Profile views
from .profile_views import (
    UserProfileViewSet,
    UserSearchView,
    update_profile,
    follow_user,
)

# Stats views
from .stats_views import (
    user_statistics,
)

# Exam views
from .exam_views import (
    ExamViewSet,
)

# Monitoring views
from .monitoring_views import (
    health_check,
    admin_activity_feed
)

# Pagination
from .pagination import StandardResultsSetPagination

__all__ = [
    # Auth
    'signup',
    'signin', 
    'verify_email',
    'resend_otp',
    'check_username',
    'logout',
    # Vocabulary
    'VocabularyViewSet',
    'PublicVocabularyViewSet',
    'enrich_vocabulary_with_ai',
    'get_vocab_by_status',
    # Practice
    'UserProgressViewSet',
    'update_progress',
    'QuizViewSet',
    'get_words_for_practice',
    'record_practice_result',
    'get_random_words',
    'get_matching_game_words',
    'get_review_stats',
    # Profile
    'UserProfileViewSet',
    'UserSearchView',
    'update_profile',
    'follow_user',
    # Stats
    'user_statistics',
    # Exams
    'ExamViewSet',
    # Monitoring
    'health_check',
    'admin_activity_feed',
    # Utils
    'StandardResultsSetPagination',
]
