---
description: Create teacher dashboard UI with stats, activity feed, and student insights
---

# Teacher Dashboard Frontend

## Prerequisites
- `/teacher-dashboard-api` ✅

## API Functions (`api.js`)
```javascript
export const getDashboardOverview = () => api.get('/teacher/dashboard/');
export const getClassroomStats = (id) => api.get(`/teacher/classrooms/${id}/stats/`);
export const getRecentActivity = () => api.get('/teacher/activity/');
export const getStudentPerformance = (cid, sid) => api.get(`/teacher/classrooms/${cid}/students/${sid}/performance/`);
```

## Pages to Create

### 1. `MobileTeacherDashboard.jsx`
- Overview cards: Classrooms, Students, Pending Grading, New Submissions
- Quick actions: Create Classroom, View Activity
- Classroom summary list with completion rates

### 2. `MobileActivityFeed.jsx`
- Chronological list of events
- Types: submission, join, grade
- Each item: icon, student, action, classroom, timestamp
- Pull to refresh

### 3. `MobileStudentInsight.jsx`
- Student header: name, classroom
- Stats: avg score, completion rate
- Assignment history table
- Performance trend (if data available)

## Components
- `StatCard` - icon, value, label, color
- `ActivityItem` - type icon, description, timestamp
- `PerformanceChart` - simple bar/line chart

## Routes
```jsx
<Route path="/m/teacher/dashboard" element={<MobileTeacherDashboard />} />
<Route path="/m/teacher/activity" element={<MobileActivityFeed />} />
<Route path="/m/teacher/student/:classroomId/:studentId" element={<MobileStudentInsight />} />
```

## Next → `/learning-events-pipeline`
