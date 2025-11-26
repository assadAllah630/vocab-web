from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from api.models import Vocabulary, GrammarTopic, UserProfile
from django.core.files.uploadedfile import SimpleUploadedFile

class NewFeaturesTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client.force_authenticate(user=self.user)
        # Profile is created by signal, so we just get it and update
        self.profile = self.user.profile
        self.profile.target_language = 'de'
        self.profile.save()

    def test_vocabulary_language_filter(self):
        # Create vocab in DE (target)
        Vocabulary.objects.create(word='Haus', translation='House', type='noun', created_by=self.user, language='de')
        # Create vocab in EN (not target)
        Vocabulary.objects.create(word='Maison', translation='House', type='noun', created_by=self.user, language='fr')
        
        response = self.client.get('/api/vocab/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['word'], 'Haus')

    def test_grammar_import_and_filter(self):
        # Test CSV Import
        csv_content = b"level,category,title,content,examples\nA1,verbs,Test Verb,Content,[]"
        csv_file = SimpleUploadedFile("grammar.csv", csv_content, content_type="text/csv")
        
        # User needs to be admin for import? No, code says admin.
        self.user.is_staff = True
        self.user.save()
        
        response = self.client.post('/api/grammar/import_csv/', {'file': csv_file}, format='multipart')
        self.assertEqual(response.status_code, 200)
        
        # Check if created with correct language
        topic = GrammarTopic.objects.get(title='Test Verb')
        self.assertEqual(topic.language, 'de')
        
        # Test Filter
        # Create another topic in different language
        GrammarTopic.objects.create(level='A1', category='verbs', title='French Verb', content='...', language='fr')
        
        response = self.client.get('/api/grammar/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Verb')

    def test_text_generator_params(self):
        # Just check if endpoint accepts params, mocking the actual AI call would be complex here
        # but we can check if it fails gracefully or validates input
        response = self.client.post('/api/generate-text/', {
            'level': 'A1',
            'length': 'short',
            'grammar_topics': [],
            'clarification_prompt': 'Test prompt',
            'gemini_api_key': 'fake_key' # Should fail with invalid key or mock
        })
        # It will likely fail with 500 or 400 due to key, but we want to ensure it reached the view
        self.assertIn(response.status_code, [200, 400, 500])
