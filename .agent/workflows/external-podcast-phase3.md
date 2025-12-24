---
description: Phase 3 - Background sync, iTunes search, OPML import/export, context updates
---

# External Podcast - Phase 3: Search & Polish

> **Plan**: `.context/plans/external-podcast-integration.md`
> **Prerequisite**: Complete Phase 1 & 2
> **Duration**: ~1-2 hours
> **Cost**: $0 - All APIs are FREE!

---

## Step 1: Add iTunes Search (FREE)

Add to `external_podcast_views.py`:

```python
@api_view(['GET'])
def search_podcasts_itunes(request):
    """Search iTunes API - FREE, no key needed."""
    query = request.query_params.get('q')
    response = requests.get(
        'https://itunes.apple.com/search',
        params={'term': query, 'entity': 'podcast', 'limit': 25}
    )
    # Return results with feed_url for each podcast
```

Route: `path('external-podcasts/search/', ...)`

---

## Step 2: Add OPML Import (FREE)

Add endpoints:
- `POST /external-podcasts/import-opml/` - Parse OPML XML, add podcasts
- `GET /external-podcasts/export-opml/` - Export subscriptions as OPML

Use `xml.etree.ElementTree` - no extra package needed.

---

## Step 3: Add User Subscriptions

Add endpoints:
- `POST /external-podcasts/<id>/subscribe/`
- `DELETE /external-podcasts/<id>/unsubscribe/`
- `GET /my-podcast-subscriptions/`

---

## Step 4: Background Sync (Optional)

If Celery is configured, add to `tasks.py`:
- `sync_external_podcast(podcast_id)` - Sync single podcast
- `sync_all_external_podcasts()` - Daily task via Celery Beat

---

## Step 5: Frontend Search Component

Create `components/mobile/PodcastSearch.jsx`:
- Search input → calls iTunes API
- Display results with artwork
- "Add" button to add podcast to library

---

## Step 6: Update Context Files

Update `.context/modules/backend/podcast.context.md`:
- Add External Podcasts section
- Document new models and endpoints

Update `.context/architecture.md`:
- Add EXTERNAL_PODCAST domain

---

## Verification

// turbo
```bash
cd server && python manage.py check
```

// turbo
```bash
cd client && npm run build
```

---

## API Summary (All FREE!)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/external-podcasts/search/` | GET | iTunes search |
| `/external-podcasts/import-opml/` | POST | Import OPML |
| `/external-podcasts/export-opml/` | GET | Export OPML |
| `/<id>/subscribe/` | POST | Subscribe |
| `/<id>/unsubscribe/` | DELETE | Unsubscribe |

**Total cost: $0** 🎉

---

*Phase 3 of 3 - COMPLETE*
