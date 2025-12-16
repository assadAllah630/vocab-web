---
description: Flutter Migration Phase 1 - Foundation Setup (Dependencies, Theme, API, Auth)
---

# Phase 1: Foundation Setup

> **BEFORE STARTING:** 
> - Read `migration_plan/MIGRATION_CONTEXT.md` and `migration_plan/MIGRATION_RULES.md`
> - **SMART MATCHING:** Check `migration_plan/FLUTTER_RESOURCES.md` for pre-built packages!

## Prerequisites
- Flutter SDK installed at `E:\flutter_windows_3.38.3-stable\flutter`
- Run `flutter doctor` to verify environment

## Steps

1. **Create Flutter Project** (if not exists)
   ```bash
   cd e:\vocab_web
   flutter create flutter_app --org com.vocabmaster
   cd flutter_app
   ```

2. **Add Core Dependencies** to `pubspec.yaml`
   ```yaml
   dependencies:
     dio: ^5.4.0
     go_router: ^14.0.0
     flutter_riverpod: ^2.4.0
     google_fonts: ^6.1.0
     lucide_icons: ^0.257.0
     getwidget: ^4.0.0          # 1000+ pre-built components!
   ```

3. **Add Animation & Content Libraries** to `pubspec.yaml`
   ```yaml
   dependencies:
     # Animations (Pro-level!)
     flutter_animate: ^4.3.0    # Replaces framer-motion
     animations: ^2.0.0         # Material transitions
     lottie: ^3.0.0             # After Effects animations
     shimmer: ^3.0.0            # Loading skeletons
     confetti: ^0.7.0           # Celebrations
     
     # Content
     flutter_markdown: ^0.6.18
     webview_flutter: ^4.4.0    # For Mermaid diagrams
     
     # Utils
     flutter_secure_storage: ^9.0.0
     flutter_dotenv: ^5.1.0
   ```

4. **Install Dependencies**
   ```bash
   flutter pub get
   ```

5. **Create Theme File**
   - Create `lib/core/theme/app_theme.dart`
   - Port colors from `client/src/index.css` (Tailwind colors)

6. **Create Navigation**
   - Create `lib/core/router/router.dart`
   - Setup `GoRouter` with initial routes

7. **Create API Client**
   - Create `lib/core/network/api_client.dart`
   - Follow guide in `migration_plan/BACKEND_CONNECTION.md`

8. **Create Auth Provider**
   - Create `lib/core/providers/auth_provider.dart`
   - Port logic from `client/src/context/AuthContext`

## Verification
- Run `flutter run` to ensure app starts without errors
- Verify API client can reach backend

## Next Step
Run `/migrate-phase2` to continue with Core Layouts.
