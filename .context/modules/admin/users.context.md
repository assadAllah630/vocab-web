# Admin Users Context

## Purpose
User and teacher management for platform administrators.

---

## Pages (5)

| File | Purpose |
|------|---------|
| `UserList.jsx` | All users table with search/filter |
| `UserDetail.jsx` | Single user admin view |
| `UserSheet.jsx` | Quick user info slide-over |
| `EnhancedUserManagement.jsx` | Advanced bulk operations |
| `TeacherApplicationsList.jsx` | Teacher application review |

---

## Location
`admin-client/src/pages/users/`

---

## Features

### UserList
- Search by name/email
- Filter by status, role
- Bulk actions (ban, promote)
- Pagination

### UserDetail
- Profile info
- Activity history
- API key management
- Account actions

### TeacherApplicationsList
- Pending applications
- Review queue
- Approve/Reject actions
- Application details modal

---

## API Endpoints Used
- `GET /api/admin/users/`
- `GET/PUT /api/admin/users/<id>/`
- `GET /api/teachers/admin/applications/`
- `POST /api/teachers/admin/applications/<id>/approve/`

---

*Version: 1.1 | Updated: 2025-12-24*
