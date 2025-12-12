# VocabMaster Architecture

## Stack Overview

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.10+ / Django 4.x / Django REST Framework / LangGraph |
| **Desktop Frontend** | React 18 / Vite / TailwindCSS |
| **Mobile Frontend** | React 18 / Vite / TailwindCSS (32 pages) |
| **Admin Panel** | React 18 (18 pages) |
| **Database** | PostgreSQL (prod) / SQLite (dev) |
| **Cache** | Redis (TTL-based, namespaced) |
| **AI Providers** | Gemini, OpenRouter, HuggingFace, Groq, Cohere, DeepInfra, Pollinations |
| **Auth** | Token-based + Google OAuth |

---

## Domain Boundaries

```mermaid
graph TB
    subgraph "Frontend Apps"
        FA[📱 Mobile - 32 pages]
        FB[🖥️ Desktop - 28 pages]
        FC[👨‍💼 Admin - 18 pages]
    end
    
    subgraph "Core Domains"
        AUTH[/auth - Users & OAuth]
        VOCAB[/vocabulary - Words & SRS]
        GATEWAY[/ai_gateway - AI Hub]
    end
    
    subgraph "Feature Domains"
        CONTENT[/content - Stories & Dialogues]
        EXAMS[/exams - Exam Generation]
        READER[/reader - Smart Reader]
        GAMES[/games - Practice & Games]
    end
    
    subgraph "Support Domains"
        TTS[/tts - Text-to-Speech]
        NOTIFY[/notifications - Push Alerts]
        SEARCH[/semantic_search - Embeddings]
    end
    
    subgraph "Admin Domain"
        ADMIN[/admin - Panel & Analytics]
    end
    
    FA --> AUTH
    FB --> AUTH
    FC --> ADMIN
    CONTENT --> GATEWAY
    EXAMS --> GATEWAY
    READER --> GATEWAY
    GAMES --> VOCAB
    SEARCH --> VOCAB
```

**Rules:**
- No domain may call another domain's repository layer
- Inter-domain communication via services or events only
- Shared utilities in `/shared` only (no business logic)

---

## Request Lifecycle

```
Client → API Gateway → Rate Limit → Auth → Controller → Validation → Service → Repository → (DB/Cache/AI) → Response DTO
```

**Validation Flow:**
1. Reject malformed payloads before business logic
2. Services may use other services, not cross-domain repos
3. Repositories: pure data-access, zero business rules

---

## AI Subsystem

### Text Generation (6 Adapters)

| Provider | Model | Rate Limit | Fallback Priority |
|----------|-------|------------|-------------------|
| Gemini | gemini-2.5-flash | 500/day | 1 |
| OpenRouter | mistral-7b | varies | 2 |
| HuggingFace | various | 1000/day | 3 |
| Groq | llama-3 | fast | 4 |
| Cohere | command | limited | 5 |
| DeepInfra | various | limited | 6 |

### Image Generation (4 Adapters)

| Provider | Free Tier | Priority |
|----------|-----------|----------|
| Pollinations | ✅ UNLIMITED | 1 |
| Gemini | 500/day | 2 |
| HuggingFace SD | 1000/day | 3 |
| OpenRouter | varies | 4 |

### AI Flow

```
Request → KeySelector (health-based) → Adapter → CircuitBreaker → Response
       ↓ on failure
    Fallback to next provider
```

**Services:**
- `KeySelector`: Chooses best provider by health score
- `CircuitBreaker`: Prevents cascading failures
- `QuotaTracker`: Tracks daily usage
- `CacheManager`: Prompt-level caching

---

## Non-Functional Requirements

### API Responses
- Format: JSON only
- Errors: `{ error, message, code, details? }`

### Security
- Auth required for all except `/public/*`
- Rate limiting per user/IP
- Input sanitization
- Secret rotation support

### Observability
- Structured logging
- Usage metrics per provider
- Health score tracking

### Performance
- Request timeouts: 30s default
- Max payload: 10MB
- P95 latency target: <500ms

---

## Key Endpoints

| Feature | Endpoint | AI Gateway? |
|---------|----------|-------------|
| Story Generator | `/generate-advanced-text/` | ✅ |
| Exam Generator | `/generate-exam/` | ✅ |
| Text Converter | `/convert-text/` | ✅ |
| Smart Reader | `/extract-content/` | ✅ |
| Vocabulary | `/vocab/` | ✅ (enrichment) |
| TTS | `/tts/` | Provider-specific |

---

*Document version: 1.0 | Created: 2025-12-10*
