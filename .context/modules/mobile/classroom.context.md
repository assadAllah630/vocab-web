# Classroom Mobile Context

## Features
- **Teacher Dashboard**: Mobile-first overview of classroom activity, student progress, and upcoming sessions.
- **Assignment View**: Students can view, start, and submit assignments. Support for various content types (nodes).
- **Session Player**: Integrated joining of live sessions with status tracking.
- **Learning Path View**: Interactive roadmap of curriculum nodes with progress indicators.

## Mobile Optimizations (`utils/mobileOptimizations.js`)
- **Offline Caching**: TTL-based storage for classrooms and paths to ensure instant load.
- **Pull-to-Refresh**: Native-feeling gesture for updating classroom lists.
- **44px Targets**: All interactive elements (buttons, chips) meet accessibility standards.
- **Skeleton Loaders**: `CardSkeleton` and `PageSkeleton` used for perceived speed.

## Navigation Patterns
- **Teacher**: Root path `/m/class/:id` shows analytics and management quick actions.
- **Student**: Root path `/m/class/:id` shows current assignments and learning path roadmap.

## Custom Hooks (`hooks/useMobileOptimizations.js`)
- `usePullToRefresh`: Integrated into `MobileMyClasses.jsx`.
- `useIsMobile`: UI adapts based on viewport.
- `useOnlineStatus`: Displays offline warning when network is lost.
