---
description: Create and manage Story Assignments (Reading Comprehension)
---

# Story Assignment Workflow

## Phase 1: Configuration & Curriculum Link
**Goal:** Select reading goal.
1.  **Learning Path**: Link to Reading Node.
2.  **Goals**:
    - Min Read Time (e.g., 5 mins).
    - Comprehension Quiz Required? (Yes/No).

## Phase 2: Content Selection
**Goal:** Choose or Generate Text.
1.  **Source**:
    - **Library**: Pick from existing.
    - **Import**: URL/PDF.
    - **AI Write**: "Write a story about 'Shopping' using A2 grammar".
2.  **Additions**:
    - Teacher highlights key phrases.
    - AI generates quiz questions if enabled.

## Phase 3: Student Execution
**Goal:** Active Reading.
1.  **Interface**:
    - Reader Player tracks scroll position and time.
    - Student clicks words for translation (recorded as 'Friction').
2.  **Completion**:
    - Must stay on page for Min Time.
    - Must pass Quiz (if enabled).
3.  **Tracking**:
    - `AssignmentProgress`: `{ read_percent: 100, quiz_score: 80, looked_up_words: ["store", "price"] }`.

## Phase 4: Analytics
**Goal:** Verify understanding.
1.  **Teacher Dashboard**:
    - "Who actually read it?" (Time vs Speed analysis).
    - "Vocab Friction Heatmap": Which words were clicked most? -> Add to next Vocab List.
