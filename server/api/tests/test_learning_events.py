from django.test import TestCase
from django.contrib.auth.models import User
from api.models import LearningEvent, Vocabulary
from api.services.learning_events import log_word_practice, aggregate_daily_stats

class LearningEventTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='teststudent', password='password')
        self.vocab = Vocabulary.objects.create(
            word='TestWord', 
            translation='TestTranslation', 
            type='noun',
            created_by=self.user
        )

    def test_log_word_practice(self):
        # Log a correct practice
        log_word_practice(self.user, self.vocab.id, True)
        
        # Log an incorrect practice
        log_word_practice(self.user, self.vocab.id, False)
        
        # Verify events
        events = LearningEvent.objects.filter(user=self.user)
        self.assertEqual(events.count(), 2)
        
        correct_event = events.filter(event_type='word_correct').first()
        self.assertIsNotNone(correct_event)
        self.assertEqual(correct_event.context['word_id'], self.vocab.id)
        
        incorrect_event = events.filter(event_type='word_incorrect').first()
        self.assertIsNotNone(incorrect_event)

    def test_aggregation(self):
        # Create some events
        log_word_practice(self.user, self.vocab.id, True)
        log_word_practice(self.user, self.vocab.id, True)
        log_word_practice(self.user, self.vocab.id, False)
        
        stats = aggregate_daily_stats(self.user.id)
        
        self.assertEqual(stats['words_practiced'], 3)
        self.assertEqual(stats['word_accuracy'], 66.7)
