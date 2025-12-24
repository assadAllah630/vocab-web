# Admin Analytics Context

## Purpose
Platform-wide analytics dashboards for tracking usage, engagement, and AI performance.

---

## Pages (4)

| File | Purpose |
|------|---------|
| `AIAnalytics.jsx` | AI Gateway usage, provider stats, costs |
| `CohortAnalytics.jsx` | User cohort analysis, retention |
| `ContentAnalytics.jsx` | Content creation metrics, popularity |
| `UserAnalytics.jsx` | User growth, engagement, activity |

---

## Location
`admin-client/src/pages/analytics/`

---

## Data Sources

### AIAnalytics
- `/api/ai-gateway/stats/` - Provider usage
- `/api/ai-gateway/keys/` - Key health
- `UsageLog` model aggregation

### CohortAnalytics
- User signup dates
- Retention calculations
- Activity cohorts

### ContentAnalytics
- `GeneratedContent` counts
- Exam statistics
- Podcast metrics

### UserAnalytics
- Daily/Weekly/Monthly active users
- Signup funnel
- Feature adoption

---

## Chart Components Used
- `LineChart.jsx` - Trends
- `PieChart.jsx` - Distributions
- `StatCard.jsx` - KPI cards

---

*Version: 1.1 | Updated: 2025-12-24*
