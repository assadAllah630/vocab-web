# Admin Monitoring Context

## Purpose
System health, logs, and AI Gateway monitoring for administrators.

---

## Pages (4)

| File | Purpose |
|------|---------|
| `SystemHealth.jsx` | Server status, uptime, resources |
| `AIGateway.jsx` | AI provider health, circuit breakers |
| `ErrorLogs.jsx` | Application error tracking |
| `AuditLogs.jsx` | User action audit trail |

---

## Location
`admin-client/src/pages/monitoring/`

---

## Features

### SystemHealth
- Server uptime
- Memory/CPU usage
- Database connections
- Redis status
- Background job queue

### AIGateway
- Provider status cards
- Health scores
- Request/error rates
- Quota usage
- Circuit breaker states

### ErrorLogs
- Exception tracking
- Stack traces
- User context
- Frequency analysis

### AuditLogs
- User actions
- Admin operations
- Login history
- Data changes

---

## API Endpoints Used
- `GET /api/system/health/`
- `GET /api/ai-gateway/status/`
- `GET /api/admin/errors/`
- `GET /api/admin/audit/`

---

*Version: 1.1 | Updated: 2025-12-24*
