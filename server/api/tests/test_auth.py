"""
Tests for authentication endpoints.

Run with: python manage.py test api.tests.test_auth
"""

from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import UserProfile
import json


class SignupTestCase(APITestCase):
    """Test cases for the signup endpoint."""
    
    def setUp(self):
        self.client = Client()
        self.signup_url = '/api/signup/'
        self.valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'native_language': 'en',
            'target_language': 'de'
        }
    
    def test_signup_success(self):
        """Test successful user registration."""
        response = self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_data),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
    
    def test_signup_duplicate_email(self):
        """Test signup with already registered email."""
        # Create user first
        user = User.objects.create_user(
            username='existing',
            email='test@example.com',
            password='TestPass123!'
        )
        profile = user.profile
        profile.is_email_verified = True
        profile.save()
        
        response = self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signup_duplicate_username(self):
        """Test signup with already taken username."""
        User.objects.create_user(
            username='testuser',
            email='other@example.com',
            password='TestPass123!'
        )
        
        response = self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signup_missing_fields(self):
        """Test signup with missing required fields."""
        response = self.client.post(
            self.signup_url,
            data=json.dumps({'username': 'test'}),
            content_type='application/json'
        )
        # Should fail due to missing password/email
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])


class SigninTestCase(APITestCase):
    """Test cases for the signin endpoint."""
    
    def setUp(self):
        self.client = Client()
        self.signin_url = '/api/signin/'
        
        # Create a verified user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.user.profile.is_email_verified = True
        self.user.profile.save()
    
    def test_signin_success(self):
        """Test successful login."""
        response = self.client.post(
            self.signin_url,
            data=json.dumps({
                'username': 'testuser',
                'password': 'TestPass123!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('username', response.json())
    
    def test_signin_invalid_password(self):
        """Test login with wrong password."""
        response = self.client.post(
            self.signin_url,
            data=json.dumps({
                'username': 'testuser',
                'password': 'WrongPassword!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signin_nonexistent_user(self):
        """Test login with non-existent username."""
        response = self.client.post(
            self.signin_url,
            data=json.dumps({
                'username': 'nouser',
                'password': 'TestPass123!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signin_unverified_email(self):
        """Test login with unverified email."""
        # Create unverified user
        unverified = User.objects.create_user(
            username='unverified',
            email='unverified@example.com',
            password='TestPass123!'
        )
        unverified.profile.is_email_verified = False
        unverified.profile.save()
        
        response = self.client.post(
            self.signin_url,
            data=json.dumps({
                'username': 'unverified',
                'password': 'TestPass123!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.json().get('requires_verification'))


class RateLimitingTestCase(APITestCase):
    """Test rate limiting on auth endpoints."""
    
    def setUp(self):
        self.client = Client()
        self.signin_url = '/api/signin/'
    
    def test_rate_limit_signin(self):
        """Test that signin is rate limited after multiple attempts."""
        # Make more requests than allowed
        for i in range(6):
            response = self.client.post(
                self.signin_url,
                data=json.dumps({
                    'username': 'nouser',
                    'password': 'wrong'
                }),
                content_type='application/json'
            )
        
        # The 6th request should be rate limited
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
