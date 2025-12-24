# Backend Infrastructure Context

## Purpose
Complete inventory of `server/api/` with **159 Python files**.

---

## Root Files (61 files)

### Core
| File | Size | Purpose |
|------|------|---------|
| `models.py` | 55KB | ALL database models |
| `serializers.py` | 28KB | DRF serializers |
| `urls.py` | 19KB | API routing |
| `unified_ai.py` | 21KB | Unified AI interface |
| `permissions.py` | 1KB | DRF permissions |
| `authentication.py` | 1KB | Custom auth backends |
| `middleware.py` | 6KB | Request middleware |
| `security_middleware.py` | 1KB | Security headers |
| `pagination.py` | 0.2KB | Pagination classes |

### AI & Generation
| File | Size | Purpose |
|------|------|---------|
| `ai_views.py` | 22KB | AI endpoints (/ai/*) |
| `advanced_text_agent.py` | 22KB | Story/Article LangGraph |
| `advanced_text_views.py` | 24KB | Generation endpoints |
| `advanced_text_models.py` | 3KB | GeneratedContent model |
| `agent_exam.py` | 14KB | Exam generation agent |
| `agent_podcast.py` | 14KB | Podcast script agent |
| `grammar_agent.py` | 10KB | Grammar exercise gen |
| `text_converter_agent.py` | 20KB | Text formatting agent |
| `text_converter_views.py` | 6KB | Converter endpoints |
| `image_generation_agent.py` | 12KB | Image gen for stories |
| `image_generation_sse.py` | 6KB | SSE streaming |
| `image_quality_validator.py` | 6KB | Image validation |
| `character_consistency_enforcer.py` | 8KB | Story character tracking |
| `prompts.py` | 6KB | Prompt templates |
| `gemini_helper.py` | 4KB | Gemini utilities |

### Content Extraction
| File | Size | Purpose |
|------|------|---------|
| `content_extraction_service.py` | 17KB | URL/Article scraping |
| `content_extraction_views.py` | 5KB | Extraction endpoints |
| `text_extraction_service.py` | 15KB | File parsing (PDF, DOCX) |
| `text_extraction_views.py` | 5KB | Upload endpoints |
| `text_formatting_service.py` | 7KB | AI text cleanup |
| `ocrspace_service.py` | 6KB | OCR for images |
| `file_type_registry.py` | 8KB | MIME type handling |

### Auth & Users
| File | Size | Purpose |
|------|------|---------|
| `google_auth.py` | 11KB | Google OAuth |
| `firebase_token_auth.py` | 7KB | Firebase auth |
| `password_views.py` | 4KB | Password management |
| `email_utils.py` | 14KB | Email sending |
| `feature_views.py` | 30KB | Profile, social features |
| `bulk_user_views.py` | 8KB | Bulk user operations |

### TTS & Audio
| File | Size | Purpose |
|------|------|---------|
| `tts_views.py` | 14KB | Text-to-speech |

### Notifications
| File | Size | Purpose |
|------|------|---------|
| `notification_models.py` | 4KB | Push subscription models |
| `notification_views.py` | 8KB | Push endpoints |

### Analytics
| File | Size | Purpose |
|------|------|---------|
| `analytics_service.py` | 3KB | Usage analytics |
| `analytics_views.py` | 7KB | Analytics endpoints |
| `system_metrics_views.py` | 2KB | System health |

### Search & Embeddings
| File | Size | Purpose |
|------|------|---------|
| `semantic_search_views.py` | 6KB | Vector search |
| `embedding_service.py` | 5KB | Embedding generation |

### SRS & Learning
| File | Size | Purpose |
|------|------|---------|
| `srs.py` | 2KB | SuperMemo-2 algorithm |
| `hlr.py` | 3KB | Half-life regression |
| `language_service.py` | 4KB | Language utilities |

### Admin
| File | Size | Purpose |
|------|------|---------|
| `admin.py` | 2KB | Django admin |
| `admin_models.py` | 6KB | Admin-specific models |
| `admin_views.py` | 22KB | Admin endpoints |
| `admin_urls.py` | 3KB | Admin routing |
| `admin_permissions.py` | 5KB | Admin perms |

### Misc
| File | Size | Purpose |
|------|------|---------|
| `rate_limiting.py` | 5KB | Rate limit logic |
| `consumers.py` | 1KB | WebSocket consumers |
| `routing.py` | 0.2KB | WebSocket routing |
| `signals.py` | 0.5KB | Django signals |

---

## Views Directory (26 files)

| File | Domain |
|------|--------|
| `auth_views.py` | Login, signup, OTP |
| `vocab_views.py` | Vocabulary CRUD |
| `classroom_views.py` | Classrooms |
| `teacher_views.py` | Teacher profiles |
| `teacher_dashboard_views.py` | Teacher stats |
| `teacher_application_views.py` | Teacher applications |
| `assignment_views.py` | Assignments |
| `exam_views.py` | Exams |
| `game_views.py` | Games |
| `learning_path_views.py` | Learning paths |
| `live_session_views.py` | Live sessions |
| `livekit_webhook_views.py` | LiveKit webhooks |
| `external_podcast_views.py` | RSS podcasts |
| `podcast_views.py` | AI podcasts |
| `organization_views.py` | Organizations |
| `practice_views.py` | Practice/review |
| `profile_views.py` | User profile |
| `stats_views.py` | Statistics |
| `skill_views.py` | Skill mastery |
| `weakness_views.py` | Weakness detection |
| `recommendation_views.py` | Recommendations |
| `agent_views.py` | AI agent endpoints |
| `seed_views.py` | Data seeding |
| `monitoring_views.py` | Health checks |

---

## Agents Directory (4 files)

| File | Purpose |
|------|---------|
| `recommendation_agent.py` | Content recommendations |
| `student_insights.py` | Learning analytics |
| `vocabulary_agent.py` | Vocab enrichment |
| `writing_grader.py` | AI essay grading |

---

## Services Directory (18 files)

### external_podcast/
- `feed_parser.py` - RSS parsing
- `scraper.py` - Transcript extraction
- `tasks.py` - Background sync

### podcast/
- `journalist_agent.py`, `producer_agent.py`
- `showrunner_agent.py`, `writer_agent.py`

### recommendations/
- `engine.py` - Recommendation engine

### weakness/
- `base.py`, `detectors.py`, `service.py`

### Root
- `livekit_service.py` - LiveKit API
- `learning_events.py` - Event logging
- `skill_tracker.py` - BKT tracking
- `background_exam.py`, `background_podcast.py`
- `classroom_notifications.py`

---

## AI Gateway Directory (50 files)

### adapters/ (12 files)
- **Text**: `gemini.py`, `openrouter.py`, `groq.py`, `huggingface.py`, `cohere.py`, `deepinfra.py`
- **Image**: `image_pollinations.py`, `image_gemini.py`, `image_huggingface.py`, `image_openrouter.py`

### services/ (7 files)
- `key_selector.py` - Multi-key routing
- `model_selector.py` - Model selection
- `quota_tracker.py` - Usage tracking
- `circuit_breaker.py` - Failure handling
- `cache_manager.py` - Response caching
- `learning_engine.py` - Provider scoring

### routers/ (4 files)
- `keys.py`, `dashboard.py`, `stats.py`, `chat.py`

### utils/ (3 files)
- `encryption.py`, `redis_client.py`

### Other
- `models.py`, `schemas.py`, `providers.py`
- `model_usage.py`, `urls.py`
- `background/jobs.py`, `background/tasks.py`

---

*Version: 2.0 | Updated: 2025-12-24*
