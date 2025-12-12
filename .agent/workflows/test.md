---
description: Write tests for VocabMaster features
---

## Step 1: Identify What to Test
| Type | File Pattern |
|------|--------------|
| Unit Test | `test_<feature>.py` |
| API Test | `test_<module>_api.py` |
| Integration | `test_<flow>.py` |

## Step 2: Create Test File
File: `server/api/tests/test_<feature>.py`

```python
from django.test import TestCase
from rest_framework.test import APIClient

class MyFeatureTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(...)
        self.client.force_authenticate(user=self.user)
```

## Step 3: Write Test Cases

### Success Case
```python
def test_feature_success(self):
    response = self.client.post('/api/endpoint/', {...})
    self.assertEqual(response.status_code, 201)
```

### Failure Case
```python
def test_feature_invalid_input(self):
    response = self.client.post('/api/endpoint/', {})
    self.assertEqual(response.status_code, 400)
```

### Auth Case
```python
def test_feature_unauthenticated(self):
    self.client.logout()
    response = self.client.get('/api/endpoint/')
    self.assertEqual(response.status_code, 401)
```

## Step 4: Mock AI Features
```python
@patch('api.unified_ai.generate_ai_content')
def test_ai_generation(self, mock_ai):
    mock_ai.return_value = {'success': True, 'content': '...'}
```

## Step 5: Run Tests
```bash
python manage.py test api.tests.test_feature
```

## Hard Rules
- ❌ NEVER test with real AI API calls (mock them)
- ⚠️ Always test success AND failure cases
