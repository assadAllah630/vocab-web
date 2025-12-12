# Test Workflow

> Workflow for writing tests for VocabMaster features.

## Context to Load
```
@context: .context/modules/backend/<module>.context.md
```

---

## Step 1: Identify What to Test

| Test Type | When to Use | File Pattern |
|-----------|-------------|--------------|
| Unit Test | Single function/class | `test_<feature>.py` |
| API Test | Endpoint behavior | `test_<module>_api.py` |
| Integration | Multi-component flow | `test_<flow>.py` |

---

## Step 2: Create Test File

File: `server/api/tests/test_<feature>.py`

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class MyFeatureTestCase(TestCase):
    """Tests for <feature> functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        """Clean up after tests."""
        pass
```

---

## Step 3: Write Test Cases

### Success Case
```python
def test_feature_success(self):
    """Test that feature works correctly."""
    response = self.client.post('/api/endpoint/', {
        'field1': 'value1',
        'field2': 'value2'
    })
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertIn('id', response.data)
```

### Failure Case
```python
def test_feature_invalid_input(self):
    """Test that invalid input returns error."""
    response = self.client.post('/api/endpoint/', {
        'field1': ''  # Empty = invalid
    })
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
```

### Authentication Case
```python
def test_feature_unauthenticated(self):
    """Test that unauthenticated request is rejected."""
    self.client.logout()
    response = self.client.get('/api/endpoint/')
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

### Edge Case
```python
def test_feature_empty_list(self):
    """Test behavior with empty data."""
    response = self.client.get('/api/endpoint/')
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data['results'], [])
```

---

## Step 4: Test AI Features (Mock)

```python
from unittest.mock import patch, MagicMock

@patch('api.unified_ai.generate_ai_content')
def test_ai_generation(self, mock_ai):
    """Test AI content generation."""
    mock_ai.return_value = {
        'success': True,
        'content': 'Generated content here'
    }
    
    response = self.client.post('/api/generate/', {
        'prompt': 'Test prompt'
    })
    
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    mock_ai.assert_called_once()
```

---

## Step 5: Run Tests

```bash
# Run all tests
python manage.py test

# Run specific file
python manage.py test api.tests.test_feature

# Run with coverage
coverage run manage.py test
coverage report
```

---

## Test Coverage Targets

| Component | Minimum Coverage |
|-----------|------------------|
| Views | 80% |
| Services | 90% |
| Models | 70% |
| Serializers | 70% |

---

## Hard Rules

- ❌ NEVER skip authentication tests
- ❌ NEVER test with real AI API calls (mock them)
- ⚠️ Always test both success and failure cases
- ⚠️ Always clean up test data in tearDown
