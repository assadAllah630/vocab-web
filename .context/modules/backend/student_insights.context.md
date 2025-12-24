# Student Insights Module Context

## Purpose
AI-powered learning analytics: weakness detection, recommendations, and progress insights.

---

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| `student_insights.py` | agents/ | Insights generation agent |
| `recommendation_agent.py` | agents/ | Content recommendations |
| `skill_tracker.py` | services/ | BKT skill tracking |
| `learning_events.py` | services/ | Event logging |
| `weakness_views.py` | views/ | Weakness endpoints |
| `recommendation_views.py` | views/ | Recommendation endpoints |

### Weakness Detection
Located in `services/weakness/`:
- `base.py` - Base detector class
- `detectors.py` - Specific detectors
- `service.py` - Detection service

---

## Models

| Model | Purpose |
|-------|---------|
| `LearningEvent` | Captures all learning activities |
| `Skill` / `SkillMastery` | BKT skill tracking |
| `StudentRemediation` | Catch-up assignments |

---

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/agent/insights/` | Generate student insights |
| `/recommendations/` | Get personalized content |
| `/skills/mine/` | User's skill mastery |

---

## Analytics Pipeline

```
Learning Event → Log → Aggregation → Weakness Detection → Recommendation
                                           ↓
                                     Teacher Alert (if in classroom)
```

---

*Version: 1.1 | Updated: 2025-12-24*
