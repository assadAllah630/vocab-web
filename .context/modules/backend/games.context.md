# Games Module Context

## Purpose
The **Games Module** provides gamified practice experiences. It supports multiplayer matching games and other interactive exercises.

## Key Models
See `server/api/models.py`.

- **GameConfig**: Template for a game type.
  - `game_type`: `matching`, `flashcards`, `quiz_arena`.
  - `settings`: JSON (time limit, difficulty, word count).
- **GameSession**: A running or completed game instance.
  - `status`: `waiting`, `active`, `completed`.
  - `winner`: FK to User.
- **GameParticipant**: Links User to GameSession.
  - `score`: Points earned.
  - `finished_at`: Completion timestamp.

## Core Features
1.  **Creation**: `POST /api/games/` creates a session from a config.
2.  **Joining**: `POST /api/games/<id>/join/`.
3.  **State Updates**: Real-time via LiveKit Data Messages (frontend handles sync).
4.  **Leaderboards**: `GET /api/games/leaderboard/`.

## Key Files
-   `server/api/views/game_views.py`: Main logic.
-   `server/api/serializers.py`: Game serializers.
