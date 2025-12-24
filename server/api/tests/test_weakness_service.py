from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from api.models import Skill, SkillMastery, Vocabulary, LearningEvent
from api.services.weakness.service import WeaknessService

class WeaknessServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='weakhunter', password='pw')
        self.service = WeaknessService()
        
        # Setup Skill
        self.skill = Skill.objects.create(
            code='test_skill_w', 
            name='Test Skill W', 
            category='grammar'
        )
        
        # Setup Word
        self.word = Vocabulary.objects.create(
            word='Mistake', 
            translation='Fehler', 
            type='noun', 
            created_by=self.user
        )

    def test_low_mastery_detection(self):
        # Create low mastery scenario (0.3 < 0.4 threshold) with enough attempts
        SkillMastery.objects.create(
            user=self.user,
            skill=self.skill,
            mastery_probability=0.3,
            total_attempts=10,
            correct_attempts=3
        )
        
        result = self.service.detect_weaknesses(self.user)
        self.assertEqual(result['count'], 1)
        self.assertEqual(result['items'][0]['type'], 'low_mastery')
        self.assertEqual(result['items'][0]['metadata']['skill_code'], 'test_skill_w')

    def test_error_pattern_detection(self):
        # Create repeated error pattern
        for _ in range(3):
            LearningEvent.objects.create(
                user=self.user,
                event_type='word_incorrect',
                context={'word_id': self.word.id}
            )
            
        result = self.service.detect_weaknesses(self.user)
        # Should persist due to caching? No, user_id is diff from first test due to TestCase isolation 
        # But wait, self.service uses cache. We should invalidate or use separate users.
        # TestCase usually clears DB but Redis/LocalMem cache might persist?
        # Let's invalidate first.
        self.service.invalidate_cache(self.user)
        
        result = self.service.detect_weaknesses(self.user)
        
        # We might have LowMastery from previous setup? No, setUp runs fresh DB transaction.
        # So we only have error pattern now.
        
        # Find error_pattern in results
        types = [item['type'] for item in result['items']]
        self.assertIn('error_pattern', types)
        
    def test_decay_detection(self):
        # Create decay scenario: High mastery, old practice
        SkillMastery.objects.create(
            user=self.user,
            skill=self.skill,
            mastery_probability=0.9,
            total_attempts=20,
            last_practiced=timezone.now() - timedelta(days=30)
        )
        
        self.service.invalidate_cache(self.user)
        result = self.service.detect_weaknesses(self.user)
        
        types = [item['type'] for item in result['items']]
        self.assertIn('decay', types)
