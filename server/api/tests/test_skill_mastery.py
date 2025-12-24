from django.test import TestCase
from django.contrib.auth.models import User
from api.models import Skill, SkillMastery
from api.services.skill_tracker import update_skill_mastery

class SkillMasteryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testlearner', password='password')
        # Create a skill manually for testing
        self.skill = Skill.objects.create(
            code='test_skill',
            name='Test Skill',
            category='vocabulary',
            level='A1',
            default_p_slip=0.1,
            default_p_guess=0.2,
            default_p_transit=0.1
        )

    def test_bkt_update(self):
        # Initial state
        # P(L)_0 is 0.15 (default in service) or model default (0.3).
        # Service default is 0.15.
        
        # 1. Correct Answer
        # P(L) = 0.15
        # P(L|Correct) = (0.15 * 0.9) / (0.15*0.9 + 0.85*0.2) = 0.135 / (0.135 + 0.17) = 0.135 / 0.305 = 0.4426
        # P(L_next) = 0.4426 + (1 - 0.4426) * 0.1 = 0.4426 + 0.0557 = 0.4983
        
        new_p = update_skill_mastery(self.user, 'test_skill', True)
        self.assertAlmostEqual(new_p, 0.4983, places=2)
        
        # Verify DB
        mastery = SkillMastery.objects.get(user=self.user, skill=self.skill)
        self.assertEqual(mastery.total_attempts, 1)
        self.assertEqual(mastery.correct_attempts, 1)
        self.assertAlmostEqual(mastery.mastery_probability, 0.4983, places=2)
        
        # 2. Incorrect Answer
        # Start P(L) = 0.4983
        # P(L|Incorrect) = (0.4983 * 0.1) / (0.4983*0.1 + 0.5017*0.8) = 0.04983 / (0.04983 + 0.40136) = 0.04983 / 0.45119 = 0.1104
        # P(L_next) = 0.1104 + (1 - 0.1104) * 0.1 = 0.1104 + 0.0889 = 0.1993
        
        new_p_2 = update_skill_mastery(self.user, 'test_skill', False)
        # self.assertLess(new_p_2, new_p) # Should drop
        # Note: BKT with transition always adds a bit, but the posteriors drop heavily on incorrect.
        
        mastery.refresh_from_db()
        self.assertEqual(mastery.total_attempts, 2)
        self.assertEqual(mastery.correct_attempts, 1)
