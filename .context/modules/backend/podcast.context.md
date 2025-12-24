# Podcast Module Context

## Purpose
The **Podcast Module** handles two distinct types of audio content:
1.  **External Podcasts**: RSS-fed podcasts from the web (iTunes/Spotify style).
2.  **AI Generated Podcasts**: Original content generated from learning topics.

## 1. External Podcasts (RSS Integration)
### Models
- `ExternalPodcast`: The show metadata (Feed URL, Artwork, Level).
  - `level`: CEFR Level (A1-C2) for filtering.
  - `language`: Target language.
- `ExternalEpisode`: Individual episodes.
  - `audio_url`: Direct stream link (not stored locally).
  - `transcript`: Optional, can be scraped or AI-generated.
  - `transcript_source`: `rss`, `whisper`, `manual`.
- `ExternalPodcastSubscription`: User connection to a podcast.
  - `last_played_episode`: Resume capability.
  - `last_position`: Timestamp in seconds.
- `ExternalEpisodeInteraction`: Likes/Saves.

### Features
- **RSS Import**: `POST /api/external-podcasts/add/` (Admin) parses RSS feeds using `PodcastFeedService`.
- **OPML Import**: `POST /api/external-podcasts/import-opml/` allows bulk import.
- **iTunes Search**: `GET /api/external-podcasts/search/?q=` proxies requests to iTunes API.
- **Transcript Scraping**: `POST /api/external-episodes/<id>/scrape_transcript/` fetches text from the episode link.

### Key Files
- `server/api/views/external_podcast_views.py`: Main view logic.
- `server/api/services/external_podcast/feed_service.py`: RSS parsing logic.
- `server/api/services/external_podcast/scraper_service.py`: Transcript extraction.

---

## 2. AI Generated Podcasts
### Models
- `PodcastCategory`: Grouping for generated series (e.g., "Daily German News").
  - `series_bible`: JSON context for continuity.
- `Podcast`: The generated outcome.
  - `audio_file`: Local file (MP3).
  - `speech_marks`: Timestamped alignment for karaoke-style display.

### Generation Pipeline
1.  **Script Generation**: `agent_podcast.py` writes the dialogue (Host/Guest).
2.  **Audio Synthesis**: `tts_views.py` / `unified_ai` calls TTS providers (OpenAI/ElevenLabs).
3.  **Alignment**: Timestamps are generated for transcript syncing.

### Key Files
- `server/api/views/podcast_views.py`: CRUD for AI podcasts.
- `server/api/agent_podcast.py`: Script generation logic.

## Usage Examples

### external_feed_sync
```python
# Force sync a podcast feed
from api.services.external_podcast import PodcastFeedService
service = PodcastFeedService()
data = service.parse_feed("https://rss.dw.com/xml/podcast_radioD")
# Update DB logic...
```
