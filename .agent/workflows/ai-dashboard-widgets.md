---
description: Frontend components for displaying AI insights on dashboards
---

# AI Dashboard Widgets

## Prerequisites
- `/ai-insights-api` ✅

## Architecture
Reusable React components that fetch and display AI data with loading states, caching, and animations.

## Components

### 1. `InsightCard.jsx`
```jsx
// Smart card that auto-fetches and displays AI insights
// Props: userId?, refreshInterval?, compact?
// States: loading, error, data
// Features: skeleton loading, pull-to-refresh, expand/collapse
```

### 2. `RecommendationList.jsx`
```jsx
// Priority-sorted recommendations with action buttons
// Props: limit?, onAction?
// Renders: priority badge, title, reason, CTA button
// Animation: stagger fade-in on load
```

### 3. `WeaknessRadar.jsx`
```jsx
// Radar chart showing skill mastery across categories
// Props: data (from /ai/weaknesses/)
// Uses: recharts or chart.js
// Shows: vocabulary, grammar, listening, reading, speaking axes
```

### 4. `SkillMasteryBar.jsx`
```jsx
// Horizontal progress bars for top/weak skills
// Props: skills[], threshold?
// Color: green (>80%), yellow (50-80%), red (<50%)
// Animation: fill animation on mount
```

### 5. `AIAlertBanner.jsx`
```jsx
// Dismissible alert for urgent AI insights
// Props: type ('warning'|'info'|'success'), message, action?
// Shows: decaying skills, overdue assignments, achievements
```

## Custom Hook: `useAIInsights.js`
```javascript
export function useAIInsights(userId = null) {
  const [data, setData] = useState({ insights: null, recs: null, weaknesses: null });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      api.get('/ai/insights/'),
      api.get('/ai/recommendations/'),
      api.get('/ai/weaknesses/')
    ]).then(([i, r, w]) => {
      setData({ insights: i.data, recs: r.data, weaknesses: w.data });
      setLoading(false);
    });
  }, [userId]);
  
  return { ...data, loading, refresh: () => {...} };
}
```

## Integration Points
- `MobileHome` → InsightCard (compact)
- `MobileTeacherDashboard` → Student InsightCards
- `MobileClassroomStudent` → RecommendationList
- `MobileProfile` → WeaknessRadar, SkillMasteryBar

## Next → `/learning-path-models`
