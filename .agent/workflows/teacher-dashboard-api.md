---
description: Create Teacher Dashboard API endpoints for stats, activity, and student insights
---

# Teacher Dashboard API

## Prerequisites
- `/assignment-api` ✅

## Create `views/teacher_dashboard_views.py`

### Endpoints

**1. `dashboard_overview(request)`**
Returns: classroom_count, total_students, pending_requests, pending_grading, new_submissions_week

**2. `classroom_stats(request, classroom_id)`**
Returns: student_count, assignment_count, completion_rate, average_score

**3. `recent_activity(request)`**
Returns: list of recent submissions and joins, sorted by timestamp

**4. `student_performance(request, classroom_id, student_id)`**
Returns: average_score, completed, total_assignments, completion_rate, assignments list

## URLs
```python
path('teacher/dashboard/', dashboard_overview),
path('teacher/classrooms/<int:id>/stats/', classroom_stats),
path('teacher/activity/', recent_activity),
path('teacher/classrooms/<int:cid>/students/<int:sid>/performance/', student_performance),
```

## All require `IsAuthenticated, IsTeacher` permissions

## Next → `/assignment-frontend-teacher`
