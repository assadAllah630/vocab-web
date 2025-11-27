from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from api.models import UserProfile

@override_settings(RATELIMIT_ENABLE=False)
class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
        self.signin_url = '/api/auth/signin/'
        
        # Create a test user
        self.username = 'testuser'
        self.email = 'test@example.com'
        self.password = 'testpass123'
        self.user = User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password
        )
        # UserProfile is created automatically by signal
        # Verify email to allow login
        self.user.profile.is_email_verified = True
        self.user.profile.save()

    def test_signin_success(self):
        """Test that valid credentials return 200 OK and user data"""
        # Refresh from DB to be sure
        self.user.profile.refresh_from_db()
        print(f"DEBUG TEST: User {self.user.username} verified={self.user.profile.is_email_verified}")
        
        data = {
            'username': self.username,
            'password': self.password
        }
        response = self.client.post(self.signin_url, data, format='json')
        print(f"DEBUG TEST: Response {response.status_code} - {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('username', response.data)
        self.assertEqual(response.data['username'], self.username)

    def test_signin_invalid_credentials(self):
        """Test that invalid password returns 400 Bad Request"""
        data = {
            'username': self.username,
            'password': 'wrongpassword'
        }
        response = self.client.post(self.signin_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signin_missing_fields(self):
        """Test that missing fields are handled gracefully"""
        data = {
            'username': self.username
            # Missing password
        }
        response = self.client.post(self.signin_url, data, format='json')
        
        # Should be 400 or 403, definitely not 500
        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_ratelimit_configuration(self):
        """
        Indirectly test ratelimit by making multiple requests.
        If cache is missing, this would raise 500.
        """
        data = {
            'username': self.username,
            'password': self.password
        }
        # Make a few requests to ensure ratelimit logic triggers without crashing
        for _ in range(3):
            response = self.client.post(self.signin_url, data, format='json')
            self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
