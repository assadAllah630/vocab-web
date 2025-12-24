---
description: Phase 1 - Create ExternalPodcast models, RSS parser service, and admin API
---

# External Podcast - Phase 1: Backend Foundation

> **Plan**: `.context/plans/external-podcast-integration.md`
> **Duration**: ~2 hours

---

## Step 1: Install Package

// turbo
```bash
cd server && pip install feedparser podcastparser && pip freeze | grep -E "feed|podcast" >> requirements.txt
```

---

## Step 2: Add Models

Open `server/api/models.py` and add these 3 models from the plan:
- `ExternalPodcast` - RSS feed source with level, language
- `ExternalEpisode` - Episode with `audio_url` for streaming
- `ExternalPodcastSubscription` - User subscriptions

> See "Proposed Architecture > New Models" section in plan for full code.

---

## Step 3: Create Migration

// turbo
```bash
cd server && python manage.py makemigrations api --name external_podcast_models
```

```bash
cd server && python manage.py migrate api
```

---

## Step 4: Create RSS Parser Service

Create folder and files:
```
server/api/services/external_podcast/
├── __init__.py
└── feed_parser.py
```

Implement `PodcastFeedService` class with `parse_feed()` method.

> See "RSS Feed Parser Service" section in plan for code.

---

## Step 5: Add Serializers

Add to `server/api/serializers.py`:
- `ExternalEpisodeSerializer`
- `ExternalPodcastSerializer`
- `ExternalPodcastDetailSerializer`
- `ExternalPodcastSubscriptionSerializer`

---

## Step 6: Create Views

Create `server/api/views/external_podcast_views.py`:
- `ExternalPodcastListView` - GET list with filtering
- `ExternalPodcastDetailView` - GET single with episodes
- `add_podcast_by_url` - POST admin endpoint
- `sync_podcast_feed` - POST admin sync

---

## Step 7: Add URL Routes

Add to `server/api/urls.py`:
```python
path('external-podcasts/', ...)
path('external-podcasts/<int:pk>/', ...)
path('external-podcasts/add/', ...)
path('external-podcasts/<int:pk>/sync/', ...)
```

---

## Step 8: Seed Initial Podcasts

Create management command `seed_external_podcasts.py` with DW podcast URLs:
- `https://rss.dw.com/xml/rss-de-langsamdeutsch` (B2)
- `https://rss.dw.com/xml/DKpodcast_topthema_de` (B1)
- `https://rss.dw.com/xml/dwn_podcast_deutschtrainer` (A1)

```bash
cd server && python manage.py seed_external_podcasts
```

---

## Verification

// turbo
```bash
cd server && python manage.py check
```

---

## Files Summary

| File | Action |
|------|--------|
| `requirements.txt` | Add feedparser |
| `api/models.py` | Add 3 models |
| `api/services/external_podcast/` | New package |
| `api/serializers.py` | Add 4 serializers |
| `api/views/external_podcast_views.py` | New file |
| `api/urls.py` | Add routes |

---

*Next: `/external-podcast-phase2`*
