from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from api.agents.student_insights import run_student_insights

class InsightAgentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='insightlearner', password='pw')

    @patch('api.agents.student_insights.generate_ai_content')
    def test_run_insights(self, mock_ai):
        # Mock AI responses
        # First call (Draft)
        mock_response_1 = MagicMock()
        mock_response_1.text = "Analysis: Student is doing well but needs to focus on grammar."
        
        # Second call (Refine)
        mock_response_2 = MagicMock()
        mock_response_2.text = '{"insights": [{"title": "Good Job", "body": "Keep going!", "type": "praise"}]}'
        
        mock_ai.side_effect = [mock_response_1, mock_response_2]
        
        # Run agent
        result = run_student_insights(self.user.id)
        
        # Verify result structure
        self.assertIn('insights', result)
        self.assertEqual(len(result['insights']), 1)
        self.assertEqual(result['insights'][0]['title'], 'Good Job')
        
        # Verify AI was called twice (Gather->Draft, Draft->Refine calls AI in Draft and Refine nodes)
        # Note: Gather doesn't call AI. Draft calls AI. Refine calls AI.
        self.assertEqual(mock_ai.call_count, 2)
