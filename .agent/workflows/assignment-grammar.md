---
description: Create and manage Grammar Assignments with automated exercises
---

# Grammar Assignment Workflow

## Phase 1: Configuration & Curriculum Link
**Goal:** Define concept and scope.
1.  **Learning Path**: Link to Grammar Node (e.g., "Unit 2: Past Tense").
2.  **Scope**:
    - Select Rule: (e.g., "Regular Verbs -ed").
    - Difficulty: Beginner (Multiple Choice) vs Advanced (Writing).

## Phase 2: Content Creation
**Goal:** Generate exercises.
1.  **Teacher Inputs**: "Generate 5 sentences practicing 'Haben vs Sein'".
2.  **AI Action**: Creates exercises JSON:
    - `{ type: "order", sentence: "Ich habe gegessen", scrambled: ["gegessen", "habe", "Ich"] }`
3.  **Review**: Teacher accepts or regenerates.

## Phase 3: Student Execution
**Goal:** Interactive Drill.
1.  **Interface**:
    - Specialized Grammar Player (Drag/Drop, Fill-blank).
    - "Smart Hints": If student fails, show the rule card.
2.  **Tracking**:
    - `AssignmentProgress` updated: `{ accuracy: 90%, weak_points: ["irregular verbs"] }`.

## Phase 4: Analytics
**Goal:** Identify gaps.
1.  **Teacher View**:
    - "Concept Mastery": Is the class ready to move on?
    - "Common Errors": "Most students confused 'sein' with 'haben'".
