# Infrastructure Module Context

## Purpose

Cross-cutting infrastructure concerns:
- Middleware pipeline
- Rate limiting
- Security middleware
- Error handling
- Caching

---

## Middleware Chain

```
Request → SecurityMiddleware → RateLimitMiddleware → AuthMiddleware → View → Response
```

---

## Key Files

- [middleware.py](file:///e:/vocab_web/server/api/middleware.py) - Request/Response middleware
- [security_middleware.py](file:///e:/vocab_web/server/api/security_middleware.py) - Security layer
- [rate_limiting.py](file:///e:/vocab_web/server/api/rate_limiting.py) - Rate limits
- [pagination.py](file:///e:/vocab_web/server/api/pagination.py) - API pagination
- [email_utils.py](file:///e:/vocab_web/server/api/email_utils.py) - Gmail OTP

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| AI Generation | 10/min | User |
| Auth | 5/min | IP |
| General API | 100/min | User |

---

## Security Features

- CORS configuration
- CSRF protection
- Input sanitization
- Secret key rotation

---

*Version: 1.0 | Created: 2025-12-10*
