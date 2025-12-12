# Feature Development Workflow

## Context Loading

Load these files before starting:
1. `.context/architecture.md` (if cross-cutting)
2. **Backend work**: `.context/modules/backend/<module>.context.md`
3. **Frontend work**: `.context/modules/frontend/<area>.context.md`
4. **Mobile work**: `.context/modules/mobile/<area>.context.md`
5. **Admin work**: `.context/modules/admin/<area>.context.md`
6. `.context/conventions.md` (for standards)

---

## Pre-Implementation Checklist

- [ ] Understand the feature requirements
- [ ] Check architecture impact
- [ ] Identify affected modules
- [ ] Plan the implementation approach
- [ ] Update architecture.md if cross-cutting

---

## Implementation Steps

### 1. Create Feature Branch

```bash
git checkout -b feat/<module>-<feature-name>
```

### 2. Implement Service Layer

```python
# server/api/<module>_service.py or in existing service
def new_feature_function(...):
    """Implement business logic here."""
    pass
```

- Services contain business rules
- Services can call other services (same domain)
- Never call repositories from other domains

### 3. Implement Repository (if needed)

```python
# Data access only, no business logic
def get_feature_data(...):
    return Model.objects.filter(...)
```

### 4. Implement Controller/Views

```python
# server/api/<module>_views.py
@api_view(['POST'])
def feature_endpoint(request):
    # Thin controller - delegate to service
    result = service.new_feature_function(request.data)
    return Response(result)
```

### 5. Add URL Route

```python
# server/api/urls.py
path('feature/', views.feature_endpoint, name='feature'),
```

### 6. Write Tests

```python
# server/api/tests/test_<feature>.py
def test_feature_success():
    ...

def test_feature_validation_error():
    ...
```

### 7. Update Frontend (if needed)

- Add API call in `api.js`
- Create/update page component
- Add route in `App.jsx`

---

## Post-Implementation

- [ ] Update module context file with decisions
- [ ] Add migration + rollback if schema changed
- [ ] Run all tests
- [ ] Create PR with proper message

### Commit Format

```
feat(<module>): short description

- Added <feature>
- Updated module context
```

---

## Hard Rules

- ❌ No merge without tests
- ❌ No cross-domain repository calls
- ❌ Update context files before merge
