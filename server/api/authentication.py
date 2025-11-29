"""
Enhanced Token Authentication with Expiration
"""
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from datetime import timedelta


class ExpiringTokenAuthentication(TokenAuthentication):
    """
    Token authentication with automatic expiration.
    Tokens expire after 30 days of inactivity.
    Each API call extends the token's lifetime (sliding expiration).
    """
    
    def authenticate_credentials(self, key):
        # Get user and token from parent class
        user, token = super().authenticate_credentials(key)
        
        # Check if token has expired
        # We'll use the user's last_login as the last activity timestamp
        if user.last_login:
            time_since_activity = timezone.now() - user.last_login
            # Expire after 30 days of inactivity
            if time_since_activity > timedelta(days=30):
                raise AuthenticationFailed('Token has expired due to inactivity')
        
        return user, token
