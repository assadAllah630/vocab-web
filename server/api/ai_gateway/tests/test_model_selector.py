"""
Unit Tests for AI Gateway v2.0 - ModelSelector and LearningEngine

Run with:
    python manage.py test api.ai_gateway.tests.test_model_selector
"""

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from api.ai_gateway.models import (
    UserAPIKey, ModelDefinition, ModelInstance, FailureLog
)
from api.ai_gateway.services.model_selector import ModelSelector, ModelSelectionResult
from api.ai_gateway.services.learning_engine import LearningEngine


class ModelSelectorTestCase(TestCase):
    """Tests for ModelSelector service."""
    
    def setUp(self):
        """Create test user, API key, model definition, and model instance."""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create a test API key
        self.api_key = UserAPIKey.objects.create(
            user=self.user,
            provider='gemini',
            api_key_encrypted='test_encrypted_key',
            key_nickname='Test Gemini Key',
            is_active=True,
            health_score=100
        )
        
        # Create model definition
        self.model_def = ModelDefinition.objects.create(
            provider='gemini',
            model_id='gemini-2.0-flash',
            display_name='Gemini 2.0 Flash',
            is_text=True,
            is_image=False,
            default_daily_quota=1500,
            default_minute_quota=15,
            quality_tier='high',
            is_free=True,
            is_active=True
        )
        
        # Create model instance
        self.model_instance = ModelInstance.objects.create(
            api_key=self.api_key,
            model=self.model_def,
            daily_quota=1500,
            remaining_daily=1500,
            minute_quota=15,
            remaining_minute=15,
            health_score=100,
            confidence_score=1.0,
            is_blocked=False
        )
        
        self.selector = ModelSelector()
    
    def test_find_best_model_returns_available_model(self):
        """Test that find_best_model returns an available model."""
        result = self.selector.find_best_model(
            user=self.user,
            request_type='text'
        )
        
        self.assertTrue(result.success)
        self.assertIsNotNone(result.model)
        self.assertEqual(result.model.model.model_id, 'gemini-2.0-flash')
    
    def test_find_best_model_respects_blocked_status(self):
        """Test that blocked models are not selected."""
        self.model_instance.is_blocked = True
        self.model_instance.block_until = timezone.now() + timedelta(hours=1)
        self.model_instance.save()
        
        result = self.selector.find_best_model(
            user=self.user,
            request_type='text'
        )
        
        self.assertFalse(result.success)
        self.assertIsNone(result.model)
    
    def test_find_best_model_respects_quota(self):
        """Test that models with no remaining quota are not selected."""
        self.model_instance.remaining_daily = 0
        self.model_instance.save()
        
        result = self.selector.find_best_model(
            user=self.user,
            request_type='text'
        )
        
        # Should fail since no quota left
        self.assertFalse(result.success)
    
    def test_calculate_availability_score_full_health(self):
        """Test scoring for a fully healthy model."""
        score = self.selector.calculate_availability_score(self.model_instance)
        
        # Weighted formula gives ~0.85 for healthy model (25% each factor)
        self.assertGreater(score, 0.8)
    
    def test_calculate_availability_score_low_quota(self):
        """Test scoring decreases with low quota."""
        self.model_instance.remaining_daily = 5
        self.model_instance.save()
        
        score = self.selector.calculate_availability_score(self.model_instance)
        
        # Should be lower due to low quota
        self.assertLess(score, 0.7)
    
    def test_calculate_availability_score_recent_failure(self):
        """Test scoring decreases after recent failure."""
        self.model_instance.last_failure_at = timezone.now() - timedelta(seconds=30)
        self.model_instance.consecutive_failures = 1
        self.model_instance.save()
        
        score = self.selector.calculate_availability_score(self.model_instance)
        
        # Should be lower due to recent failure
        self.assertLess(score, 0.8)
    
    def test_find_best_model_filters_by_type(self):
        """Test that request_type filters correctly."""
        # Create an image model
        image_model_def = ModelDefinition.objects.create(
            provider='pollinations',
            model_id='flux',
            display_name='Pollinations Flux',
            is_text=False,
            is_image=True,
            is_active=True
        )
        
        image_key = UserAPIKey.objects.create(
            user=self.user,
            provider='pollinations',
            api_key_encrypted='test_key',
            is_active=True
        )
        
        ModelInstance.objects.create(
            api_key=image_key,
            model=image_model_def,
            daily_quota=999999,
            remaining_daily=999999,
            is_blocked=False
        )
        
        # Request text model
        text_result = self.selector.find_best_model(
            user=self.user,
            request_type='text'
        )
        
        # Request image model
        image_result = self.selector.find_best_model(
            user=self.user,
            request_type='image'
        )
        
        self.assertTrue(text_result.success)
        self.assertTrue(text_result.model.model.is_text)
        
        self.assertTrue(image_result.success)
        self.assertTrue(image_result.model.model.is_image)


