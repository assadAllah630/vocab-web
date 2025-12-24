---
description: Mobile-responsive optimization for all classroom-related pages
---

# Classroom Mobile Optimize

## Prerequisites
All classroom workflows ✅

## Scope
Final polish pass ensuring all new classroom features are fully mobile-optimized.

## Optimization Checklist

### 1. Touch Targets
- [ ] All buttons ≥ 44x44px
- [ ] List items have adequate tap areas
- [ ] Swipe actions on list items (delete, quick actions)
- [ ] No hover-dependent UI

### 2. Performance
- [ ] Lazy load heavy components (charts, lists > 50 items)
- [ ] Image optimization (WebP, lazy loading)
- [ ] API response caching with SWR/React Query
- [ ] Skeleton loaders for async content
- [ ] Virtualized lists for large datasets

### 3. Responsive Patterns

```jsx
// Breakpoint hook
const isMobile = useMediaQuery('(max-width: 768px)');

// Conditional rendering
{isMobile ? <MobileView /> : <DesktopView />}
```

### 4. Navigation Patterns
- Bottom tab bar for main sections
- Back button + swipe-to-go-back
- Pull-to-refresh on lists
- Floating action buttons for primary actions

### 5. Form Optimization
- [ ] Input type="email/tel/number" for proper keyboards
- [ ] Autofocus first field on modal open
- [ ] Dismiss keyboard on scroll
- [ ] Form validation with inline errors

### 6. Offline Support (Progressive)
```javascript
// Cache key data
const cacheMyClassrooms = async () => {
  const res = await api.get('/classrooms/my_enrolled/');
  localStorage.setItem('cached_classrooms', JSON.stringify(res.data));
};

// Fallback to cache
const getClassrooms = async () => {
  try {
    return await api.get('/classrooms/my_enrolled/');
  } catch {
    return JSON.parse(localStorage.getItem('cached_classrooms') || '[]');
  }
};
```

### 7. Animation Guidelines
- Use `framer-motion` for page transitions
- Keep animations < 300ms
- Reduce motion for accessibility: `prefers-reduced-motion`
- Stagger list item animations

### 8. Testing Checklist
- [ ] Test on iOS Safari, Chrome Android
- [ ] Test with slow 3G throttling
- [ ] Test with screen reader (VoiceOver/TalkBack)
- [ ] Test landscape orientation
- [ ] Test with large font/accessibility settings

## Key Components to Optimize

| Component | Optimizations |
|-----------|--------------|
| `ClassroomCard` | Skeleton, tap feedback, swipe actions |
| `AssignmentList` | Virtualization, infinite scroll |
| `StudentList` | Search debounce, lazy avatars |
| `SessionCalendar` | Horizontal scroll on mobile |
| `InsightCard` | Collapsible, cache |
| `NotificationList` | Mark read on scroll |

## Mobile-Specific Features
- Share classroom via native share sheet
- Add session to device calendar
- Haptic feedback on important actions
- Biometric auth for teacher features

## PWA Considerations
```json
// manifest.json additions
{
  "display": "standalone",
  "orientation": "portrait",
  "shortcuts": [
    {"name": "My Classes", "url": "/m/classes"},
    {"name": "Join Class", "url": "/m/join-class"}
  ]
}
```

## 🎉 WORKFLOW COMPLETE

This is the final workflow. Full classroom system is now documented across 28 workflows.
