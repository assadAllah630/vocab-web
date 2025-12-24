# Learning Path Module Context

## Purpose
The **Learning Path Module** defines structured curricula (e.g., "German A1") and tracks student progress through them. It is the backbone of the guided learning experience.

## Architecture: The Hierarchy
1.  **LearningPath**: The high-level container (e.g., "English to German").
    -   Attributes: `speaking_language`, `target_language`.
2.  **PathSubLevel**: Logical grouping (e.g., "A1.1: Foundations").
    -   Attributes: `level_code` (A1, A2...), `objectives`.
3.  **PathNode**: An individual learning unit (Lesson, Exercise, Exam).
    -   Attributes: `type` (lesson/exercise/exam), `content_link` (polymorphic).
    -   `pass_threshold`: Score needed to unlock next node.

## Progress System
See `server/api/views/learning_path_views.py`.

-   **PathEnrollment**: Links `User` to `LearningPath`.
-   **NodeProgress**: State of a user on a specific node.
    -   `status`: `locked`, `available`, `in_progress`, `completed`.
    -   `score`: Result of the activity.

## Core Features
-   **Enrollment**: `POST /api/paths/<id>/enroll/`.
-   **Navigation**:
    -   Nodes are ordered.
    -   Completing a node (`POST /api/path-nodes/<id>/complete/`) automatically unlocks the next one (`available`).
-   **Content Linking**: Nodes can link to:
    -   `LiveSession` (Attend a class).
    -   `Assignment` (Take an exam).
    -   `GameConfig` (Play a practice game).

## Usage Examples

### node_completion
```python
# Completing a node via API
# POST /api/path-nodes/123/complete/
{
    "score": 85
}
# Response includes updated status and potential unlock of next node
```

### tree_traversal
```python
# Getting full path structure
# GET /api/paths/1/structure/
{
    "id": 1,
    "sublevels": [
        {
            "code": "A1.1",
            "nodes": [...]
        }
    ]
}
```
