# Classroom Module Context

## Purpose
The **Classroom Module** manages the relationship between Teachers and Students. It provides a shared space for learning, tracks progress against a curriculum (Learning Path), and handles administrative tasks like enrollment and invitations.

## Key Models
See `server/api/models.py`.

- **Teacher**: Profile extension for users who manage classrooms.
- **Classroom**: The main container.
  - `linked_path`: FK to `LearningPath` (Class-level curriculum).
  - `invite_code`: Unique 8-char code for joining.
- **ClassMembership**: Links `User` (Student) to `Classroom`.
  - `status`: `active`, `pending`, `paused`.
- **ClassPathProgress**: **Crucial**. Tracks the *class-wide* progress on their Linked Path. All students see this timeline.
- **StudentRemediation**: Tracks individual catch-up work (e.g., missed session, failed exam).

## Core Features

### 1. Enrollment & Access
- **Invite Codes**: Students join via `POST /api/classrooms/join/` with a code.
- **Approval Flow**: Teachers can require approval (`requires_approval=True`).

### 2. Curriculum Integration (The "Linked Path")
Classrooms are usually bound to a `LearningPath`.
- **Class Progress**: The teacher advances the class through the path nodes.
- **Student View**: Students see the class's current position but can be "Remediated" if they fall behind.

### 3. Assignments & Grading
- Assignments are created by the teacher.
- Can be linked to a specific `PathNode`.
- Types: `exam`, `writing`, `speaking` (via `ExternalEpisode`).

## Key Files
- `server/api/views/classroom_views.py`: ViewSets for CRUD.
- `server/api/views/teacher_views.py`: Teacher profile management.
- `server/api/models.py`: All database definitions (monolithic file).

## Common Tasks (for Agents)

### creating_classroom
```python
# Create a classroom linked to A1 German path
path = LearningPath.objects.get(title="German A1")
Classroom.objects.create(
    teacher=user.teacher_profile,
    name="Beginner German",
    linked_path=path,
    level="A1"
)
```

### checking_membership
```python
# Check if user is in classroom
is_member = ClassMembership.objects.filter(
    classroom_id=123, 
    student=user, 
    status='active'
).exists()
```
