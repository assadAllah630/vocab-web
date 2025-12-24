from django.test import TestCase
from django.contrib.auth.models import User
from api.models import Classroom, ClassMembership, Teacher, LearningPath, PathSubLevel, PathNode, PathEnrollment, NodeProgress, UserProfile
from rest_framework.test import APIClient
from rest_framework import status

class PathStatsTest(TestCase):
    def setUp(self):
        # Users
        self.teacher_user = User.objects.create_user(username='teacher', password='password')
        # Check if profile exists (signals might have created it), else create
        if not UserProfile.objects.filter(user=self.teacher_user).exists():
             UserProfile.objects.create(user=self.teacher_user)
        
        self.teacher = Teacher.objects.create(user=self.teacher_user)
        
        self.student = User.objects.create_user(username='student', password='password')
        if not UserProfile.objects.filter(user=self.student).exists():
             UserProfile.objects.create(user=self.student)
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.teacher_user)
        
        # Path System
        self.path = LearningPath.objects.create(
            title="German A1",
            speaking_language='en',
            target_language='de'
        )
        self.sl1 = PathSubLevel.objects.create(path=self.path, title="Intro", level_code="A1", sublevel_code="A1.1", order=1)
        self.node1 = PathNode.objects.create(sublevel=self.sl1, title="Node 1", order=1)
        self.node2 = PathNode.objects.create(sublevel=self.sl1, title="Node 2", order=2)
        
        # Classroom
        self.classroom = Classroom.objects.create(
            teacher=self.teacher,
            name="German 101",
            speaking_language='en',
            target_language='de',
            current_sublevel=self.sl1,
            invite_code='123456'
        )
        
        # Enrollment
        self.membership = ClassMembership.objects.create(
            classroom=self.classroom,
            student=self.student,
            status='active'
        )
        
        # Path Enrollment + Progress
        self.path_enrollment = PathEnrollment.objects.create(path=self.path, student=self.student)
        NodeProgress.objects.create(enrollment=self.path_enrollment, node=self.node1, status='completed')
        # Student has unlocked Node 2
        NodeProgress.objects.create(enrollment=self.path_enrollment, node=self.node2, status='available')

    def test_path_stats(self):
        try:
            response = self.client.get(f'/api/classrooms/{self.classroom.id}/path_stats/')
            
            # Print for debug if failed
            if response.status_code != 200:
                print(response.data)
                
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.data
            
            self.assertTrue(data['has_path'])
            self.assertEqual(data['total_nodes'], 2)
            self.assertEqual(data['student_count'], 1)
            
            # Student completed 1/2 nodes = 50%
            self.assertEqual(data['class_average'], 50)
            
            s_stats = data['students'][0]
            self.assertEqual(s_stats['name'], 'student')
            self.assertEqual(s_stats['progress_percent'], 50)
            self.assertEqual(s_stats['completed_nodes'], 1)
            self.assertEqual(s_stats['current_sublevel'], 'A1.1')
            self.assertEqual(s_stats['current_node'], 'Node 2') # Should point to available node
        except Exception as e:
            with open('debug_error.txt', 'w') as f:
                import traceback
                f.write(str(e) + "\n")
                traceback.print_exc(file=f)
            raise e
