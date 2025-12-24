# Classroom Feature Index

## Overview
All context files related to Teacher-Student Classrooms.

---

## Backend
| Context | Purpose |
|---------|---------|
| [classroom.context.md](file:///e:/vocab_web/.context/modules/backend/classroom.context.md) | Teacher, Classroom, Membership models |
| [organization.context.md](file:///e:/vocab_web/.context/modules/backend/organization.context.md) | Multi-tenant orgs |
| [learning_path.context.md](file:///e:/vocab_web/.context/modules/backend/learning_path.context.md) | Curriculum paths |
| [live_session.context.md](file:///e:/vocab_web/.context/modules/backend/live_session.context.md) | Live video classes |

## Frontend Desktop
| Page | Purpose |
|------|---------|
| `TeacherDashboard.jsx` | Teacher home |
| `ClassroomDetail.jsx` | Classroom view |
| `CreateSession.jsx` | Schedule session |
| `SessionDetail.jsx` | Session info |

## Mobile React
| Page | Purpose |
|------|---------|
| `MobileTeacherHome.jsx` | Teacher landing |
| `MobileTeacherDashboard.jsx` | Stats |
| `MobileTeacherClasses.jsx` | Class list |
| `MobileClassroomDetail.jsx` | Class view |
| `MobileClassroomStudent.jsx` | Student view |
| `MobileJoinClass.jsx` | Join via code |
| `MobileSessionList.jsx` | Sessions |

## Admin
| Page | Purpose |
|------|---------|
| `AdminTeacherList.jsx` | All teachers |
| `AdminClassroomList.jsx` | All classrooms |
| [school.context.md](file:///e:/vocab_web/.context/modules/admin/school.context.md) | School admin |

---

## Key Models
- `Teacher`, `Classroom`, `ClassMembership`
- `LiveSession`, `SessionAttendance`
- `Organization`, `OrganizationMembership`

---

*Feature Index v1.0*
