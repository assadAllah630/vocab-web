# Smart Podcast Agent Module

> **Status**: Beta
> **Owner**: AI Backend Team
> **Last Updated**: 2025-12-15

## 1. Overview
The **Smart Podcast Agent** is a multi-agent system designed to generate professional-quality, context-aware audio episodes. Unlike simple text-to-speech tools, it simulates a production team (Showrunner, Journalist, Writer, Producer) to create engaging content that "remembers" previous episodes.

## 2. Architecture (LangGraph)
The core logic is a state machine defined in `server/api/agent_podcast.py`.

### Nodes
1.  **Showrunner** (`ShowrunnerAgent`):
    *   **Goal**: Define the "Concept".
    *   **Memory**: Reads/Writes the `series_bible` in `PodcastCategory`.
    *   **Logic**: Uses Show History to ensure variety (e.g., "We did grammar last time, let's do culture today").
2.  **Journalist** (`JournalistAgent`):
    *   **Goal**: Ground content in reality.
    *   **Tool**: **Gemini Search Grounding**.
    *   **Logic**: Searches for real-time facts/news matching the concept.
3.  **Writer** (`WriterAgent`):
    *   **Goal**: Create engagement.
    *   **Logic**: Scripts a 2-person dialogue with banter, callbacks, and SFX cues.
4.  **Producer** (`ProducerAgent`):
    *   **Goal**: High-fidelity audio.
    *   **Tool**: **Deepgram Aura** (Text-to-Speech).
    *   **Logic**: Renders script to MP3.

## 3. Data Models

### `PodcastCategory` (The Series)
*   **`series_bible` (JSON)**: The "Long-term Memory".
    *   `last_topics`: List of recent episode topics.
    *   `recurring_characters`: Detailed character sheets for hosts.
    *   `inside_jokes`: List of running gags.
*   **`audio_settings` (JSON)**: Voice configs (e.g., `host_a: "aura-asteria-en"`).

### `Podcast` (The Episode)
*   **`script` (JSON)**: The final dialogue structure.
*   **`research_dossier` (JSON)**: Source facts used.
*   **`audio_file`**: Final MP3.

## 4. Key Files
*   `server/api/agent_podcast.py`: The Brain (LangGraph).
*   `server/api/services/podcast/`: The Agents (Showrunner, Journalist, Writer, Producer).
*   `server/api/services/background_podcast.py`: The Orchestrator (Job Runner).

## 5. Usage
Trigger generation via API:
```http
POST /api/podcasts/generate/
{
  "category_id": 123
}
```
Notification sent via Firebase Cloud Messaging upon completion.
