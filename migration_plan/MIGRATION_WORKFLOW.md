# React to Flutter Migration Workflow


This checklist tracks the porting of every component from `client/src` to the new Flutter project.

> **CRITICAL INSTRUCTION:**
> Before starting any item, **READ** the [MIGRATION_COMPONENTS_DEEP.csv](MIGRATION_COMPONENTS_DEEP.csv) row for that component to understand its complexity, hooks, and dependencies.
> **SMART MATCHING:** Check [FLUTTER_RESOURCES.md](FLUTTER_RESOURCES.md) to find pre-built packages before writing custom code!
> **AFTER** completing an item, **UPDATE** the CSV by marking `Is Migrated` and `Is Tested` with `TRUE`.

## Phase 1: Foundation (Setup)
- [ ] **Project Init:** logic already installed.
- [ ] **Dependencies:** Add `dio`, `go_router`, `flutter_riverpod`, `google_fonts`, `lucide_icons`, `getwidget`.
- [ ] **Special Libs:** Add `flutter_markdown`, `confetti`, `lottie`, `webview_flutter`, `flutter_animate`.
- [ ] **Theming:** Create `lib/core/theme/app_theme.dart` matching `index.css`/Tailwind colors.
- [ ] **Navigation:** Setup `lib/core/router/router.dart` with `GoRouter`.
- [ ] **API Client:** Port `api.js` to `lib/core/network/api_client.dart` (Dio instance). [See Guide](BACKEND_CONNECTION.md)
- [ ] **Auth Provider:** Port `AuthContext` to `lib/core/providers/auth_provider.dart` (Riverpod).

## Phase 2: Core Layouts (High Dependency)
*These must be built first as they wrap other pages.*
- [ ] **Main Layout:** `MobileLayout.jsx` -> `lib/core/layouts/main_layout.dart`
- [ ] **Wizard Layout:** `MobileAIWizardLayout.jsx` -> `lib/core/layouts/wizard_layout.dart`
- [ ] **Navbar:** `MobileNav.jsx` -> `lib/features/shared/widgets/mobile_nav.dart`

## Phase 3: Shared UI Components
*Port these from `client/src/components/mobile` and `components/`*
- [ ] **Markdown Renderer:** `MobileMarkdownRenderer.jsx` (Score 32) -> `lib/features/shared/widgets/markdown_renderer.dart`
- [ ] **Story Display:** `MobileStoryDisplay.jsx` (Score 46) -> `lib/features/shared/widgets/story_display.dart`
- [ ] **Buttons:** Create `PrimaryButton`, `SecondaryButton`.
- [ ] **Inputs:** Create `AppTextField` (wrapping `TextFormField`).

## Phase 4: Feature Migration (Page by Page)

### 3.1 Authentication
- [ ] **Login:** `Login.jsx` -> `lib/features/auth/screens/login_screen.dart`
- [ ] **Signup:** (If exists/shared) -> `signup_screen.dart`

### 3.2 Home & Dashboard
- [ ] **Home:** `MobileHome.jsx` -> `lib/features/home/screens/home_screen.dart`
- [ ] **Dashboard:** `MobileHeroDashboardPreview.jsx` -> `lib/features/home/widgets/dashboard_preview.dart`

### 3.3 AIGateway (Core Feature)
- [ ] **Gateway:** `MobileAIGateway.jsx` -> `lib/features/ai/screens/ai_gateway_screen.dart`
- [ ] **Generator:** `MobileAIGenerator.jsx` -> `lib/features/ai/screens/ai_generator_screen.dart`
- [ ] **Gen Article:** `MobileGenArticle.jsx` -> `lib/features/ai/screens/gen_article_screen.dart`
- [ ] **Gen Dialogue:** `MobileGenDialogue.jsx` -> `lib/features/ai/screens/gen_dialogue_screen.dart`
- [ ] **Gen Story:** `MobileGenStory.jsx` -> `lib/features/ai/screens/gen_story_screen.dart`

