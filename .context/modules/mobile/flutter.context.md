# Flutter App Context

## Purpose
Native mobile app in `flutter_app/lib/`. Total: **18 feature modules, 73+ Dart files**.

---

## Architecture
```
lib/
├── core/           # Theme, API, routing, providers
├── features/       # Feature modules
├── main.dart       # Entry point
└── firebase_options.dart
```

---

## Feature Modules

### AI (6 files)
- `ai_gateway_screen.dart` - Provider health
- `ai_generator_screen.dart` - General AI gen
- `gen_story_screen.dart`, `gen_article_screen.dart`, `gen_dialogue_screen.dart`
- `ai_gateway_provider.dart` - State management

### Auth (3 files)
- `onboarding_screen.dart` - Welcome flow
- `login_screen.dart` - Auth UI
- `magnetic_words_background.dart` - Animated bg

### Home (2 files)
- `home_screen.dart` - Main dashboard
- `dashboard_preview.dart` - Stats widget

### Vocab (7 files)
- Word list, add word, flashcards, practice
- `vocab_provider.dart`

### Grammar (4 files)
- `grammar_dashboard_screen.dart` - Topics list
- `grammar_generate_screen.dart` - AI generation
- `grammar_reader_screen.dart` - Lesson viewer
- `grammar_provider.dart`

### Stories (4 files)
- Create, display, viewer, provider

### Article (4 files)
- Create, display, viewer, provider

### Dialogue (4 files)
- Create, display, viewer, provider

### Exams (4 files)
- `exam_dashboard_screen.dart` - Exam list
- `exam_create_screen.dart` - Create exam
- `exam_play_screen.dart` - Take exam
- `exam_provider.dart`

### Reader (6 files)
- `reader_screen.dart` - Smart reader
- Grammar screens, provider

### Library (3 files)
- `library_screen.dart` - Content library
- `content_viewers.dart` - Unified viewer

### Profile (7 files)
- Profile, edit, settings, API keys
- Language settings, subscription

### Settings (3 files)
- Theme, notifications, security

### Podcast (4 files)
- Studio, player, library
- `podcast_provider.dart`

### Games (1 file)
- `games_screen.dart` - Practice games

### Learn (1 file)
- `learn_screen.dart` - Learning hub

### Notifications (2 files)
- Screen + provider

### Shared (8 files)
- Reusable widgets, utilities

---

## State Management
Uses **Provider** pattern:
- Each feature has its own `*_provider.dart`
- Global providers in `core/providers/`

---

*Version: 1.0 | Created: 2025-12-24*
