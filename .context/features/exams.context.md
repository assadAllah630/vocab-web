# Exams Feature Index

## Overview
All context files related to Exam generation, taking, and grading.

---

## Backend
| Context | Purpose |
|---------|---------|
| [exams.context.md](file:///e:/vocab_web/.context/modules/backend/exams.context.md) | Exam models, AI generation |
| [agents.context.md](file:///e:/vocab_web/.context/modules/backend/agents.context.md) | agent_exam.py |
| [podcast_exam.context.md](file:///e:/vocab_web/.context/modules/backend/podcast_exam.context.md) | Podcast exams |

## Frontend Desktop
| Page | Purpose |
|------|---------|
| `ExamPage.jsx` | Exam hub (58KB - largest page) |

## Mobile React
| Page | Purpose |
|------|---------|
| `MobileExam.jsx` | Exam hub |
| `MobileExamCreate.jsx` | Create exam |
| `MobileExamEditor.jsx` | Edit exam |
| `MobileExamPlay.jsx` | Take exam |
| `MobileExamManualEditor.jsx` | Manual questions |
| `MobileExamQuestionEditors.jsx` | Question types |

## Flutter
| Screen | Purpose |
|--------|---------|
| `exam_dashboard_screen.dart` | Exam list |
| `exam_create_screen.dart` | Create |
| `exam_play_screen.dart` | Take exam |

---

## Key Models
- `Exam` (topic, questions, is_template)
- `ExamAttempt` (user_answers, score, feedback)
- `PodcastExam`, `PodcastExamAttempt`

---

*Feature Index v1.0*