### 3.4 Library & Content
- [ ] **Content Library:** `MobileContentLibrary.jsx` -> `lib/features/library/screens/library_screen.dart`
- [ ] **Article Viewer:** `MobileArticleViewer.jsx` -> `lib/features/library/screens/article_viewer_screen.dart`
- [ ] **Dialogue Viewer:** `MobileDialogueViewer.jsx` -> `lib/features/library/screens/dialogue_viewer_screen.dart`
- [ ] **Story Viewer:** `MobileStoryViewer.jsx` -> `lib/features/library/screens/story_viewer_screen.dart`

### 3.5 Reader & Practice
- [ ] **Reader:** `MobileReader.jsx` -> `lib/features/reader/screens/reader_screen.dart` (Complex! Break down)
- [ ] **Practice:** `MobilePractice.jsx` -> `lib/features/practice/screens/practice_screen.dart`
- [ ] **Flashcards:** `MobileFlashcard.jsx` -> `lib/features/practice/screens/flashcard_screen.dart`
- [ ] **Memory Match:** `MobileMemoryMatch.jsx` -> `lib/features/practice/screens/memory_match_screen.dart`
- [ ] **Word Builder:** `MobileWordBuilder.jsx` -> `lib/features/practice/screens/word_builder_screen.dart`
- [ ] **Time Challenge:** `MobileTimeChallenge.jsx` -> `lib/features/practice/screens/time_challenge_screen.dart`

### 3.6 Exams
- [ ] **Exam Hub:** `MobileExam.jsx` -> `lib/features/exam/screens/exam_hub_screen.dart`
- [ ] **Exam Create:** `MobileExamCreate.jsx` -> `lib/features/exam/screens/exam_create_screen.dart`
- [ ] **Exam Play:** `MobileExamPlay.jsx` -> `lib/features/exam/screens/exam_play_screen.dart`

### 3.7 Vocabulary & Grammar
- [ ] **Words List:** `MobileWords.jsx` -> `lib/features/vocab/screens/vocab_list_screen.dart`
- [ ] **Add Word:** `MobileAddWord.jsx` -> `lib/features/vocab/screens/add_word_screen.dart`
- [ ] **Grammar Hub:** `MobileGrammar.jsx` -> `lib/features/grammar/screens/grammar_hub_screen.dart`
- [ ] **Grammar Gen:** `MobileGrammarGenerate.jsx` -> `lib/features/grammar/screens/grammar_gen_screen.dart`
- [ ] **Grammar Reader:** `MobileGrammarReader.jsx` -> `lib/features/grammar/screens/grammar_reader_screen.dart`

### 3.8 User Settings & Profile
- [ ] **Profile:** `MobileProfile.jsx` -> `lib/features/profile/screens/profile_screen.dart`
- [ ] **Edit Profile:** `MobileEditProfile.jsx` -> `lib/features/profile/screens/edit_profile_screen.dart`
- [ ] **API Settings:** `MobileAPISettings.jsx` -> `lib/features/settings/screens/api_settings_screen.dart`
- [ ] **Language Settings:** `MobileLanguageSettings.jsx` -> `lib/features/settings/screens/language_settings_screen.dart`
- [ ] **Notification Settings:** `MobileNotificationSettings.jsx` -> `lib/features/settings/screens/notification_settings_screen.dart`
- [ ] **Security Settings:** `MobileSecuritySettings.jsx` -> `lib/features/settings/screens/security_settings_screen.dart`
- [ ] **Help/About:** `MobileHelp.jsx` / `MobileAbout.jsx` -> `lib/features/settings/screens/help_screen.dart`

### 3.9 Other
- [ ] **Games Hub:** `MobileGames.jsx` -> `lib/features/games/screens/games_list_screen.dart`
- [ ] **Podcast Studio:** `MobilePodcastStudio.jsx` -> `lib/features/podcast/screens/podcast_studio_screen.dart`
- [ ] **Notifications:** `MobileNotifications.jsx` -> `lib/features/notifications/screens/notifications_screen.dart`

---

## Phase 4: Integration
- [ ] **Wire up API:** Replace all mock data in pages with `ref.watch(provider)`.
- [ ] **Testing:** Run integration tests on critical flows (Login -> Home -> Read).
