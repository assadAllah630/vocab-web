---
description: Create teacher UI for creating and managing assignments
---

# Assignment Frontend - Teacher

## Prerequisites
- `/assignment-api` ✅
- `/classroom-frontend-teacher` ✅

## API Functions (`api.js`)
```javascript
export const getClassroomAssignments = (cid) => api.get(`/assignments/?classroom=${cid}`);
export const createAssignment = (data) => api.post('/assignments/', data);
export const updateAssignment = (id, data) => api.patch(`/assignments/${id}/`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}/`);
export const getAssignmentProgress = (id) => api.get(`/assignments/${id}/progress_list/`);
export const gradeSubmission = (pid, data) => api.post(`/assignments/progress/${pid}/grade/`, data);
```

## Pages to Create

### 1. `MobileAssignmentCreate.jsx`
- Content type picker: Exam, Story, Article, Grammar, Vocab, Podcast
- Content browser (fetches existing content by type)
- Title, description, due date, max attempts
- Submit → `createAssignment()`

### 2. `MobileAssignmentDetail.jsx` (Teacher View)
- Assignment info header
- Student progress table: name, status, score, submitted_at
- Click row → grade modal
- Grade modal: score input, feedback textarea

### 3. `MobileGradeSubmission.jsx`
- Student info
- Submission data display
- Score input (0-100)
- Feedback textarea
- Submit → `gradeSubmission()`

## Routes
```jsx
<Route path="/m/classroom/:id/assign" element={<MobileAssignmentCreate />} />
<Route path="/m/assignment/:id" element={<MobileAssignmentDetail />} />
<Route path="/m/assignment/:id/grade/:progressId" element={<MobileGradeSubmission />} />
```

## Next → `/assignment-frontend-student`
