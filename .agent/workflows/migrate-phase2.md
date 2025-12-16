---
description: Flutter Migration Phase 2 - Core Layouts (MainLayout, Navbar, WizardLayout)
---

# Phase 2: Core Layouts (High Dependency)

> These layouts MUST be built first as they wrap all other pages.
> **SMART MATCHING:** Check `migration_plan/FLUTTER_RESOURCES.md` for pre-built navigation and layout widgets!

## Prerequisites
- Phase 1 completed (`/migrate-phase1`)
- Dependencies installed

## Steps

1. **Read CSV for complexity**
   - Open `migration_plan/MIGRATION_COMPONENTS_DEEP.csv`
   - Check rows for: `MobileLayout`, `MobileNav`, `MobileAIWizardLayout`

2. **Create Main Layout**
   - Source: `client/src/components/mobile/MobileLayout.jsx`
   - Target: `lib/core/layouts/main_layout.dart`
   - Contains: Scaffold with BottomNavigationBar

3. **Create Navigation Bar**
   - Source: `client/src/components/mobile/MobileNav.jsx`
   - Target: `lib/features/shared/widgets/mobile_nav.dart`
   - Use GoRouter for navigation

4. **Create AI Wizard Layout**
   - Source: `client/src/components/mobile/MobileAIWizardLayout.jsx`
   - Target: `lib/core/layouts/wizard_layout.dart`
   - Reusable wrapper for AI generation screens

5. **Update CSV**
   - Mark `Is Migrated = TRUE` for completed items
   - Mark `Is Tested = TRUE` after verification

## Verification
- App should display bottom navigation
- Navigation between placeholder screens works

## Next Step
Run `/migrate-phase3` to continue with Shared UI Components.
