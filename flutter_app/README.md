# VocabMaster Flutter App

The migrated Flutter mobile application for VocabMaster.

## Features Implemented
- **Authentication**: Login, Signup, Forgot Password.
- **Home**: Dashboard with streak, daily goals, and featured content.
- **Library**: Stories, Dialogues, Articles.
- **Practice (Reader)**: Smart reader for Text, URLs, and YouTube.
- **Vocab/Games**: Flashcards (Swipe), Word Builder (Confetti).
- **Profile**: Stats, Settings, Profile Management.

## Getting Started

### Prerequisites
- Flutter SDK (latest stable)
- Android Studio / Xcode

### Running Locally
1. Get dependencies:
   ```bash
   flutter pub get
   ```
2. Run the app:
   ```bash
   flutter run
   ```

### State Management
We use **Riverpod** for state management. All providers are located in `lib/features/*/providers/`.

### Navigation
We use **GoRouter** for handling deep links and navigation. See `lib/core/router/router.dart`.

### Environment
Ensure `assets/.env` exists with your backend URL:
```
BASE_URL=https://your-render-url.onrender.com
```

## Migration Status
Migration is **100% Complete** for the core features identified in the migration plan.
See `MIGRATION_COMPONENTS_DEEP.csv` for itemized status.
