# Admin Panel Core Context

## Purpose
Admin-only dashboard for platform management. Located in `admin-client/src/`. Total: **28 pages, 35 components**.

---

## Pages by Category

### Core (2 pages)
| File | Purpose |
|------|---------|
| `Dashboard.jsx` | Admin home, stats overview |
| `Login.jsx` | Admin authentication |

### Analytics (4 pages)
| File | Purpose |
|------|---------|
| `analytics/AIAnalytics.jsx` | AI usage metrics |
| `analytics/CohortAnalytics.jsx` | User cohort analysis |
| `analytics/ContentAnalytics.jsx` | Content performance |
| `analytics/UserAnalytics.jsx` | User engagement metrics |

### Content Management (5 pages)
| File | Purpose |
|------|---------|
| `content/VocabularyList.jsx` | Global vocab management |
| `content/GrammarList.jsx` | Grammar topics admin |
| `content/GeneratedContentList.jsx` | AI-generated content |
| `content/AdminLearningPathList.jsx` | Learning paths list |
| `content/AdminLearningPathBuilder.jsx` | Path creation/editing |

### Monitoring (4 pages)
| File | Purpose |
|------|---------|
| `monitoring/SystemHealth.jsx` | Server status, uptime |
| `monitoring/AIGateway.jsx` | AI provider health |
| `monitoring/ErrorLogs.jsx` | Error tracking |
| `monitoring/AuditLogs.jsx` | User action logs |

### School Management (5 pages)
| File | Purpose |
|------|---------|
| `school/AdminTeacherList.jsx` | All teachers |
| `school/AdminTeacherDetail.jsx` | Teacher profile |
| `school/AdminClassroomList.jsx` | All classrooms |
| `school/AdminClassroomDetail.jsx` | Classroom admin |
| `school/AdminGlobalActivity.jsx` | Cross-school activity |

### Settings (3 pages)
| File | Purpose |
|------|---------|
| `settings/Settings.jsx` | Platform settings |
| `settings/AISettings.jsx` | AI config |
| `settings/AdminUsers.jsx` | Admin user management |

### User Management (5 pages)
| File | Purpose |
|------|---------|
| `users/UserList.jsx` | All users table |
| `users/UserDetail.jsx` | User profile admin |
| `users/UserSheet.jsx` | Quick user view |
| `users/EnhancedUserManagement.jsx` | Advanced user ops |
| `users/TeacherApplicationsList.jsx` | Teacher applications |

---

## Key Components

### Layout
- `AdminLayout.jsx` - Main layout wrapper
- `AdminContentSelector.jsx` - Content type selector

### UI Library (20+ components)
Located in `components/ui/`:
- Buttons, Inputs, Cards, Dialogs
- Tables, Tabs, Tooltips
- DateRangePicker, Calendar
- Toast notifications

### Charts
Located in `components/charts/`:
- `LineChart.jsx`, `PieChart.jsx`, `StatCard.jsx`

### Common
- `DataTable.jsx` - Reusable data grid
- `CommandPalette.jsx` - Ctrl+K search
- `SlideOver.jsx` - Side panel

---

*Version: 2.0 | Updated: 2025-12-24*
