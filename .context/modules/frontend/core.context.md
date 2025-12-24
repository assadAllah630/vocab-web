# Frontend Core Module Context

## Purpose
Complete inventory of desktop frontend in `client/src/`. Total: **94 JSX/JS files**.

---

## Root Files (7)
| File | Size | Purpose |
|------|------|---------|
| `App.jsx` | 29KB | Main router, layout |
| `api.js` | 11KB | Axios client, auth headers |
| `examApi.js` | 0.5KB | Exam-specific API |
| `firebase.js` | 1.5KB | Firebase config |
| `main.jsx` | 0.7KB | Entry point |
| `App.css` | 0.6KB | Global styles |
| `index.css` | 5KB | Base styles |

---

## Pages (32) - Desktop Only

### Core / Auth
| Page | Size | Purpose |
|------|------|---------|
| `Dashboard.jsx` | 22KB | Main dashboard, stats |
| `Login.jsx` | 29KB | Auth (email, OTP, Google) |
| `TeacherLogin.jsx` | 27KB | Teacher auth flow |
| `Settings.jsx` | 24KB | User settings |
| `Profile.jsx` | 23KB | User profile |
| `PublicProfile.jsx` | 11KB | Public profile view |
| `LandingPage.jsx` | 30KB | Marketing homepage |
| `StatsDashboard.jsx` | 5KB | Statistics |

### Vocabulary
| Page | Size | Purpose |
|------|------|---------|
| `VocabList.jsx` | 32KB | Word list, SRS |
| `AddWord.jsx` | 27KB | Add vocabulary |
| `QuizSelector.jsx` | 4KB | Quiz mode select |
| `QuizPlay.jsx` | 29KB | Quiz runner |
| `SharedBank.jsx` | 6KB | Community bank |

### Exams
| Page | Size | Purpose |
|------|------|---------|
| `ExamPage.jsx` | 58KB | Exam hub |

### Content Generation
| Page | Size | Purpose |
|------|------|---------|
| `TextGenerator.jsx` | 22KB | Simple text gen |
| `AdvancedTextGenerator.jsx` | 22KB | Story/Article wizard |
| `GrammarGenerator.jsx` | 13KB | Grammar exercises |
| `PodcastCreator.jsx` | 21KB | Podcast creation |

### Content Viewers
| Page | Size | Purpose |
|------|------|---------|
| `StoryViewer.jsx` | 18KB | Story display |
| `ArticleViewer.jsx` | 7KB | Article reader |
| `DialogueViewer.jsx` | 13KB | Dialogue view |
| `GeneratedContentLibrary.jsx` | 9KB | Content library |
| `GrammarLibrary.jsx` | 22KB | Grammar topics |
| `GrammarPage.jsx` | 38KB | Grammar lesson |
| `MyPodcasts.jsx` | 7KB | Podcast library |
| `TextReader.jsx` | 20KB | Smart reader |

### Classroom
| Page | Size | Purpose |
|------|------|---------|
| `TeacherDashboard.jsx` | 16KB | Teacher home |
| `ClassroomDetail.jsx` | 13KB | Classroom view |
| `CreateSession.jsx` | 20KB | Session scheduling |
| `SessionDetail.jsx` | 25KB | Session info |

### AI Gateway
| Page | Size | Purpose |
|------|------|---------|
| `AIGateway.jsx` | 35KB | AI admin |

### Games
| Page | Size | Purpose |
|------|------|---------|
| `MiniGames.jsx` | 9KB | Game selection |

---

## Components (48)

### Live Session
- `VideoRoom.jsx` - LiveKit integration
- `Whiteboard.jsx` - tldraw collaboration
- `LiveQuiz.jsx` - Real-time quizzes
- `DesktopControls.jsx`, `MobileControls.jsx` - Video controls
- `VideoChat.jsx` - Video/chat layout
- `BreakoutSystem.jsx` - Breakout rooms
- `ReactionSystem.jsx` - Emoji reactions

### Navigation
- `Navbar.jsx` - Top nav
- `Sidebar.jsx` - Side menu
- `RouteGuards.jsx` - Auth guards

### AI & Interactive
- `AIAssistant.jsx` - Chat assistant
- `AISetupModal.jsx` - API key setup
- `TagManager.jsx` - Vocab tagging
- `ReaderPractice.jsx` - Inline practice
- `ContentSelector.jsx` - Content picker
- `ExamQuestions.jsx` - Question display
- `FloatingExamTimer.jsx` - Exam timer
- `GrammarViewer.jsx` - Grammar display

### Landing Page
- `HeroSection.jsx`, `FeatureSection.jsx`, `PricingSection.jsx`
- `ParticleBrain.jsx` - Animated brain
- `MagneticButton.jsx`, `MagneticWords.jsx` - Animations
- `SpotlightCard.jsx`, `HeroDashboardPreview.jsx`
- `AppSimulation.jsx`, `ArcadeSection.jsx`
- `SmartReaderDemo.jsx`, `PodcastDemo.jsx`, `StatsDemo.jsx`

### Utility
- `ErrorBoundary.jsx`, `ErrorFallback.jsx`
- `InstallPrompt.jsx` - PWA install
- `OfflineIndicator.jsx` - Offline status
- `BiDiText.jsx` - RTL support
- `HLRStatsCard.jsx` - SRS stats
- `VocabularyMastery.jsx` - Mastery display
- `ActivityHeatmap.jsx` - GitHub-style heatmap

### Shared
- `Logo.jsx`, `CustomCursor.jsx`
- `GoogleAuthButton.jsx`
- `AnimatedIcons.jsx`, `AnimatedAIIcons.jsx`
- `AssignmentPathSelector.jsx`
- `GameVX.jsx` - Game component

---

## Context (3)
| File | Purpose |
|------|---------|
| `AuthContext.jsx` | User state, login/logout |
| `LanguageContext.jsx` | Language pair, RTL |
| `ExamContext.jsx` | Exam state |

---

## Hooks (3)
| File | Purpose |
|------|---------|
| `useMobileOptimizations.js` | Mobile detection |
| `usePushNotifications.jsx` | Push subscription |
| `useTranslation.js` | i18n hook |

---

## Services (3)
| File | Purpose |
|------|---------|
| `AuthService.js` | Auth API |
| `TokenManager.js` | Token refresh |
| `OfflineStorage.js` | IndexedDB |

---

## Utils (5)
| File | Purpose |
|------|---------|
| `bidi.js` | RTL utilities |
| `mobileOptimizations.js` | Performance |
| `offlineStorage.js` | Offline sync |
| `pushNotifications.js` | Push helpers |
| `SoundManager.js` | Audio effects |

---

*Version: 2.0 | Updated: 2025-12-24*
