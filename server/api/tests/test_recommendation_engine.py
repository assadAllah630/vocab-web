from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from api.models import Assignment, AssignmentProgress, Classroom, Teacher, Skill
from api.services.recommendations.engine import RecommendationEngine

class RecommendationEngineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='rectest', password='pw')
        self.teacher = Teacher.objects.create(user=User.objects.create_user(username='teacher', password='pw'))
        self.classroom = Classroom.objects.create(name='Test Class', teacher=self.teacher)
        self.engine = RecommendationEngine()

    def test_overdue_assignment_priority(self):
        # Create overdue assignment
        assign = Assignment.objects.create(
            classroom=self.classroom,
            title="Overdue Homework",
            due_date=timezone.now() - timedelta(days=1),
            created_by=self.teacher.user
        )
        AssignmentProgress.objects.create(assignment=assign, student=self.user, status='not_started')
        
        recs = self.engine.get_recommendations(self.user)
        
        self.assertTrue(len(recs) > 0)
        top_rec = recs[0]
        self.assertEqual(top_rec['type'], 'assignment')
        self.assertEqual(top_rec['priority'], 5)
        self.assertIn('Overdue', top_rec['title'])
