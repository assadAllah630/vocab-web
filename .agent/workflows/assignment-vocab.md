---
description: Create and manage Vocabulary Assignments (Learn new words)
---

# Vocabulary Assignment Workflow

## Phase 1: Configuration & Curriculum Link
**Goal:** Define target vocabulary.
1.  **Learning Path**: Link to Vocab Node (e.g., "Unit 3: Travel Words").
2.  **Settings**:
    - Mastery Target: "Recognize" (1 correct) vs "Master" (3 correct spaced).
    - Mode: "Flashcards Only" or "Includes Spelling".

## Phase 2: Content Selection
**Goal:** Build the list.
1.  **Sources**:
    - **Classroom List**: Select from previously saved words.
    - **AI Generate**: "20 words about Hotels in German".
    - **Manual**: Type word + translation.
2.  **Refinement**: Teacher removes too easy/hard words.

## Phase 3: Student Execution
**Goal:** Acquisition.
1.  **Interface**:
    - Practice Session UI.
    - SRS (Spaced Repetition) Algorithm prioritizes assignment words.
2.  **Tracking**:
    - `AssignmentProgress`: `{ mastered_count: 15, total: 20, accuracy: 85% }`.
    - Auto-complete when target reached.

## Phase 4: Analytics
**Goal:** Retention check.
1.  **Teacher View**:
    - "Difficult Words": Which words have the lowest accuracy?
    - "Engagement": Who hasn't started practicing?
