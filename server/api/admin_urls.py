from django.urls import path
from . import admin_views
from .bulk_user_views import (
    BulkUserActionsView, AdvancedUserFilterView, UserExportView,
    UserActivityTimelineView, UserQuickActionsView
)
from .analytics_views import (
    CohortAnalysisView, EngagementMetricsView, ChurnPredictionView, GrowthMetricsView
)
from .system_metrics_views import system_metrics

urlpatterns = [
    # Authentication
    path('auth/login/', admin_views.AdminLoginView.as_view(), name='admin-login'),
    path('auth/logout/', admin_views.AdminLogoutView.as_view(), name='admin-logout'),
    path('auth/me/', admin_views.AdminMeView.as_view(), name='admin-me'),
    
    # User Management
    path('users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/', admin_views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<int:pk>/suspend/', admin_views.AdminUserActionView.as_view(), {'action': 'suspend'}, name='admin-user-suspend'),
    path('users/<int:pk>/unsuspend/', admin_views.AdminUserActionView.as_view(), {'action': 'unsuspend'}, name='admin-user-unsuspend'),
    
    # Bulk User Management
    path('users/bulk/', BulkUserActionsView.as_view(), name='bulk-user-actions'),
    path('users/filter/', AdvancedUserFilterView.as_view(), name='advanced-user-filter'),
    path('users/export/', UserExportView.as_view(), name='user-export'),
    path('users/<int:user_id>/timeline/', UserActivityTimelineView.as_view(), name='user-timeline'),
    path('users/<int:user_id>/quick-action/', UserQuickActionsView.as_view(), name='user-quick-action'),
    
    # Content Management
    path('content/vocabulary/', admin_views.AdminVocabularyListView.as_view(), name='admin-vocabulary-list'),
    path('content/vocabulary/<int:pk>/', admin_views.AdminVocabularyDetailView.as_view(), name='admin-vocabulary-detail'),
    path('content/grammar/', admin_views.AdminGrammarTopicListView.as_view(), name='admin-grammar-list'),
    path('content/generated/', admin_views.AdminGeneratedContentListView.as_view(), name='admin-generated-content-list'),
    
    #Analytics
    path('analytics/dashboard/', admin_views.AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
    path('analytics/users/', admin_views.AdminUserAnalyticsView.as_view(), name='admin-user-analytics'),
    path('analytics/ai/', admin_views.AdminAIAnalyticsView.as_view(), name='admin-ai-analytics'),
    path('analytics/content/', admin_views.AdminContentAnalyticsView.as_view(), name='admin-content-analytics'),
    
    # Advanced Analytics
    path('analytics/cohorts/', CohortAnalysisView.as_view(), name='cohort-analysis'),
    path('analytics/engagement/', EngagementMetricsView.as_view(), name='engagement-metrics'),
    path('analytics/churn/', ChurnPredictionView.as_view(), name='churn-prediction'),
    path('analytics/growth/', GrowthMetricsView.as_view(), name='growth-metrics'),
    
    # Monitoring - Real System Metrics
    path('monitoring/health/', system_metrics, name='system-metrics'),
    path('audit-logs/', admin_views.AdminAuditLogView.as_view(), name='admin-audit-logs'),
    path('error-logs/', admin_views.AdminErrorLogListView.as_view(), name='admin-error-logs'),
    
    # Settings
    path('settings/admins/', admin_views.AdminUserManagementView.as_view(), name='admin-management'),
]
