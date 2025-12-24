---
description: Create student-facing classroom UI for browsing, joining, and viewing enrolled classrooms
---

# Student Frontend

## Prerequisites
- `/classroom-frontend-teacher` ✅

## Files to Create

### 1. `api.js` additions
```javascript
export const getEnrolledClassrooms = () => api.get('/classrooms/my_enrolled/');
export const validateInviteCode = (code) => api.get(`/classrooms/validate/${code}/`);
export const joinClassroom = (code) => api.post('/classrooms/join/', { invite_code: code });
export const leaveClassroom = (id) => api.post(`/classrooms/${id}/leave/`);
```

### 2. `MobileMyClasses.jsx`
- List enrolled classrooms
- "Join" button → `/m/join-class`
- Empty state CTA

### 3. `MobileJoinClass.jsx`
- 8-char code input
- Auto-validate on 8 chars
- Show classroom preview
- Join button → redirect to class

### 4. `MobileClassroomStudent.jsx`
- Header: name, teacher, level
- Sections: Assignments, Content, Classmates
- Leave button with confirm

### 5. Routes
```jsx
<Route path="/m/classes" element={<MobileMyClasses />} />
<Route path="/m/join-class" element={<MobileJoinClass />} />
<Route path="/m/join/:code" element={<MobileJoinClass />} />
<Route path="/m/class/:id" element={<MobileClassroomStudent />} />
```

## Next → `/assignment-models`
