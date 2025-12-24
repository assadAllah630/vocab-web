# Frontend Vocabulary Module Context

## Purpose
Pages for managing vocabulary: adding words, reviewing lists, and practicing with quizzes.

---

## Key Pages

### VocabList
- [VocabList.jsx](file:///e:/vocab_web/client/src/pages/VocabList.jsx) ~32KB
  - Tabbed view by status (New, Learning, Review, Mastered).
  - Inline editing for word/translation.
  - SRS indicators (next review date).
  - Bulk actions (delete, reset).

### AddWord
- [AddWord.jsx](file:///e:/vocab_web/client/src/pages/AddWord.jsx) ~27KB
  - Manual entry form.
  - AI auto-fill (translations, examples).
  - Bulk import (paste list).

### Quiz
- [QuizSelector.jsx](file:///e:/vocab_web/client/src/pages/QuizSelector.jsx) ~4KB
  - Mode selection (Flashcards, Multiple Choice, Typing).
- [QuizPlay.jsx](file:///e:/vocab_web/client/src/pages/QuizPlay.jsx) ~29KB
  - Quiz runner component.
  - Scoring and feedback.
  - SRS grade submission.

---

## Key Components
Located in `client/src/components/`.

| Component | Purpose |
|-----------|---------|
| `WordCard` | Single word display with flip animation. |
| `VocabModal` | Detailed word view/edit popup. |

---

## API Hooks
Common patterns used in this module:

```javascript
// Fetch words due for review
const { data } = await api.get('/vocab/by-status/?status=review');

// Submit quiz result (triggers SRS update)
await api.post('/progress/update/', { vocab_id: 123, grade: 4 });
```

---

*Version: 1.1 | Updated: 2025-12-24*
