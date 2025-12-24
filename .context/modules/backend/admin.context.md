# Admin Backend Module Context

## Purpose
Backend-only admin infrastructure (separate from admin-client frontend).

---

## Key Files

| File | Size | Purpose |
|------|------|---------|
| `admin.py` | 2KB | Django admin registration |
| `admin_models.py` | 6KB | Admin-specific models |
| `admin_views.py` | 22KB | Admin API endpoints |
| `admin_urls.py` | 3KB | Admin URL routing |
| `admin_permissions.py` | 5KB | Permission classes |

---

## Admin Models
See `admin_models.py`:

- **AdminSettings** - Platform configuration
- **AuditLog** - Action logging
- **SystemMetric** - Performance metrics

---

## Admin Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/admin/activity/` | Global activity feed |
| `/admin/users/` | User management |
| `/admin/analytics/` | Platform analytics |
| `/admin/system/` | System health |

---

## Permissions

| Class | Purpose |
|-------|---------|
| `IsSuperAdmin` | Superuser only |
| `IsStaffOrAdmin` | Staff + admin |
| `IsSchoolAdmin` | Organization admin |

---

*Version: 1.1 | Updated: 2025-12-24*
