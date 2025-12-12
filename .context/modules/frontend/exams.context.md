# Frontend Exams Module Context

## Purpose

Desktop exam page (58KB - major feature):
- Exam creation
- Taking exams
- AI grading
- Score tracking

---

## Key Page

### ExamPage (58KB!)
- [ExamPage.jsx](file:///e:/vocab_web/client/src/pages/ExamPage.jsx) - 58KB

**Features:**
1. **Create Exam**
   - Topic selection
   - CEFR level
   - Question types (MCQ, fill-in, translation, essay)
   - Vocabulary targeting
   - Grammar focus

2. **Take Exam**
   - Multiple sections
   - Timer
   - Progress tracking

3. **AI Grading**
   - Automatic scoring
   - Detailed feedback
   - Explanation per question

4. **History**
   - Past attempts
   - Best scores
   - Retry option

---

## Backend Dependencies

- `agent_exam.py` - LangGraph exam agent
- `ai_views.py` - generate_exam endpoint
- `models.py` - Exam, ExamAttempt models

---

*Version: 1.0 | Created: 2025-12-10*
