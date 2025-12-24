# Frontend Classroom Module Context

## Purpose
Pages for Teacher and Student classroom management, including dashboards and session views.

---

## Key Pages

### ClassroomDetail
- [ClassroomDetail.jsx](file:///e:/vocab_web/client/src/pages/ClassroomDetail.jsx) ~13KB
  - Overview for enrolled students.
  - Linked path progress.
  - Assignment list.
  - Join via invite code.

### TeacherDashboard
- [TeacherDashboard.jsx](file:///e:/vocab_web/client/src/pages/TeacherDashboard.jsx) ~16KB
  - Teacher's main view.
  - Stats cards (students, sessions, completion).
  - Quick actions (Create Session, Create Assignment).
  - Recent activity feed.

### Session Pages
- [CreateSession.jsx](file:///e:/vocab_web/client/src/pages/CreateSession.jsx) ~20KB
  - Session creation form.
  - Date/Time picker.
  - Linked path selection.
- [SessionDetail.jsx](file:///e:/vocab_web/client/src/pages/SessionDetail.jsx) ~25KB
  - Pre-session: Agenda, materials.
  - Live: Join button → VideoRoom.
  - Post: Recording, attendance.

---

## API Integration

```javascript
// Get teacher classrooms
const { data } = await api.get('/classrooms/?role=teacher');

// Create live session
await api.post('/sessions/', {
  classroom_id: 1,
  title: 'Lesson 5',
  scheduled_time: '2025-01-01T10:00:00Z'
});
```

---

*Version: 1.0 | Created: 2025-12-24*