class LearningEngineTestCase(TestCase):
    """Tests for LearningEngine service."""
    
    def setUp(self):
        """Create test fixtures."""
        self.user = User.objects.create_user(
            username='testuser2',
            password='testpass123'
        )
        
        self.api_key = UserAPIKey.objects.create(
            user=self.user,
            provider='gemini',
            api_key_encrypted='test_key',
            is_active=True
        )
        
        self.model_def = ModelDefinition.objects.create(
            provider='gemini',
            model_id='gemini-test',
            display_name='Test Model',
            is_text=True,
            is_active=True
        )
        
        self.model_instance = ModelInstance.objects.create(
            api_key=self.api_key,
            model=self.model_def,
            daily_quota=1000,
            remaining_daily=1000,
            minute_quota=15,
            remaining_minute=15,
            health_score=100,
            total_requests=0,
            total_successes=0,
            total_failures=0
        )
        
        self.engine = LearningEngine()
    
    def test_record_success_updates_counters(self):
        """Test that success recording updates all counters properly."""
        initial_daily = self.model_instance.remaining_daily
        
        self.engine.record_success(
            instance=self.model_instance,
            latency_ms=200,
            tokens_used=500
        )
        
        self.model_instance.refresh_from_db()
        
        self.assertEqual(self.model_instance.remaining_daily, initial_daily - 1)
        self.assertEqual(self.model_instance.total_requests, 1)
        self.assertEqual(self.model_instance.total_successes, 1)
        self.assertEqual(self.model_instance.consecutive_failures, 0)
        self.assertIsNotNone(self.model_instance.last_success_at)
    
    def test_record_failure_quota_exceeded_blocks_model(self):
        """Test that quota exceeded error blocks the model until reset."""
        self.engine.record_failure(
            instance=self.model_instance,
            error_type='QUOTA_EXCEEDED',
            error_message='429 Too Many Requests'
        )
        
        self.model_instance.refresh_from_db()
        
        self.assertTrue(self.model_instance.is_blocked)
        self.assertIsNotNone(self.model_instance.block_until)
        self.assertEqual(self.model_instance.remaining_daily, 0)
        self.assertEqual(self.model_instance.total_failures, 1)
    
    def test_record_failure_rate_limited_blocks_temporarily(self):
        """Test that rate limit error blocks for 60 seconds."""
        self.engine.record_failure(
            instance=self.model_instance,
            error_type='RATE_LIMITED',
            error_message='Rate limit exceeded'
        )
        
        self.model_instance.refresh_from_db()
        
        self.assertTrue(self.model_instance.is_blocked)
        # Block should expire within ~70 seconds
        self.assertLess(
            self.model_instance.block_until,
            timezone.now() + timedelta(seconds=70)
        )
    
    def test_record_failure_invalid_key_deactivates_key(self):
        """Test that invalid key error deactivates the API key."""
        self.engine.record_failure(
            instance=self.model_instance,
            error_type='INVALID_KEY',
            error_message='Invalid API key'
        )
        
        self.api_key.refresh_from_db()
        
        self.assertFalse(self.api_key.is_active)
    
    def test_record_failure_creates_failure_log(self):
        """Test that failures are logged for analytics."""
        self.engine.record_failure(
            instance=self.model_instance,
            error_type='SERVER_ERROR',
            error_message='500 Internal Server Error'
        )
        
        logs = FailureLog.objects.filter(model_instance=self.model_instance)
        
        self.assertEqual(logs.count(), 1)
        self.assertEqual(logs.first().error_type, 'SERVER_ERROR')
    
    def test_refresh_blocked_instances_unblocks_expired(self):
        """Test that expired blocks are removed."""
        # Block the instance with past expiry
        self.model_instance.is_blocked = True
        self.model_instance.block_until = timezone.now() - timedelta(minutes=5)
        self.model_instance.save()
        
        unblocked = self.engine.refresh_blocked_instances()
        
        self.model_instance.refresh_from_db()
        
        self.assertEqual(unblocked, 1)
        self.assertFalse(self.model_instance.is_blocked)
    
    def test_reset_daily_quotas_restores_quotas(self):
        """Test that daily quota reset restores all quotas."""
        self.model_instance.remaining_daily = 0
        self.model_instance.remaining_minute = 0
        self.model_instance.save()
        
        self.engine.reset_daily_quotas()
        
        self.model_instance.refresh_from_db()
        
        self.assertEqual(self.model_instance.remaining_daily, self.model_instance.daily_quota)
        self.assertEqual(self.model_instance.remaining_minute, self.model_instance.minute_quota)
    
    def test_error_classification(self):
        """Test automatic error classification from messages."""
        test_cases = [
            ('429 Too Many Requests', 'QUOTA_EXCEEDED'),
            ('Rate limit exceeded', 'RATE_LIMITED'),
            ('Invalid API key', 'INVALID_KEY'),
            ('Model not found', 'MODEL_NOT_FOUND'),
            ('Request timed out', 'TIMEOUT'),
            ('500 Internal Server Error', 'SERVER_ERROR'),
        ]
        
        for message, expected_type in test_cases:
            result = self.engine._classify_error(message, '')
            self.assertEqual(result, expected_type, f"Failed for message: {message}")
