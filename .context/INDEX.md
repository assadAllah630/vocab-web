# VocabMaster Context Index

Quick reference for all context files.

## Core Files

| File | Purpose |
|------|---------|
| [architecture.md](file:///e:/vocab_web/.context/architecture.md) | System stack, domains, AI subsystem |
| [conventions.md](file:///e:/vocab_web/.context/conventions.md) | Naming, layout, code standards |
| [glossary.md](file:///e:/vocab_web/.context/glossary.md) | Domain terminology |
| [rules.md](file:///e:/vocab_web/.context/rules.md) | Context loading rules |
| [CONTEXT_RULES.md](file:///e:/vocab_web/.context/CONTEXT_RULES.md) | **AUTO-UPDATE: Apply after EVERY file change** |

---

## Feature Indexes (10 files)
Cross-platform context indexes by feature.

| Feature | Platforms |
|---------|-----------|
| [vocabulary](file:///e:/vocab_web/.context/features/vocabulary.context.md) | Backend, Desktop, Mobile, Flutter |
| [exams](file:///e:/vocab_web/.context/features/exams.context.md) | Backend, Desktop, Mobile, Flutter |
| [content_generation](file:///e:/vocab_web/.context/features/content_generation.context.md) | Backend, Desktop, Mobile, Flutter |
| [podcasts](file:///e:/vocab_web/.context/features/podcasts.context.md) | Backend, Desktop, Mobile, Flutter |
| [classroom](file:///e:/vocab_web/.context/features/classroom.context.md) | Backend, Desktop, Mobile, Admin |
| [games](file:///e:/vocab_web/.context/features/games.context.md) | Backend, Desktop, Mobile, Flutter |
| [ai_gateway](file:///e:/vocab_web/.context/features/ai_gateway.context.md) | All platforms |
| [reader](file:///e:/vocab_web/.context/features/reader.context.md) | Backend, Desktop, Mobile, Flutter |
| [auth](file:///e:/vocab_web/.context/features/auth.context.md) | All platforms |
| [notifications](file:///e:/vocab_web/.context/features/notifications.context.md) | Backend, Mobile, Flutter |

---

## Backend Modules (20 files / 159 Python files)

| File | Domain |
|------|--------|
| [infrastructure](file:///e:/vocab_web/.context/modules/backend/infrastructure.context.md) | **Complete 159-file inventory** |
| [ai_gateway](file:///e:/vocab_web/.context/modules/backend/ai_gateway.context.md) | 6 text + 4 image adapters |
| [agents](file:///e:/vocab_web/.context/modules/backend/agents.context.md) | 10 LangGraph agents |
| [auth](file:///e:/vocab_web/.context/modules/backend/auth.context.md) | Token, OTP, OAuth, Firebase |
| [vocabulary](file:///e:/vocab_web/.context/modules/backend/vocabulary.context.md) | SM-2 SRS, words, tags |
| [reader](file:///e:/vocab_web/.context/modules/backend/reader.context.md) | Extraction pipeline |
| [content](file:///e:/vocab_web/.context/modules/backend/content.context.md) | GeneratedContent, SavedText |
| [exams](file:///e:/vocab_web/.context/modules/backend/exams.context.md) | AI generation, templates |
| [tts](file:///e:/vocab_web/.context/modules/backend/tts.context.md) | 4 TTS providers |
| [games](file:///e:/vocab_web/.context/modules/backend/games.context.md) | GameConfig, sessions |
| [notifications](file:///e:/vocab_web/.context/modules/backend/notifications.context.md) | FCM, Web Push |
| [semantic_search](file:///e:/vocab_web/.context/modules/backend/semantic_search.context.md) | Vector embeddings |
| [admin](file:///e:/vocab_web/.context/modules/backend/admin.context.md) | Admin backend |
| [classroom](file:///e:/vocab_web/.context/modules/backend/classroom.context.md) | Teacher, memberships |
| [organization](file:///e:/vocab_web/.context/modules/backend/organization.context.md) | Multi-tenancy |
| [learning_path](file:///e:/vocab_web/.context/modules/backend/learning_path.context.md) | Path/SubLevel/Node |
| [live_session](file:///e:/vocab_web/.context/modules/backend/live_session.context.md) | LiveKit, webhooks |
| [podcast](file:///e:/vocab_web/.context/modules/backend/podcast.context.md) | RSS + AI podcasts |
| [podcast_exam](file:///e:/vocab_web/.context/modules/backend/podcast_exam.context.md) | Podcast exams |
| [student_insights](file:///e:/vocab_web/.context/modules/backend/student_insights.context.md) | AI analytics |

---

## Frontend Desktop (8 files / 94 JSX+JS files)

| File | Coverage |
|------|----------|
| [core](file:///e:/vocab_web/.context/modules/frontend/core.context.md) | **ALL 32 pages + 48 components + 14 infra** |
| [vocabulary](file:///e:/vocab_web/.context/modules/frontend/vocabulary.context.md) | VocabList, AddWord, Quiz |
| [generators](file:///e:/vocab_web/.context/modules/frontend/generators.context.md) | Text/Story/Podcast gen |
| [viewers](file:///e:/vocab_web/.context/modules/frontend/viewers.context.md) | Story, Article, Libraries |
| [exams](file:///e:/vocab_web/.context/modules/frontend/exams.context.md) | ExamPage (58KB) |
| [reading](file:///e:/vocab_web/.context/modules/frontend/reading.context.md) | TextReader |
| [classroom](file:///e:/vocab_web/.context/modules/frontend/classroom.context.md) | Teacher, Sessions |
| [live_session](file:///e:/vocab_web/.context/modules/frontend/live_session.context.md) | VideoRoom, Whiteboard |

---

## Mobile React (9 files / 81 pages)

| File | Coverage |
|------|----------|
| [core](file:///e:/vocab_web/.context/modules/mobile/core.context.md) | **ALL 81 mobile pages** |
| [vocabulary](file:///e:/vocab_web/.context/modules/mobile/vocabulary.context.md) | Words, Flashcard |
| [content](file:///e:/vocab_web/.context/modules/mobile/content.context.md) | Generators, Viewers |
| [practice](file:///e:/vocab_web/.context/modules/mobile/practice.context.md) | Games |
| [reader](file:///e:/vocab_web/.context/modules/mobile/reader.context.md) | MobileReader |
| [classroom](file:///e:/vocab_web/.context/modules/mobile/classroom.context.md) | Classes |
| [teacher](file:///e:/vocab_web/.context/modules/mobile/teacher.context.md) | Teacher pages |
| [organization](file:///e:/vocab_web/.context/modules/mobile/organization.context.md) | Org admin |
| [flutter](file:///e:/vocab_web/.context/modules/mobile/flutter.context.md) | **Flutter: 18 modules, 73 files** |

---

## Admin Panel (7 files / 63 JSX files)

| File | Coverage |
|------|----------|
| [core](file:///e:/vocab_web/.context/modules/admin/core.context.md) | **28 pages + 35 components** |
| [analytics](file:///e:/vocab_web/.context/modules/admin/analytics.context.md) | AI, User, Content, Cohort |
| [users](file:///e:/vocab_web/.context/modules/admin/users.context.md) | User management |
| [monitoring](file:///e:/vocab_web/.context/modules/admin/monitoring.context.md) | Health, Logs |
| [content](file:///e:/vocab_web/.context/modules/admin/content.context.md) | Vocab, Grammar, Paths |
| [school](file:///e:/vocab_web/.context/modules/admin/school.context.md) | Teachers, Classrooms |
| [settings](file:///e:/vocab_web/.context/modules/admin/settings.context.md) | Platform config |

---

## Agent Prompts / Workflows (11 files)

| File | Workflow |
|------|----------|
| [feature](file:///e:/vocab_web/.context/prompts/feature.prompt.md) | Add new features |
| [bugfix](file:///e:/vocab_web/.context/prompts/bugfix.prompt.md) | Fix bugs |
| [refactor](file:///e:/vocab_web/.context/prompts/refactor.prompt.md) | Refactor code |
| [deploy](file:///e:/vocab_web/.context/prompts/deploy.prompt.md) | Deploy to production |
| [api](file:///e:/vocab_web/.context/prompts/api.prompt.md) | Create API endpoints |
| [component](file:///e:/vocab_web/.context/prompts/component.prompt.md) | Create React components |
| [test](file:///e:/vocab_web/.context/prompts/test.prompt.md) | Write tests |
| [debug](file:///e:/vocab_web/.context/prompts/debug.prompt.md) | Debug issues |
| [migrate](file:///e:/vocab_web/.context/prompts/migrate.prompt.md) | Database migrations |
| [review](file:///e:/vocab_web/.context/prompts/review.prompt.md) | Code review |
| [ai-feature](file:///e:/vocab_web/.context/prompts/ai-feature.prompt.md) | AI features |

---

## Summary Stats

| Area | Files Scanned | Context Files |
|------|---------------|---------------|
| Backend | 159 | 20 |
| Desktop | 94 | 8 |
| Mobile React | 81 | 9 |
| Flutter | 73 | (in mobile) |
| Admin | 63 | 7 |
| **Total** | **470** | **44** |

---

*Updated: 2025-12-24*
