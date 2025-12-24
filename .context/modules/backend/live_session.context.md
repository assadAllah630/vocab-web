# Live Session Module Context

## Purpose
The **Live Session Module** manages real-time video/audio classes. It integrates with **LiveKit** for WebRTC and handles scheduling, attendance, and reminders.

## Key Models
See `server/api/models.py`.

- **LiveSession**: A scheduled event.
  - `meeting_id`: LiveKit room name.
  - `status`: `scheduled`, `live`, `completed`.
  - `recording_url`: Link to cloud recording (Egress).
  - `materials`: JSON list of resources for the session.
- **SessionAttendance**: Tracks join/leave events.
  - `duration_minutes`: Computed from webhook events.

## LiveKit Integration
- **Token Generation**: Frontend requests a JWT to join (`GET /api/sessions/<id>/join/`).
- **Webhooks**: `server/api/views/livekit_webhook_views.py` listens for events:
  - `participant_joined`: Updates status to `live`.
  - `participant_left`: Updates `SessionAttendance`.
  - `room_finished`: Updates status to `completed` and triggers analysis.

## Core Features
1.  **Scheduling**: `LiveSessionViewSet` handles CRUD.
2.  **Interactive Tools**:
    -   **Whiteboard**: Delta-synced via LiveKit Data Messages (see Frontend Context).
    -   **Quizzes**: Instant polls pushed to students.
3.  **Reminders**: `SessionReminder` model stores scheduled notifications (email/push).

## Key Files
-   `server/api/views/live_session_views.py`: API for sessions.
-   `server/api/views/livekit_webhook_views.py`: Webhook handler.

## Usage Examples

### starting_session
```python
# Teacher starts session -> Status changes to live
# Triggered automatically via webhook when first participant joins
# OR manually via API
session.status = 'live'
session.save()
```
