"""
Firebase Token Verification for Django
Uses Google's public certificates to verify Firebase ID tokens
No service account required!
"""
import requests
import json
from datetime import datetime, timezone
from functools import lru_cache
import time
import jwt
from jwt import PyJWKClient
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import UserProfile

# Firebase project ID
FIREBASE_PROJECT_ID = 'vocabmaster-6a729'

# Google's public key URL for Firebase
GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'


class FirebaseTokenVerifier:
    """Verify Firebase ID tokens using Google's public certificates"""
    
    def __init__(self):
        self.certs_url = GOOGLE_CERTS_URL
        self.project_id = FIREBASE_PROJECT_ID
        self._cache_time = 0
        self._cached_certs = None
        self._cache_duration = 3600  # 1 hour
    
    def _get_certificates(self):
        """Fetch and cache Google's public certificates"""
        current_time = time.time()
        
        if self._cached_certs and (current_time - self._cache_time) < self._cache_duration:
            return self._cached_certs
        
        try:
            response = requests.get(self.certs_url, timeout=10)
            response.raise_for_status()
            self._cached_certs = response.json()
            self._cache_time = current_time
            return self._cached_certs
        except Exception as e:
            print(f"Error fetching Firebase certs: {e}")
            if self._cached_certs:
                return self._cached_certs
            raise
    
    def verify_token(self, id_token):
        """
        Verify a Firebase ID token
        
        Args:
            id_token: The Firebase ID token from the client
            
        Returns:
            dict: The decoded token payload if valid
            
        Raises:
            ValueError: If token is invalid
        """
        if not id_token:
            raise ValueError("No token provided")
        
        # Get the key ID from the token header
        try:
            unverified_header = jwt.get_unverified_header(id_token)
            kid = unverified_header.get('kid')
            if not kid:
                raise ValueError("Token missing key ID")
        except Exception as e:
            raise ValueError(f"Invalid token header: {e}")
        
        # Get the public certificates
        certs = self._get_certificates()
        
        if kid not in certs:
            # Refresh cache and try again
            self._cache_time = 0
            certs = self._get_certificates()
            if kid not in certs:
                raise ValueError(f"Unknown key ID: {kid}")
        
        # Get the certificate for this key
        cert = certs[kid]
        
        try:
            # Verify and decode the token
            decoded = jwt.decode(
                id_token,
                cert,
                algorithms=['RS256'],
                audience=self.project_id,
                issuer=f'https://securetoken.google.com/{self.project_id}'
            )
            
            # Additional validations
            if decoded.get('auth_time', 0) > time.time():
                raise ValueError("Token auth_time is in the future")
            
            return decoded
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidAudienceError:
            raise ValueError("Invalid audience")
        except jwt.InvalidIssuerError:
            raise ValueError("Invalid issuer")
        except Exception as e:
            raise ValueError(f"Token verification failed: {e}")


# Global verifier instance
firebase_verifier = FirebaseTokenVerifier()


@api_view(['POST'])
@permission_classes([AllowAny])
def firebase_auth(request):
    """
    Authenticate user with Firebase ID token
    
    Expects: { "id_token": "firebase_id_token" }
    Returns: { "token": "django_auth_token", "user": {...} }
    """
    id_token = request.data.get('id_token')
    
    if not id_token:
        return Response(
            {'error': 'Firebase ID token required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verify the Firebase token
        decoded_token = firebase_verifier.verify_token(id_token)
        
        # Extract user info from token
        firebase_uid = decoded_token['sub']  # Firebase user ID
        email = decoded_token.get('email', '')
        email_verified = decoded_token.get('email_verified', False)
        name = decoded_token.get('name', '')
        picture = decoded_token.get('picture', '')
        
        if not email:
            return Response(
                {'error': 'Email not found in Firebase token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create Django user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0][:30] or firebase_uid[:30],
                'first_name': name.split()[0] if name else '',
                'last_name': ' '.join(name.split()[1:]) if name else '',
            }
        )
        
        # Handle username conflicts for new users
        if created:
            # Ensure unique username
            base_username = user.username
            counter = 1
            while User.objects.filter(username=user.username).exclude(pk=user.pk).exists():
                user.username = f"{base_username}{counter}"
                counter += 1
            user.save()
        
        # Update or create profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.firebase_uid = firebase_uid
        profile.is_email_verified = email_verified
        if picture and not profile.avatar_url:
            profile.avatar_url = picture
        profile.save()
        
        # Get or create Django token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_url': profile.avatar_url,
                'is_email_verified': profile.is_email_verified,
                'native_language': profile.native_language,
                'learning_language': profile.learning_language,
            },
            'created': created,
        })
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        print(f"Firebase auth error: {e}")
        return Response(
            {'error': 'Authentication failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
