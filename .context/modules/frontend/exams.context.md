# Frontend Exams Module Context

## Purpose
Full exam experience: generation, taking, and reviewing results.

---

## Key Page

### ExamPage
- [ExamPage.jsx](file:///e:/vocab_web/client/src/pages/ExamPage.jsx) ~58KB (Largest desktop page)
  - **Tabs**: Create, Take, Review.
  - AI Generation:
    - Topic/Level selection.
    - Question count slider.
    - Calls `POST /api/ai/generate-exam/`.
  - Exam Taking:
    - Timer.
    - Progress bar.
    - MCQ / Fill-in-the-blank / Open-ended.
  - Review:
    - Per-question feedback.
    - Score breakdown.
    - "Retake" action.

---

## State Management
This page uses complex local state:
- `exam`: The current exam object.
- `answers`: User's submitted answers.
- `phase`: `generating` | `idle` | `taking` | `reviewing`.

---

## API Integration

```javascript
// Generate exam
const { data } = await api.post('/ai/generate-exam/', {
  topic: 'German Verbs',
  count: 10,
  difficulty: 'medium'
});

// Save attempt
await api.post('/exams/', {
  topic,
  questions: exam.questions,
  user_answers: answers,
  score: calculatedScore
});
```

---

*Version: 1.1 | Updated: 2025-12-24*
