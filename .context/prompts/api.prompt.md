# API Endpoint Workflow

> Workflow for adding a new API endpoint to VocabMaster.

## Context to Load
```
@context: .context/modules/backend/<relevant-module>.context.md
@context: .context/architecture.md
```

---

## Step 1: Define the Endpoint

Answer these questions:
1. **URL pattern**: `/api/...`
2. **HTTP methods**: GET, POST, PUT, DELETE?
3. **Authentication**: Required? Which users?
4. **Input**: Request body / query params?
5. **Output**: Response format?

---

## Step 2: Create Serializer (if needed)

File: `server/api/serializers.py`

```python
class MyNewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = ['id', 'field1', 'field2']
```

---

## Step 3: Create View

File: `server/api/views/<module>_views.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_new_endpoint(request):
    if request.method == 'GET':
        # Handle GET
        return Response({'data': []})
    
    elif request.method == 'POST':
        # Handle POST
        return Response({'success': True}, status=201)
```

---

## Step 4: Register URL

File: `server/api/urls.py`

```python
path('my-endpoint/', views.my_new_endpoint, name='my-endpoint'),
```

---

## Step 5: Test the Endpoint

```bash
# Start server
python manage.py runserver

# Test with curl
curl -X GET http://localhost:8000/api/my-endpoint/ \
  -H "Authorization: Token <your-token>"
```

---

## Step 6: Add to Frontend API Client

File: `client/src/api.js`

```javascript
export const myNewEndpoint = {
  get: () => api.get('/my-endpoint/'),
  create: (data) => api.post('/my-endpoint/', data),
};
```

---

## Step 7: Write Tests

File: `server/api/tests/test_<module>.py`

```python
def test_my_endpoint_success(self):
    response = self.client.get('/api/my-endpoint/')
    self.assertEqual(response.status_code, 200)

def test_my_endpoint_unauthorized(self):
    self.client.logout()
    response = self.client.get('/api/my-endpoint/')
    self.assertEqual(response.status_code, 401)
```

---

## Hard Rules

- ❌ NEVER create endpoints without authentication (unless public)
- ❌ NEVER skip input validation
- ⚠️ Always add rate limiting for expensive operations
- ⚠️ Use `unified_ai` for any AI-related endpoints
