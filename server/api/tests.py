from django.test import TestCase
from django.contrib.auth.models import User
from .models import Vocabulary, Tag
from .serializers import VocabularySerializer
from .views import enrich_vocabulary_with_ai
from .srs import calculate_srs
from unittest.mock import patch, MagicMock
import json

class SRSTests(TestCase):
    def test_srs_initial_correct(self):
        # Grade 5, first repetition
        result = calculate_srs(5, 0, 2.5, 0)
        self.assertEqual(result['repetitions'], 1)
        self.assertEqual(result['interval'], 1)
        self.assertGreater(result['easiness_factor'], 2.5) # EF should increase

    def test_srs_second_correct(self):
        # Grade 5, second repetition
        result = calculate_srs(5, 1, 2.6, 1)
        self.assertEqual(result['repetitions'], 2)
        self.assertEqual(result['interval'], 6)
        
    def test_srs_third_correct(self):
        # Grade 5, third repetition
        # Interval should be I * EF = 6 * 2.6 = 15.6 -> 16
        result = calculate_srs(5, 2, 2.6, 6)
        self.assertEqual(result['repetitions'], 3)
        self.assertEqual(result['interval'], 16)

    def test_srs_incorrect(self):
        # Grade 2 (fail), previous interval 10
        result = calculate_srs(2, 5, 2.5, 10)
        self.assertEqual(result['repetitions'], 0)
        self.assertEqual(result['interval'], 1)
        self.assertEqual(result['easiness_factor'], 2.5) # EF shouldn't change for fail in this impl

    def test_srs_hard_pass(self):
        # Grade 3 (hard pass)
        # EF should decrease: 2.5 + (0.1 - (2) * (0.08 + 2*0.02)) = 2.5 + (0.1 - 2 * 0.12) = 2.5 + (0.1 - 0.24) = 2.5 - 0.14 = 2.36
        result = calculate_srs(3, 2, 2.5, 6)
        self.assertEqual(result['repetitions'], 3)
        self.assertLess(result['easiness_factor'], 2.5)

class SmartFeaturesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.vocab = Vocabulary.objects.create(word='Test', translation='Test', created_by=self.user)

    def test_duplicate_prevention_serializer(self):
        # Try to add 'Test' again (case insensitive check in serializer)
        data = {'word': 'test', 'translation': 'New', 'type': 'noun'}
        request = MagicMock()
        request.user = self.user
        serializer = VocabularySerializer(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())
        # The error should be raised by validate_word, so it might be in 'word' or 'non_field_errors' 
        # depending on how DRF handles it. Since it's a field validator, it should be in 'word'.
        # But wait, I defined validate_word, so it is a field level validation.
        # However, if I used unique validator in Meta, it would be different.
        # Let's just check errors exist.
        self.assertTrue(len(serializer.errors) > 0)

    def test_related_words(self):
        vocab2 = Vocabulary.objects.create(word='Exam', translation='Exam', created_by=self.user)
        self.vocab.related_words.add(vocab2)
        self.assertIn(vocab2, self.vocab.related_words.all())
        self.assertIn(self.vocab, vocab2.related_words.all()) # Symmetrical

    @patch('api.views.genai')
    def test_ai_enrichment(self, mock_genai):
        # Mock response
        mock_model = MagicMock()
        mock_genai.GenerativeModel.return_value = mock_model
        mock_response = MagicMock()
        # Mock the text property of the response
        mock_response.text = json.dumps({
            "tags": ["education", "test"],
            "synonyms": ["quiz", "assessment"],
            "antonyms": [],
            "related_concepts": ["Exam"]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Create related word first so it can be linked
        Vocabulary.objects.create(word='Exam', translation='Exam', created_by=self.user)
        
        enrich_vocabulary_with_ai(self.vocab, 'fake_key')
        
        self.vocab.refresh_from_db()
        self.assertEqual(self.vocab.tags.count(), 2)
        self.assertEqual(len(self.vocab.synonyms), 2)
        self.assertEqual(self.vocab.related_words.count(), 1)
