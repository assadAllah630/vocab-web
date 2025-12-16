# React to Flutter Migration Rules

> **Strictly follow these rules to ensure code quality and consistency during the migration.**

## 1. Naming Conventions

| Item | React (CamelCase) | Flutter (Dart Standards) |
| :--- | :--- | :--- |
| **File Names** | `MobileHome.jsx` | `mobile_home_screen.dart` (snake_case) |
| **Classes/Widgets** | `MobileHome` | `MobileHomeScreen` (PascalCase) |
| **Variables/Functions** | `currentUser` | `currentUser` (camelCase) |
| **Constants** | `API_URL` | `kApiUrl` or `apiUrl` (depends on strictness, prefer lowerCamel for non-const) |
| **Directories** | `components` | `widgets` |

## 2. Component Extraction Rules
- **One Class Per File:** Generally, keep one public Widget class per file.
- **Extract Complex Widgets:** Do not write a 500-line `build()` method. Extract sub-parts into smaller private widgets (start with `_`) or separate files if reusable.
- **Example:**
  ```dart
  // BAD
  build(context) { return Column(children: [ ... 100 lines of header ... ]); }
  
  // GOOD
  build(context) { return Column(children: [ _buildHeader(), _buildBody() ]); }
  ```

## 3. Styling & Theming
- **No Hardcoded Colors:** Do NOT use `Colors.blue` or Hex codes like `Color(0xFF...)` in widgets.
- **Use Theme:** Always use `Theme.of(context).colorScheme.primary`.
- **Spacing:** Use `SizedBox(height: 16)` or `Padding` consistently. Define constants like `kPaddingSmall = 8.0` if possible.

## 4. State Management
- **Avoid setState for Global Data:** Only use `setState` for purely local UI state (e.g., is a dropdown open?).
- **Use Riverpod for Data:** API data, User Session, and User Settings must live in Riverpod Providers.
- **Hooks:** You ALLOWED to use `flutter_hooks` (`useTextEditingController`, `useAnimation`) to mimic React Hooks mental model.

## 5. Defensive Coding
- **Null Safety:** Dart is null-safe. Do not use `!` (bang operator) unless 100% sure. Use `?` and `??` (null coalescing) instead.
- **Async/Await:** All API calls must be `async/await`. Handle errors with `try/catch`.


## 6. Migration Phasing Rule
1.  **Skeleton First:** Build the UI with mock data first.
2.  **Logic Second:** Connect Riverpod providers and Real API calls only after UI is approved.
3.  **Refactor:** Clean up the widget tree.

## 7. Handling High Complexity (Score > 50)
*Refers to complexity scores in `MIGRATION_COMPONENTS_DEEP.csv`*
- **Break it down:** Components with > 20 Hooks or > 100 LOC MUST be split.
- **Controller Pattern:** Move logic out of the UI widget into a `StateNotifier` or `ChangeNotifier`.
- **Custom Hooks:** If preserving hooks logic, use `flutter_hooks` inside a separate `HookWidget`.

## 8. Library Specifics
- **Animations:** Do NOT manually implement Physics animations. Use `flutter_animate`.
- **Markdown:** Wrap all user-generated text in `MarkdownBody` (using `flutter_markdown`).
- **Icons:** Use `LucideIcons.iconName` exclusively.
