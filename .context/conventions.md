# VocabMaster Conventions

## Naming Standards

### Python/Django (Backend)

| Type | Convention | Example |
|------|------------|---------|
| Files | snake_case | `content_extraction_service.py` |
| Classes | PascalCase | `ContentExtractor` |
| Functions | snake_case | `extract_youtube_transcript()` |
| Variables | snake_case | `video_id` |
| Constants | UPPER_SNAKE | `MAX_TOKENS` |
| Models | PascalCase | `UserProfile` |
| Serializers | PascalCaseSerializer | `VocabularySerializer` |

### React/JavaScript (Frontend)

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.jsx | `MobileReader.jsx` |
| Pages | PascalCase.jsx | `Dashboard.jsx` |
| Utilities | camelCase.js | `api.js` |
| CSS | ComponentName.css | `AIGateway.css` |
| Hooks | useCamelCase | `useAuth` |
| Context | PascalCaseContext | `AuthContext` |

---

## Project Layout

### Backend (`server/`)

```
server/
├── api/
│   ├── models.py              # Django models
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # URL routing
│   ├── views/                 # View modules
│   ├── ai_gateway/            # AI orchestration
│   │   ├── adapters/          # Provider adapters
│   │   ├── services/          # Core services
│   │   └── models.py          # Gateway models
│   ├── *_service.py           # Business logic
│   ├── *_views.py             # API endpoints
│   └── *_agent.py             # LangGraph agents
└── vocab_server/              # Django settings
```

### Desktop Frontend (`client/src/`)

```
client/src/
├── components/                # Reusable UI
├── pages/                     # Page components
│   └── mobile/                # Mobile-specific pages
├── context/                   # React contexts
├── utils/                     # Utilities
├── api.js                     # API client
└── App.jsx                    # Main app
```

### Admin Panel (`admin-client/src/`)

```
admin-client/src/
├── components/                # Admin UI components
├── pages/                     # Admin pages
│   ├── analytics/             # Analytics views
│   ├── users/                 # User management
│   └── monitoring/            # System monitoring
└── api.js                     # Admin API client
```

---

## Code Standards

### Controllers/Views
- **Thin controllers**: No business logic
- Delegate to services immediately
- Handle only HTTP concerns

### Services
- **Business rules live here**
- May call other services
- Never import repositories from other domains

### Repositories
- **Data access only**
- No business rules
- Return domain objects, not DTOs

### Error Handling
- Never throw raw errors
- Use typed exceptions: `ContentExtractionError`, `AIGatewayError`
- Always include error context

---

## Git Workflow

### Branch Prefixes

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring |
| `chore/` | Maintenance tasks |
| `docs/` | Documentation |

### Commit Format

```
type(scope): short message

Examples:
feat(ai_gateway): add Groq adapter
fix(reader): handle YouTube transcript errors
refactor(auth): extract OAuth logic to service
```

---

## Testing Requirements

| Type | Requirement | Coverage |
|------|-------------|----------|
| Unit | Mandatory for services | 80%+ |
| Integration | Multi-system flows | Critical paths |
| E2E | Login, payment, AI | Core features |

---

## Comments

- Write **WHY**, not WHAT
- Document design decisions in module context files
- API endpoints require docstrings

---

*Version: 1.0 | Created: 2025-12-10*
