"""
Tests for vocabulary CRUD operations.

Run with: python manage.py test api.tests.test_vocabulary
"""

from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from api.models import Vocabulary, UserProfile
import json


class VocabularyTestCase(APITestCase):
    """Test cases for vocabulary CRUD operations."""
    
    def setUp(self):
        # Create and authenticate user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.user.profile.is_email_verified = True
        self.user.profile.save()
        
        # Create authentication token
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.vocab_url = '/api/vocab/'
        
        # Create sample vocabulary
        self.vocab1 = Vocabulary.objects.create(
            word='Hund',
            translation='Dog',
            type='noun',
            created_by=self.user,
            language='de'
        )
    
    def test_list_vocabulary(self):
        """Test listing user's vocabulary."""
        response = self.client.get(self.vocab_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
    
    def test_create_vocabulary(self):
        """Test creating a new vocabulary word."""
        response = self.client.post(
            self.vocab_url,
            data={
                'word': 'Katze',
                'translation': 'Cat',
                'type': 'noun',
                'language': 'de'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vocabulary.objects.count(), 2)
        self.assertEqual(response.json()['word'], 'Katze')
    
    def test_retrieve_vocabulary(self):
        """Test retrieving a single vocabulary word."""
        response = self.client.get(f'{self.vocab_url}{self.vocab1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['word'], 'Hund')
    
    def test_update_vocabulary(self):
        """Test updating a vocabulary word."""
        response = self.client.patch(
            f'{self.vocab_url}{self.vocab1.id}/',
            data={'translation': 'Doggy'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vocab1.refresh_from_db()
        self.assertEqual(self.vocab1.translation, 'Doggy')
    
    def test_delete_vocabulary(self):
        """Test deleting a vocabulary word."""
        response = self.client.delete(f'{self.vocab_url}{self.vocab1.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Vocabulary.objects.count(), 0)
    
    def test_unauthorized_access(self):
        """Test that unauthenticated requests are rejected."""
        self.client.credentials()  # Remove authentication
        response = self.client.get(self.vocab_url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_user_isolation(self):
        """Test that users can only see their own vocabulary."""
        # Create another user with vocabulary
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='TestPass123!'
        )
        Vocabulary.objects.create(
            word='Fertig',
            translation='Finished',
            type='adjective',
            created_by=other_user,
            language='de'
        )
        
        # Current user should only see their own vocab
        response = self.client.get(self.vocab_url)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['word'], 'Hund')
    
    def test_search_vocabulary(self):
        """Test vocabulary search functionality."""
        # Create more vocabulary
        Vocabulary.objects.create(
            word='Schmetterling',
            translation='Butterfly',
            type='noun',
            created_by=self.user,
            language='de'
        )
        
        response = self.client.get(f'{self.vocab_url}?search=Schm')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['word'], 'Schmetterling')
    
    def test_filter_by_type(self):
        """Test filtering vocabulary by word type."""
        # Create a verb
        Vocabulary.objects.create(
            word='laufen',
            translation='to run',
            type='verb',
            created_by=self.user,
            language='de'
        )
        
        response = self.client.get(f'{self.vocab_url}?type=verb')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['type'], 'verb')


class VocabularyValidationTestCase(APITestCase):
    """Test cases for vocabulary input validation."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.vocab_url = '/api/vocab/'
    
    def test_create_missing_word(self):
        """Test creating vocabulary without word field."""
        response = self.client.post(
            self.vocab_url,
            data={
                'translation': 'Cat',
                'type': 'noun'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_empty_word(self):
        """Test creating vocabulary with empty word."""
        response = self.client.post(
            self.vocab_url,
            data={
                'word': '',
                'translation': 'Cat',
                'type': 'noun'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_invalid_type(self):
        """Test creating vocabulary with invalid type."""
        response = self.client.post(
            self.vocab_url,
            data={
                'word': 'Katze',
                'translation': 'Cat',
                'type': 'invalid_type'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
