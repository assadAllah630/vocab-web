# Exams Module Context

## Purpose
The **Exams Module** handles assessment creation, execution, and grading. It supports both manual creation and AI-generated exams.

## Key Models
See `server/api/models.py`.

- **Exam**: The exam definition.
  - `questions`: JSON array of question objects.
  - `is_template`: Boolean. If true, acts as a master copy (not an attempt).
  - `cloned_from`: Link to original template.
- **ExamAttempt**: A student's specific instance of taking an exam.
  - `user_answers`: JSON.
  - `score`: Final grade.
  - `feedback`: AI-generated feedback.

## Core Features
1.  **Generation**: `POST /api/ai/generate-exam/`.
    -   Uses `AgentExam` (LangGraph) to create questions based on topic/level.
2.  **Taking Exams**:
    -   `POST /api/exams/` with `topic` and `questions` creates a new exam instance.
    -   Existing exams with same structure are treated as "Retakes" (new `ExamAttempt`).
3.  **Community**:
    -   `GET /api/exams/community/`: Fetch public exams from followed users.

## Logic: Templates vs Attempts
- **Template**: Created by teachers or system. `is_template=True`. No attempts directly on it.
- **Instance**: When a user takes a template, a new `Exam` is NOT created if one exists for that user/topic; instead, a new `ExamAttempt` is added.

## Key Files
- `server/api/views/exam_views.py`: CRUD and Community logic.
- `server/api/agent_exam.py`: LangGraph agent for generation.
- `server/api/ai_views.py`: Endpoint for generation trigger.
