---
description: Create teacher-facing classroom management UI components for web and mobile
---

# Teacher Frontend

## Prerequisites
- All Phase 1 backend workflows ✅

## Files to Create

### 1. `api.js` additions
```javascript
export const checkTeacherStatus = () => api.get('/teachers/status/');
export const becomeTeacher = (data) => api.post('/teachers/become/', data);
export const getMyClassrooms = () => api.get('/classrooms/my_teaching/');
export const createClassroom = (data) => api.post('/classrooms/', data);
export const getClassroom = (id) => api.get(`/classrooms/${id}/`);
export const regenerateInviteCode = (id) => api.post(`/classrooms/${id}/regenerate_invite/`);
export const getClassroomStudents = (id) => api.get(`/classrooms/${id}/students/`);
export const approveStudent = (cid, mid) => api.post(`/classrooms/${cid}/students/${mid}/approve/`);
```

### 2. `MobileTeacherHome.jsx`
- If not teacher → show "Become Teacher" form
- If teacher → list classrooms from `getMyClassrooms()`
- Stats: classroom count, student count, pending count
- "+" button → `/m/classroom/create`

### 3. `MobileClassroomCreate.jsx`
- Form: name, description, language, level, max_students, requires_approval
- Submit → `createClassroom()` → redirect to detail

### 4. `MobileClassroomDetail.jsx`
- Show invite code with copy button
- List students with approve/remove actions
- Pending requests section

### 5. Routes
```jsx
<Route path="/m/teacher" element={<MobileTeacherHome />} />
<Route path="/m/classroom/create" element={<MobileClassroomCreate />} />
<Route path="/m/classroom/:id" element={<MobileClassroomDetail />} />
```

## Next → `/classroom-frontend-student`
