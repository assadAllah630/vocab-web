---
description: Create and manage Exam Assignments (Manual or AI-Generated)
---

# Exam Assignment Workflow

## Phase 1: Configuration & Curriculum Link
**Goal:** Define the context and rules.
1.  **Learning Path**: Teacher selects specific Node (e.g., "Unit 1 > Quiz 1").
2.  **Settings**:
    - Time Limit (e.g., 30 mins).
    - Attempts Allowed (1, 3, or Unlimited).
    - Pass Threshold (e.g., 70%).
    - "Show Answers": Immediately or After Due Date.

## Phase 2: Content Creation
**Goal:** Build the assessment.
1.  **Mode Initial**:
    - **From Template**: Select existing "Master Exam".
    - **AI Generate**: "Create 10 A1 questions about Family".
    - **Manual**: Teacher types questions.
2.  **Review**: Teacher edits questions/answers.
3.  **Finalize**: Saved as `Exam` (is_template=True).

## Phase 3: Student Execution
**Goal:** Taking the test.
1.  **Start**: Student clicks "Start" -> Backend clones Template -> New Exam Instance.
2.  **Interface**:
    - Timer provided by Exam Player.
    - Progress saved locally (resume capable).
3.  **Submission**:
    - Scores calculated instantly.
    - `AssignmentProgress` updated with: `{ score: 85, passed: true, mistakes: [q_ids] }`.

## Phase 4: Analytics & Feedback
**Goal:** Review performance.
1.  **Teacher View**:
    - "Problem Questions": Which questions did 50%+ fail?
    - "Grade Distribution": Bell curve of scores.
2.  **Drill Down**: Click student to specific exam answers.
