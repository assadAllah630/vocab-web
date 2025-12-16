---
description: Flutter Migration Phase 3 - Shared UI Components (Markdown, Buttons, Inputs)
---

# Phase 3: Shared UI Components

> Port reusable widgets before building feature screens.

## Prerequisites
- Phase 2 completed (`/migrate-phase2`)
- Core layouts working

## Steps

1. **Read CSV for complexity**
   - Open `migration_plan/MIGRATION_COMPONENTS_DEEP.csv`
   - Check: `MobileMarkdownRenderer` (Score 32), `MobileStoryDisplay` (Score 46)

2. **Create Markdown Renderer**
   - Source: `client/src/components/mobile/MobileMarkdownRenderer.jsx`
   - Target: `lib/features/shared/widgets/markdown_renderer.dart`
   - Uses: `flutter_markdown`, `flutter_highlighter`
   - For Mermaid: use `webview_flutter` to render HTML

3. **Create Story Display**
   - Source: `client/src/components/mobile/MobileStoryDisplay.jsx`
   - Target: `lib/features/shared/widgets/story_display.dart`
   - Includes: TTS controls, bookmarking, font size

4. **Create Article Display**
   - Source: `client/src/components/mobile/MobileArticleDisplay.jsx`
   - Target: `lib/features/shared/widgets/article_display.dart`

5. **Create Dialogue Display**
   - Source: `client/src/components/mobile/MobileDialogueDisplay.jsx`
   - Target: `lib/features/shared/widgets/dialogue_display.dart`

6. **Create Base UI Components**
   - `lib/features/shared/widgets/primary_button.dart`
   - `lib/features/shared/widgets/secondary_button.dart`
   - `lib/features/shared/widgets/app_text_field.dart`

7. **Update CSV**
   - Mark `Is Migrated = TRUE` for completed items

## Verification
- Markdown renders correctly with syntax highlighting
- Story display shows with functional controls

## Next Step
Run `/migrate-phase4` to continue with Feature Migration.
