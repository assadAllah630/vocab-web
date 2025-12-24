# Content Module Context

## Purpose
The **Content Module** manages static and AI-generated learning materials. It covers Stories, Articles, Dialogues, and imported texts.

## Key Models
See `server/api/models.py` and `server/api/advanced_text_models.py`.

- **GeneratedContent**: AI-created materials.
  - `content_type`: `story`, `article`, `dialogue`.
  - `content_data`: JSON structure (paragraphs, events).
  - `has_images`: Boolean (linked generated images).
  - `vocabulary_used`: List of target words.
- **SavedText**: Simplified model for imported/saved raw text.
  - `content`: Markdown text.
  - `embedding`: Vector for semantic search.

## Core Features
1.  **AI Generation**: `POST /api/ai/generate-advanced-text/`.
    -   Uses `AdvancedTextAgent` (LangGraph) to create structured narratives.
2.  **Extraction**: `POST /api/extract-content/`.
    -   Extracts clean text from URLs or YouTube videos (`transcript`).
3.  **Organization**:
    -   Content can be "Favorited".
    -   `vocabulary_used` helps in linking content to SRS practice.

## Key Files
- `server/api/advanced_text_views.py`: Logic for generated content.
- `server/api/content_extraction_views.py`: Logic for URL/YouTube parsing.
- `server/api/advanced_text_agent.py`: The creative AI brain.
