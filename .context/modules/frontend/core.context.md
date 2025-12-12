# Frontend Core Module Context

## Purpose

Desktop core pages:
- Dashboard
- Authentication (Login, Signup)
- Settings & Profile
- AI Gateway Dashboard

---

## Key Pages

### Dashboard
- [Dashboard.jsx](file:///e:/vocab_web/client/src/pages/Dashboard.jsx) - 21KB
  - Activity heatmap
  - Statistics overview
  - Quick actions

### Authentication
- [Login.jsx](file:///e:/vocab_web/client/src/pages/Login.jsx) - 29KB
  - Email/password login
  - Google OAuth
  - Registration

### Settings
- [Settings.jsx](file:///e:/vocab_web/client/src/pages/Settings.jsx) - 35KB
  - API keys management
  - Language preferences
  - Security settings

### Profile
- [Profile.jsx](file:///e:/vocab_web/client/src/pages/Profile.jsx) - 23KB
  - User info, avatar
  - Statistics
  - Following/Followers

### AI Gateway
- [AIGateway.jsx](file:///e:/vocab_web/client/src/pages/AIGateway.jsx) - 35KB
  - Provider status
  - Usage metrics
  - Key management

---

## Shared Context

- [AuthContext.jsx](file:///e:/vocab_web/client/src/context/AuthContext.jsx)
- [LanguageContext.jsx](file:///e:/vocab_web/client/src/context/LanguageContext.jsx)
  - `isNativeRTL`, `isTargetRTL` - RTL detection
  - Auto-sets `document.dir` when native language changes
  - `switchNativeLanguage()`, `switchLanguage()` for language pair management
- [api.js](file:///e:/vocab_web/client/src/api.js)

---

*Version: 1.0 | Created: 2025-12-10*
