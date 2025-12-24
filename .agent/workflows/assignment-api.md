---
description: Create Assignment CRUD and management API endpoints
---

# Assignment API

## Prerequisites
- `/assignment-models` ✅

## Create `views/assignment_views.py`

### ViewSet
```python
class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Teachers: their classroom assignments
        # Students: enrolled classroom assignments
    
    def perform_create(self, serializer):
        # Verify teacher owns classroom
        serializer.save(created_by=self.request.user)
```

### Functions
- `start_assignment(request, assignment_id)` - Student starts, creates progress
- `submit_assignment(request, assignment_id)` - Student submits
- `grade_assignment(request, progress_id)` - Teacher grades

## URLs
```python
router.register(r'assignments', AssignmentViewSet, basename='assignment')
path('assignments/<int:id>/start/', start_assignment),
path('assignments/<int:id>/submit/', submit_assignment),
path('assignments/progress/<int:id>/grade/', grade_assignment),
```

## Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/assignments/` | GET/POST | List/Create |
| `/api/assignments/{id}/` | GET/PUT/DELETE | CRUD |
| `/api/assignments/{id}/start/` | POST | Student starts |
| `/api/assignments/{id}/submit/` | POST | Student submits |
| `/api/assignments/progress/{id}/grade/` | POST | Teacher grades |

## Next → `/teacher-dashboard-api`
