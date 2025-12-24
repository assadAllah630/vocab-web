---
description: Phase 2 - Create frontend pages and audio player for external podcasts
---

# External Podcast - Phase 2: Frontend & Player

> **Plan**: `.context/plans/external-podcast-integration.md`
> **Prerequisite**: Complete Phase 1
> **Duration**: ~2-3 hours

---

## Step 1: Create Library Page

Create `client/src/pages/mobile/MobileExternalPodcastLibrary.jsx`:
- List podcasts from API
- Filter by level (A1-C2)
- Search by name
- Show featured podcasts
- Navigate to detail on click

---

## Step 2: Create Detail Page

Create `client/src/pages/mobile/MobileExternalPodcastDetail.jsx`:
- Show podcast artwork, title, author, level
- List episodes with play buttons
- Display duration, date for each episode
- Navigate to player on play click

---

## Step 3: Create Episode Player

Create `client/src/pages/mobile/MobileExternalEpisodePlayer.jsx`:
- Stream audio directly via `<audio src={episode.audio_url}>`
- Play/pause, seek, progress bar
- Playback speed control (0.75x - 2x)
- Skip forward/back buttons
- Show "Streaming" indicator

**Key**: Audio streams directly from source URL - no download!

---

## Step 4: Add Routes

Add to `client/src/MobileApp.jsx`:
```jsx
<Route path="/m/podcast-library" element={<MobileExternalPodcastLibrary />} />
<Route path="/m/external-podcast/:id" element={<MobileExternalPodcastDetail />} />
<Route path="/m/external-episode/:id/play" element={<MobileExternalEpisodePlayer />} />
```

---

## Step 5: Add Entry Point

Add link to `client/src/pages/mobile/MobilePractice.jsx`:
- "Podcast Library" card with Headphones icon
- Navigate to `/m/podcast-library`

---

## Verification

// turbo
```bash
cd client && npm run lint && npm run build
```

Test: Practice → Podcast Library → Select podcast → Play episode

---

## Files Summary

| File | Action |
|------|--------|
| `MobileExternalPodcastLibrary.jsx` | New |
| `MobileExternalPodcastDetail.jsx` | New |
| `MobileExternalEpisodePlayer.jsx` | New |
| `MobileApp.jsx` | Add 3 routes |
| `MobilePractice.jsx` | Add entry link |

---

*Next: `/external-podcast-phase3`*
