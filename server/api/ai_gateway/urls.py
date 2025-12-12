"""
URL Configuration for AI Gateway module.
"""

from django.urls import path
from .routers import (
    KeysListCreateView, 
    KeyDetailView, 
    KeyTestView,
    ChatCompletionsView,
    StatsView,
    ProviderStatsView,
    ProvidersView,
    DashboardView,
)

app_name = 'ai_gateway'

urlpatterns = [
    # Dashboard - user-friendly usage summary
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # API Key management
    path('keys/', KeysListCreateView.as_view(), name='keys_list_create'),
    path('keys/<int:key_id>/', KeyDetailView.as_view(), name='key_detail'),
    path('keys/<int:key_id>/test/', KeyTestView.as_view(), name='key_test'),
    
    # Chat completions (main endpoint)
    path('chat/completions/', ChatCompletionsView.as_view(), name='chat_completions'),
    
    # Providers and models info
    path('providers/', ProvidersView.as_view(), name='providers'),
    
    # Stats and analytics
    path('stats/', StatsView.as_view(), name='stats'),
    path('stats/provider/<str:provider>/', ProviderStatsView.as_view(), name='provider_stats'),
]
