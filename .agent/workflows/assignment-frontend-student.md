---
description: Create student UI for viewing and completing assignments
---

# Assignment Frontend - Student

## Prerequisites
- `/assignment-api` ✅
- `/classroom-frontend-student` ✅

## API Functions (`api.js`)
```javascript
export const getMyAssignments = (classroomId) => api.get(`/assignments/?classroom=${classroomId}`);
export const startAssignment = (id) => api.post(`/assignments/${id}/start/`);
export const submitAssignment = (id, data) => api.post(`/assignments/${id}/submit/`, data);
```

## Pages to Create

### 1. `MobileClassAssignments.jsx`
- List assignments for classroom
- Each card: title, due date, status badge, score (if graded)
- Filter: All, Pending, Completed
- Click → start or view

### 2. `MobileAssignmentView.jsx` (Student)
- Assignment info: title, description, due date
- Status display
- If not started → "Start" button
- If in progress → link to content
- If submitted → show score/feedback

### 3. `MobileAssignmentContent.jsx`
- Loads actual content based on content_type
- Exam → ExamPlayer component
- Story → StoryReader component
- etc.
- "Submit" button when done

## Assignment Flow
```
Not Started → [Start] → In Progress → [Complete Content] → [Submit] → Submitted → [Teacher Grades] → Graded
```

## Routes
```jsx
<Route path="/m/class/:id/assignments" element={<MobileClassAssignments />} />
<Route path="/m/assignment/:id/view" element={<MobileAssignmentView />} />
<Route path="/m/assignment/:id/do" element={<MobileAssignmentContent />} />
```

## Next → `/teacher-dashboard-frontend`
