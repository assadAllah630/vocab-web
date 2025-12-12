# Admin Users Module Context

## Purpose

User management pages:
- User list
- User details
- Role management
- Bulk operations

---

## Key Pages

Location: `admin-client/src/pages/users/`

### User List
- `UserList.jsx` - Browse all users
- Search & filter
- Pagination

### User Details
- `UserDetails.jsx` - View user info
- Activity history
- Statistics

### User Edit
- `UserEdit.jsx` - Edit user data
- Ban/unban
- Reset password

### Roles
- `Roles.jsx` - Role management
- Permission assignment

---

## Backend

- [admin_views.py](file:///e:/vocab_web/server/api/admin_views.py) - 22KB
- [admin_permissions.py](file:///e:/vocab_web/server/api/admin_permissions.py) - 5KB
- [bulk_user_views.py](file:///e:/vocab_web/server/api/bulk_user_views.py) - 8KB

---

## Permissions

| Role | Capabilities |
|------|--------------|
| Superuser | Full access |
| Staff | User view, analytics |
| Moderator | Content only |

---

*Version: 1.0 | Created: 2025-12-10*
