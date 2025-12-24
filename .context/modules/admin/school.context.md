# Admin School Context

## Purpose
Teacher and classroom management across the platform.

---

## Pages (5)

| File | Purpose |
|------|---------|
| `AdminTeacherList.jsx` | All teachers overview |
| `AdminTeacherDetail.jsx` | Teacher profile admin |
| `AdminClassroomList.jsx` | All classrooms |
| `AdminClassroomDetail.jsx` | Classroom admin view |
| `AdminGlobalActivity.jsx` | Cross-school activity feed |

---

## Location
`admin-client/src/pages/school/`

---

## Features

### AdminTeacherList
- All verified teachers
- Application status
- Classroom count
- Student count

### AdminTeacherDetail
- Teacher profile
- Classrooms list
- Performance metrics
- Account actions

### AdminClassroomList
- All classrooms
- Filter by teacher/org
- Student counts
- Activity metrics

### AdminClassroomDetail
- Classroom overview
- Student list
- Assignment history
- Session recordings

### AdminGlobalActivity
- Platform-wide activity
- Teacher actions
- Student progress
- System events

---

## API Endpoints Used
- `GET /api/admin/teachers/`
- `GET /api/admin/classrooms/`
- `GET /api/admin/activity/`

---

*Version: 1.0 | Created: 2025-12-24*
