---
description: 5-Phase Workspace to build the Classroom Game Arena
---

# Classroom Arena Workflow

This workflow guides the creation of the "Classroom Arena" - a synchronous, multiplayer game system for language learning.

## Phase 1: The Foundation (Backend Core)
**Goal:** Establish the data models and API endpoints required to run a game session.

1.  **Update Exam Model**:
    - Add `is_template` (Boolean) and `cloned_from` (ForeignKey) to `server/api/models.py`.
2.  **Create Game Models**:
    - Create `GameSession` model (status, stage, participants, state JSON).
    - Create `GameConfig` model (stages JSON, settings JSON).
3.  **Migration**: Run `makemigrations` and `migrate`.
4.  **GameSession API**:
    - Implement `GameSessionViewSet` in `server/api/views/game_views.py`.
    - Endpoints: `create_session`, `join_session`, `sync_state`.
5.  **Test**: Verify creating a session and joining it via API.

## Phase 2: The Director's Studio (Builder)
**Goal:** Allow teachers to configure complex game sessions.

1.  **Frontend Route**: Add `/m/assignment/builder` route.
2.  **Builder Component**: Create `MobileAssignmentBuilder.jsx`.
3.  **Configurator Logic**:
    - UI to select Game Modes (Velocity, Streamline, etc.).
    - UI to order stages and set time limits.
    - **Curriculum Link**: Dropdown to select "Learning Path Node" to attach this game to.
4.  **Save Logic**: POST to `GameConfig` API (including `node_id`).

## Phase 3: The Lobby & Connection
**Goal:** Connect students and teacher in a shared waiting room.

1.  **Lobby Component**: Create `MobileGameLobby.jsx`.
2.  **Teacher View**:
    - Show list of joined students (poll `participants` field).
    - "Start Game" button -> Updates status to `active`.
3.  **Student View**:
    - Waiting screen with Avatar selection.
    - Poll status -> Redirect to Arena when `active`.
4.  **Networking**: Implement "Heartbeat" polling to keep participant list fresh.

## Phase 4: The Game Engines
**Goal:** Implement the actual game logic for the first 3 modes.

1.  **Arena Shell**: Create `GameArena.jsx` (Handles Timer, Score, Sound).
2.  **Mode 1: Velocity**:
    - Implement matching logic.
    - Visuals: "Data Stream" progress bars.
3.  **Mode 2: Streamline**:
    - Implement sentence ordering logic.
    - Visuals: "Flow Connection" nodes.
4.  **Mode 3: Face-Off**:
    - Implement True/False logic.
    - Visuals: Split-screen 1v1.

## Phase 5: The "Juice" (Polish)
**Goal:** Add the remaining modes and premium polish.

1.  **Mode 4: Synergy**: Co-op quiz mechanics.
2.  **Mode 5: Discovery**: Cloze/Decryption mechanics.
3.  **Power-ups**: Implement UI for "Boosts" and "Disruptors".
4.  **Teacher God Mode**: Admin controls during live game.
5.  **Final Polish**: Sounds, Animations, Dark Mode refinement.
