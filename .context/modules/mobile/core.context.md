# Mobile Core Module Context

## Purpose

Mobile core pages (32 total mobile pages):
- Home dashboard
- Profile & settings
- Navigation

---

## Key Pages

### Home
- [MobileHome.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileHome.jsx) - 19KB
  - Quick actions
  - Stats overview
  - Recent activity

### Profile
- [MobileProfile.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileProfile.jsx) - 15KB
- [MobileEditProfile.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileEditProfile.jsx) - 11KB

### Settings
- [MobileAPISettings.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileAPISettings.jsx) - 11KB
- [MobileLanguageSettings.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileLanguageSettings.jsx) - 10KB
  - Uses `useLanguage()` for RTL direction switching
  - Sets `document.dir` automatically for Arabic/RTL languages
  - Data isolated by language pair (target + native)
- [MobileSecuritySettings.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileSecuritySettings.jsx) - 10KB

### AI Gateway
- [MobileAIGateway.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileAIGateway.jsx) - 40KB

### Other
- [MobileAbout.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileAbout.jsx) - 5KB
- [MobileHelp.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileHelp.jsx) - 5KB

---

*Version: 1.0 | Created: 2025-12-10*
