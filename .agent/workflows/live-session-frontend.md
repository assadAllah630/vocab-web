---
description: Create session scheduling, calendar, and join flow UI
---

# Live Session Frontend

## Prerequisites
- `/live-session-models` ✅

## API Functions (`api.js`)
```javascript
export const getUpcomingSessions = () => api.get('/sessions/upcoming/');
export const createSession = (data) => api.post('/sessions/', data);
export const joinSession = (id) => api.post(`/sessions/${id}/join/`);
export const leaveSession = (id) => api.post(`/sessions/${id}/leave/`);
export const startSession = (id) => api.post(`/sessions/${id}/start/`);
export const endSession = (id) => api.post(`/sessions/${id}/end/`);
export const getAttendance = (id) => api.get(`/sessions/${id}/attendance/`);
```

## Components

### 1. `SessionCalendar.jsx`
**Monthly/weekly calendar view of sessions**
```
┌──────────────────────────────────┐
│  December 2024        < Week >   │
├──────────────────────────────────┤
│ Mon   Tue   Wed   Thu   Fri     │
│  16    17    18    19    20     │
│       ●           ●●            │
│  23    24    25    26    27     │
│  ●                              │
└──────────────────────────────────┘
● = session indicator (click to expand)
```

### 2. `SessionCard.jsx`
```
┌────────────────────────────────────┐
│ 📹 Speaking Practice               │
│ Tomorrow, 18:00 (60 min)          │
│ German B1 Evening Class            │
│ ──────────────────────────────────│
│ [📎 Materials]  [🔗 Join Meeting]  │
└────────────────────────────────────┘
```

### 3. `CreateSessionModal.jsx` (Teacher)
- Title, description
- Date/time picker with timezone
- Duration selector
- Session type (video/audio/in-person)
- Meeting URL (manual or generate)
- Attach materials (select from content)
- Set reminders (30min, 1hr, 1day before)

### 4. `SessionDetailView.jsx`
**Before session:** countdown, materials, join button
**During session:** status badge, attendance list (teacher)
**After session:** recording link, attendance report

### 5. `AttendanceReport.jsx` (Teacher)
```
┌────────────────────────────────────┐
│ Attendance: Speaking Practice      │
│ Total: 12 | Attended: 10 (83%)    │
├────────────────────────────────────┤
│ ✅ Anna Schmidt    58 min          │
│ ✅ Max Weber       60 min          │
│ ❌ Lisa Brown      Absent          │
│ ⚠️ Tom Lee         22 min (early)  │
└────────────────────────────────────┘
```

## Routes
```jsx
<Route path="/m/sessions" element={<MobileSessionList />} />
<Route path="/m/session/:id" element={<MobileSessionDetail />} />
<Route path="/m/classroom/:id/schedule" element={<MobileCreateSession />} />
<Route path="/m/session/:id/attendance" element={<MobileAttendanceReport />} />
```

## Real-time Features (Optional WebSocket)
- Session status updates (scheduled → live → completed)
- Attendance count updates during session
- Teacher "session starting" broadcast

## Next → `/organization-admin`
