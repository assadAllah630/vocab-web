---
description: Create a new API endpoint in Django REST Framework
---

## Step 1: Define the Endpoint
Answer these questions:
1. URL pattern: `/api/...`
2. HTTP methods: GET, POST, PUT, DELETE?
3. Authentication required?
4. Input format
5. Output format

## Step 2: Create Serializer (if needed)
File: `server/api/serializers.py`

## Step 3: Create View
File: `server/api/views/<module>_views.py`

```python
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_endpoint(request):
    if request.method == 'GET':
        return Response({'data': []})
    elif request.method == 'POST':
        return Response({'success': True}, status=201)
```

## Step 4: Register URL
File: `server/api/urls.py`

## Step 5: Test the Endpoint
```bash
curl -X GET http://localhost:8000/api/my-endpoint/ \
  -H "Authorization: Token <token>"
```

## Step 6: Add to Frontend API Client
File: `client/src/api.js`

## Step 7: Write Tests
File: `server/api/tests/test_<module>.py`

## Hard Rules
- ❌ NEVER create endpoints without authentication (unless public)
- ❌ NEVER skip input validation
- ⚠️ Use `unified_ai` for AI-related endpoints
