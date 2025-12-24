# CONTEXT AUTO-SYNC RULES

> **⚠️ MANDATORY**: Apply these rules AUTOMATICALLY after ANY code change.

---

## 🚀 INSTANT DECISION TREE

**After ANY file change, follow this:**

```
START
  │
  ▼
┌─────────────────────────────────────┐
│ What did you just do?               │
└─────────────────────────────────────┘
  │
  ├── Created new file? ──────────────► ADD to relevant contexts + UPDATE INDEX counts
  │
  ├── Modified file? ─────────────────► CHECK if context needs update (new function? changed API?)
  │
  ├── Deleted file? ──────────────────► REMOVE from contexts + UPDATE INDEX counts
  │
  └── Added new feature/model? ───────► CREATE or UPDATE feature context + ALL platform contexts
```

---

## 🎯 AUTO-DETECT: Which Contexts to Update

**Step 1: Find file category**
```
server/api/         → Backend contexts
client/src/pages/   → Frontend contexts  
client/src/mobile/  → Mobile contexts
admin-client/       → Admin contexts
flutter_app/        → Flutter contexts
```

**Step 2: Find feature by keywords in filename**

| If filename contains... | Update this FEATURE context |
|------------------------|----------------------------|

| `vocab`, `word`, `srs`, `quiz`, `flashcard` | `features/vocabulary.context.md` |
| `exam`, `test`, `attempt`, `question` | `features/exams.context.md` |
| `podcast`, `episode`, `rss`, `audio`, `tts` | `features/podcasts.context.md` |
| `class`, `teacher`, `student`, `session`, `assignment` | `features/classroom.context.md` |
| `story`, `article`, `dialogue`, `grammar`, `content`, `gen` | `features/content_generation.context.md` |
| `game`, `practice`, `challenge`, `arena`, `lobby` | `features/games.context.md` |
| `ai`, `gateway`, `model`, `adapter`, `provider`, `unified` | `features/ai_gateway.context.md` |
| `reader`, `extract`, `text`, `url`, `youtube` | `features/reader.context.md` |
| `auth`, `login`, `profile`, `user`, `password`, `oauth` | `features/auth.context.md` |
| `notification`, `push`, `fcm`, `alert` | `features/notifications.context.md` |

---

## 📁 EXACT Context Files to Update

### Backend Changes (server/api/)
```
ALWAYS update: modules/backend/infrastructure.context.md

ALSO update based on folder:
├── views/           → Check feature keyword
├── agents/          → modules/backend/agents.context.md
├── services/        → modules/backend/infrastructure.context.md
├── ai_gateway/      → modules/backend/ai_gateway.context.md
└── models.py        → ALL relevant feature contexts (check what model changed)
```

### Frontend Changes (client/src/)
```
ALWAYS update: modules/frontend/core.context.md

Based on page name, ALSO update the matching feature context.
```

### Mobile Changes (client/src/pages/mobile/)
```
ALWAYS update: modules/mobile/core.context.md

Based on page name, ALSO update the matching feature context.
```

### Admin Changes (admin-client/src/)
```
ALWAYS update: modules/admin/core.context.md

Based on folder:
├── analytics/  → modules/admin/analytics.context.md
├── users/      → modules/admin/users.context.md
├── monitoring/ → modules/admin/monitoring.context.md
├── content/    → modules/admin/content.context.md
├── school/     → modules/admin/school.context.md
└── settings/   → modules/admin/settings.context.md
```

### Flutter Changes (flutter_app/lib/)
```
ALWAYS update: modules/mobile/flutter.context.md

Based on feature folder name, ALSO update the matching feature context.
```

---

## 📊 INDEX.md Count Updates

**When adding/removing files, update these counts:**

| Section | Current Count | Location in INDEX.md |
|---------|---------------|---------------------|
| Backend | 159 | "159 Python files" |
| Desktop | 94 | "94 JSX+JS files" |
| Mobile React | 81 | "81 pages" |
| Admin | 63 | "63 JSX files" |
| Flutter | 73 | "73 files" |

---

## ✅ QUICK CHECKLIST (Copy-Paste This)

After every file change:
```
□ Updated module context (backend/frontend/mobile/admin/flutter)
□ Updated feature context (vocabulary/exams/podcasts/etc)
□ Updated INDEX.md counts (if new/deleted file)
□ Updated architecture.md (if new domain/major change)
```

---

## 💡 EXAMPLES

### Example 1: Created `MobileNewQuiz.jsx`
```
File: client/src/pages/mobile/MobileNewQuiz.jsx
Keywords: "Quiz" → vocabulary feature

UPDATE:
1. modules/mobile/core.context.md (add to Vocabulary section)
2. features/vocabulary.context.md (add to Mobile React section)
3. INDEX.md: Mobile count 81 → 82
```

### Example 2: Modified `exam_views.py`
```
File: server/api/views/exam_views.py
Keywords: "exam" → exams feature

UPDATE:
1. modules/backend/infrastructure.context.md (if new endpoint)
2. features/exams.context.md (if API changed)
```

### Example 3: Added new model `PodcastChapter` in models.py
```
File: server/api/models.py
Keywords: "Podcast" → podcasts feature

UPDATE:
1. features/podcasts.context.md (add to Key Models section)
2. modules/backend/podcast.context.md (add model details)
```

---

## 🔄 SYNC CHECK

If unsure if contexts are in sync, run this mental check:
1. Open the file you changed
2. Search for its name in all context files
3. If not found where expected → ADD IT
4. If found but outdated → UPDATE IT

---

*Auto-apply on EVERY change. No exceptions.*
