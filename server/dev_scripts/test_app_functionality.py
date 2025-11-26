"""
Comprehensive test script for the vocabulary learning application.
This script will test all major functionality and check for bugs.
"""
import requests
import json
from datetime import datetime

BASE_URL = 'http://localhost:8000/api'

class VocabAppTester:
    def __init__(self):
        self.session = requests.Session()
        self.user = None
        self.test_results = []
        
    def log_test(self, test_name, passed, message=""):
        status = "[PASS]" if passed else "[FAIL]"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        print(f"{status}: {test_name}")
        if message:
            print(f"  -> {message}")
    
    def test_signup(self):
        """Test user signup"""
        username = f"test_user_{datetime.now().timestamp()}"
        payload = {
            'username': username,
            'password': 'test_password',
            'email': f'{username}@test.com',
            'native_language': 'en',
            'target_language': 'es'
        }
        
        try:
            res = self.session.post(f'{BASE_URL}/auth/signup/', json=payload)
            if res.status_code == 201:
                self.user = res.json()
                self.log_test("Signup", True, f"Created user: {username}")
                return True
            else:
                self.log_test("Signup", False, f"Status: {res.status_code}, Response: {res.text}")
                return False
        except Exception as e:
            self.log_test("Signup", False, str(e))
            return False
    
    def test_login(self):
        """Test user login"""
        if not self.user:
            self.log_test("Login", False, "No user to login with")
            return False
            
        payload = {
            'username': self.user['username'],
            'password': 'test_password'
        }
        
        try:
            res = self.session.post(f'{BASE_URL}/auth/signin/', json=payload)
            if res.status_code == 200:
                self.log_test("Login", True)
                return True
            else:
                self.log_test("Login", False, f"Status: {res.status_code}")
                return False
        except Exception as e:
            self.log_test("Login", False, str(e))
            return False
    
    def test_user_statistics(self):
        """Test user statistics endpoint"""
        try:
            csrftoken = self.session.cookies.get('csrftoken')
            headers = {'X-CSRFToken': csrftoken}
            
            res = self.session.get(f'{BASE_URL}/stats/', headers=headers)
            if res.status_code == 200:
                stats = res.json()
                self.log_test("User Statistics", True, 
                             f"Streak: {stats.get('streak')}, Total Words: {stats.get('total_words')}")
                
                # Check if streak is 0 for new user
                if stats.get('streak') == 0:
                    self.log_test("Streak Calculation (New User)", True, "Streak is 0 as expected")
                else:
                    self.log_test("Streak Calculation (New User)", False, 
                                 f"Streak should be 0 but is {stats.get('streak')}")
                return True
            else:
                self.log_test("User Statistics", False, f"Status: {res.status_code}")
                return False
        except Exception as e:
            self.log_test("User Statistics", False, str(e))
            return False
    
    def test_add_word(self):
        """Test adding a vocabulary word"""
        try:
            csrftoken = self.session.cookies.get('csrftoken')
            headers = {'X-CSRFToken': csrftoken}
            
            payload = {
                'word': 'Hola',
                'translation': 'Hello',
                'type': 'phrase',
                'example': 'Hola, ¿cómo estás?',
                'tags': ['greeting', 'basic'],
                'is_public': False
            }
            
            res = self.session.post(f'{BASE_URL}/vocab/', json=payload, headers=headers)
            if res.status_code == 201:
                word_data = res.json()
                self.log_test("Add Word", True, f"Added word: {word_data.get('word')}")
                return word_data
            else:
                self.log_test("Add Word", False, f"Status: {res.status_code}, Response: {res.text}")
                return None
        except Exception as e:
            self.log_test("Add Word", False, str(e))
            return None
    
    def test_get_vocab_list(self):
        """Test getting vocabulary list"""
        try:
            csrftoken = self.session.cookies.get('csrftoken')
            headers = {'X-CSRFToken': csrftoken}
            
            res = self.session.get(f'{BASE_URL}/vocab/', headers=headers)
            if res.status_code == 200:
                vocab_list = res.json()
                self.log_test("Get Vocab List", True, f"Found {len(vocab_list)} words")
                return True
            else:
                self.log_test("Get Vocab List", False, f"Status: {res.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Vocab List", False, str(e))
            return False
    
    def test_profile(self):
        """Test getting user profile"""
        try:
            csrftoken = self.session.cookies.get('csrftoken')
            headers = {'X-CSRFToken': csrftoken}
            
            res = self.session.get(f'{BASE_URL}/profile/', headers=headers)
            if res.status_code == 200:
                profile = res.json()
                self.log_test("Get Profile", True, 
                             f"Native: {profile.get('native_language')}, Target: {profile.get('target_language')}")
                return True
            else:
                self.log_test("Get Profile", False, f"Status: {res.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Profile", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("VOCABULARY APP - COMPREHENSIVE TEST SUITE")
        print("="*60 + "\n")
        
        # Authentication Tests
        print("\n--- AUTHENTICATION TESTS ---")
        if not self.test_signup():
            print("\n⚠ Signup failed, cannot continue tests")
            return
        
        # Statistics Tests (before adding any data)
        print("\n--- STATISTICS TESTS (NEW USER) ---")
        self.test_user_statistics()
        
        # Vocabulary Tests
        print("\n--- VOCABULARY TESTS ---")
        self.test_add_word()
        self.test_get_vocab_list()
        
        # Profile Tests
        # print("\n--- PROFILE TESTS ---")
        # self.test_profile()
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        passed = sum(1 for r in self.test_results if r['passed'])
        total = len(self.test_results)
        print(f"\nTotal: {total} tests")
        print(f"Passed: {passed} ({passed/total*100:.1f}%)")
        print(f"Failed: {total-passed}")
        
        if total - passed > 0:
            print("\nFailed Tests:")
            for r in self.test_results:
                if not r['passed']:
                    print(f"  - {r['test']}: {r['message']}")

if __name__ == '__main__':
    tester = VocabAppTester()
    tester.run_all_tests()
