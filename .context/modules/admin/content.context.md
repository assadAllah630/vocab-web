# Admin Content Context

## Purpose
Content management for vocabulary, grammar, generated content, and learning paths.

---

## Pages (5)

| File | Purpose |
|------|---------|
| `VocabularyList.jsx` | Global vocabulary management |
| `GrammarList.jsx` | Grammar topics admin |
| `GeneratedContentList.jsx` | AI-generated content review |
| `AdminLearningPathList.jsx` | Learning paths overview |
| `AdminLearningPathBuilder.jsx` | Path creation/editing |

---

## Location
`admin-client/src/pages/content/`

---

## Features

### VocabularyList
- Browse all vocabulary
- Filter by language/level
- Edit word definitions
- Bulk import/export

### GrammarList
- Grammar topic management
- Add/edit explanations
- Link exercises

### GeneratedContentList
- View all AI content
- Filter by type (story/article/dialogue)
- Feature/unfeature content
- Delete inappropriate content

### AdminLearningPathBuilder
- Visual path editor
- Node drag-and-drop
- SubLevel management
- Material uploads

---

## API Endpoints Used
- `GET/POST /api/vocab/`
- `GET/POST /api/grammar-topics/`
- `GET /api/ai/generated-content/`
- `GET/POST /api/paths/`

---

*Version: 1.0 | Created: 2025-12-24*
