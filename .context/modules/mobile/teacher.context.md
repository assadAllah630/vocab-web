# Teacher Mobile Context

## Purpose
The Teacher Mobile interface provides a command center for managing classrooms, creating assignments, and monitoring student progress on the go.

## Core Features

### 1. Teacher Dashboard (`MobileTeacherDashboard.jsx`)
- **Status Hub**: Real-time stats (Pending Grading, Join Requests).
- **Action Center**: Quick links to "Create Classroom" or "Grade Submissions".
- **Visuals**: Uses "Command Center" aesthetic with ambient backgrounds.

### 2. Assignment Wizard (`MobileAssignmentCreate.jsx`)
- **Multi-Step Flow**:
    1. **Type Selection**: Exam, Story, Vocab List.
    2. **Content Creation**:
        - **Magic Generate**: AI-powered vocabulary list creation.
        - **Exam Builder**: Manual or AI question generation.
        - **Library**: Select existing stories/articles.
    3. **Configuration**: Dates, gamification settings.
- **Magic Generate**:
    - Input: Topic (e.g. "Space Travel").
    - Output: Structured vocab list.
    - API: `/api/ai/generate-vocab/`.

### 3. Student Insights (`MobileStudentInsight.jsx`)
- **Drill-down**: View specific student performance within a class.
- **AI Summary**: Auto-generated text explaining student's current hurdles.

## Key Files
- [MobileTeacherDashboard.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileTeacherDashboard.jsx)
- [MobileAssignmentCreate.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileAssignmentCreate.jsx)
- [MobileClassroomDetail.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileClassroomDetail.jsx)

## Navigation
- Access via **"Teacher Dashboard"** banner on `MobileHome`.
- Protected by `is_teacher` flag on User profile.

## Design System
- **"Command Center"**: Dark, data-rich, high contrast (Emerald/Indigo accents).
- **"Wizard"**: Step-by-step linear flows with clear progression.
