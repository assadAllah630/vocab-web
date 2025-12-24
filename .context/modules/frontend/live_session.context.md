# Frontend Live Session Module Context

## Purpose
Real-time video classroom experience using LiveKit.

---

## Key Components

### VideoRoom
- [VideoRoom.jsx](file:///e:/vocab_web/client/src/components/VideoRoom.jsx)
  - LiveKit connection.
  - Video grid layout.
  - Participant list.
  - Chat sidebar.

### Interactive Tools
- [Whiteboard.jsx](file:///e:/vocab_web/client/src/components/Whiteboard.jsx)
  - `tldraw` integration.
  - Delta sync via LiveKit Data Messages.
  - Dark mode (glassmorphism).
- [LiveQuiz.jsx](file:///e:/vocab_web/client/src/components/LiveQuiz.jsx)
  - Real-time quiz during session.
  - AI Quick Quiz generation.
  - Results broadcast.

### Controls
- [DesktopControls.jsx](file:///e:/vocab_web/client/src/components/DesktopControls.jsx)
  - Camera/Mic toggles.
  - Screen share button.
  - Leave/End session.
- [MobileControls.jsx](file:///e:/vocab_web/client/src/components/MobileControls.jsx)
  - Mobile-optimized control bar.

---

## LiveKit Integration

```javascript
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

// Join room with token from backend
<LiveKitRoom
  serverUrl={process.env.VITE_LIVEKIT_URL}
  token={sessionToken}
  connect={true}
>
  <VideoConference />
</LiveKitRoom>
```

---

*Version: 1.0 | Created: 2025-12-24*
