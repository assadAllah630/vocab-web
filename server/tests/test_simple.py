from django.test import TestCase
from django.contrib.auth.models import User

class SimpleTest(TestCase):
    def test_user_creation(self):
        try:
            u = User.objects.create_user(username='simpletest', password='password')
            print("User created successfully")
        except Exception as e:
            print(f"SIMPLE ERROR: {e}")
            raise e
