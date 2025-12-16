---
description: Flutter Migration Phase 4 - Feature Screens & Integration (All pages + API wiring)
---

# Phase 4: Feature Migration & Integration

> Migrate all feature screens page-by-page, then wire up real API.
> **SMART MATCHING:** Check `migration_plan/FLUTTER_RESOURCES.md` for every component before writing custom code!
> **CSV TRACKING:** Update `MIGRATION_COMPONENTS_DEEP.csv` after each file.

## Prerequisites
- Phase 3 completed (`/migrate-phase3`)
- Shared widgets available

## Feature Groups (Migrate in Order)

### 4.1 Authentication
- `Login.jsx` -> `lib/features/auth/screens/login_screen.dart`
- `Signup` (if exists) -> `signup_screen.dart`

### 4.2 Home & Dashboard
- `MobileHome.jsx` -> `lib/features/home/screens/home_screen.dart`
- `MobileHeroDashboardPreview.jsx` -> `lib/features/home/widgets/dashboard_preview.dart`

### 4.3 AI Gateway (Core Feature)
- `MobileAIGateway.jsx` -> `lib/features/ai/screens/ai_gateway_screen.dart`
- `MobileAIGenerator.jsx` -> `lib/features/ai/screens/ai_generator_screen.dart`
- `MobileGenArticle.jsx` -> `lib/features/ai/screens/gen_article_screen.dart`
- `MobileGenDialogue.jsx` -> `lib/features/ai/screens/gen_dialogue_screen.dart`
- `MobileGenStory.jsx` -> `lib/features/ai/screens/gen_story_screen.dart`

### 4.4 Library & Content
- `MobileContentLibrary.jsx` -> `lib/features/library/screens/library_screen.dart`
- `MobileArticleViewer.jsx` -> `lib/features/library/screens/article_viewer_screen.dart`
- `MobileDialogueViewer.jsx` -> `lib/features/library/screens/dialogue_viewer_screen.dart`
- `MobileStoryViewer.jsx` -> `lib/features/library/screens/story_viewer_screen.dart`

### 4.5 Reader & Practice (Complex!)
- `MobileReader.jsx` (Score 162) -> Split into Controller + View
- `MobilePractice.jsx` -> `lib/features/practice/screens/practice_screen.dart`
- `MobileFlashcard.jsx` -> `lib/features/practice/screens/flashcard_screen.dart`
- `MobileMemoryMatch.jsx` -> `lib/features/practice/screens/memory_match_screen.dart`
- `MobileWordBuilder.jsx` -> `lib/features/practice/screens/word_builder_screen.dart`
- `MobileTimeChallenge.jsx` -> `lib/features/practice/screens/time_challenge_screen.dart`

### 4.6 Exams
- `MobileExam.jsx` -> `lib/features/exam/screens/exam_hub_screen.dart`
- `MobileExamCreate.jsx` -> `lib/features/exam/screens/exam_create_screen.dart`
- `MobileExamPlay.jsx` -> `lib/features/exam/screens/exam_play_screen.dart`

### 4.7 Vocabulary & Grammar
- `MobileWords.jsx` -> `lib/features/vocab/screens/vocab_list_screen.dart`
- `MobileAddWord.jsx` -> `lib/features/vocab/screens/add_word_screen.dart`
- `MobileGrammar.jsx` -> `lib/features/grammar/screens/grammar_hub_screen.dart`
- `MobileGrammarGenerate.jsx` -> `lib/features/grammar/screens/grammar_gen_screen.dart`
- `MobileGrammarReader.jsx` -> `lib/features/grammar/screens/grammar_reader_screen.dart`

### 4.8 User Settings & Profile
- `MobileProfile.jsx` -> `lib/features/profile/screens/profile_screen.dart`
- `MobileEditProfile.jsx` -> `lib/features/profile/screens/edit_profile_screen.dart`
- `MobileAPISettings.jsx` -> `lib/features/settings/screens/api_settings_screen.dart`
- `MobileLanguageSettings.jsx` -> `lib/features/settings/screens/language_settings_screen.dart`
- `MobileNotificationSettings.jsx` -> `lib/features/settings/screens/notification_settings_screen.dart`
- `MobileSecuritySettings.jsx` -> `lib/features/settings/screens/security_settings_screen.dart`
- `MobileHelp.jsx` / `MobileAbout.jsx` -> `lib/features/settings/screens/help_screen.dart`

### 4.9 Other Features
- `MobileGames.jsx` -> `lib/features/games/screens/games_list_screen.dart`
- `MobilePodcastStudio.jsx` -> `lib/features/podcast/screens/podcast_studio_screen.dart`
- `MobileNotifications.jsx` -> `lib/features/notifications/screens/notifications_screen.dart`

---

## Integration Steps

1. **Wire up API**
   - Replace all mock data with `ref.watch(provider)`
   - Connect Riverpod providers to ApiClient

2. **Testing**
   - Run integration tests on critical flows:
     - Login -> Home -> Read
     - Generate Story -> View Story
     - Add Word -> Practice Flashcard

3. **Build APK**
   ```bash
   flutter build apk --release
   ```
   Output: `build/app/outputs/flutter-apk/app-release.apk`

## CSV Update
- Mark ALL migrated items as `Is Migrated = TRUE`
- Mark ALL tested items as `Is Tested = TRUE`

## Migration Complete! 🎉
