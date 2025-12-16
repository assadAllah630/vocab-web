# React to Flutter Migration Context

## 1. Architecture Overview
This document defines the architectural mapping between the existing React (Vite) application and the new Flutter target.

### Core Architecture Pattern
- **Result:** MVVM (Model-View-ViewModel) using Riverpod.
- **Why:** Fits Flutter's declarative nature better than React's component-local state.

| Concept | React (Current) | Flutter (Target) |
| :--- | :--- | :--- |
| **Language** | JavaScript (ES6+) | Dart (Strongly Typed) |
| **UI Library** | React DOM | Flutter Widgets (Material 3) |
| **State** | `useState`, `useContext`, `useEffect` | **Riverpod** (`ConsumerWidget`, `ref.watch`) |
| **Routing** | `react-router-dom` | **go_router** |
| **Networking** | `axios` (instance in `api.js`) | **Dio** (singleton provider) |
| **Forms** | Controlled Inputs | `TextEditingController` / `flutter_form_builder` |
| **Styling** | Tailwind CSS classes | Flutter Theme + Widget Properties |
| **Icons** | `lucide-react`, `heroicons` | `lucide_icons` (pub.dev) |

---

## 2. Directory Structure Mapping

We will map the `client/src` folder to `lib` in Flutter.

```text
client/src/                      ->  lib/
├── api.js                       ->  core/network/api_client.dart
├── context/                     ->  core/providers/
├── components/                  ->  core/widgets/ (Shared)
│   └── mobile/                  ->  features/shared/widgets/
├── pages/mobile/Mobile*.jsx     ->  features/[feature_name]/screens/
├── hooks/                       ->  core/hooks/ (flutter_hooks optional)
└── utils/                       ->  core/utils/
```

---

## 3. Library Replacements

| React Library | Flutter Replacement | Notes |
| :--- | :--- | :--- |
| `axios` | `dio` | Create an interceptor for JWT auth |
| `react-router-dom` | `go_router` | Use typed routes if possible |
| `framer-motion` | `flutter_animate` | Or standard `AnimationController` |
| `react-hook-form` | `flutter_form_builder` | Or `Form` + `TextFormField` |

### Detected Libraries & Replacements
Based on Deep Component Analysis, we must map these specific React libraries:

| React Library | Flutter Replacement | Strategy |
| :--- | :--- | :--- |
| `react-markdown` | `flutter_markdown` | Use for core rendering. |
| `syntax-highlighter`| `flutter_highlighter` | Integrate code blocks in markdown. |
| `mermaid` | `webview_flutter` | Native Mermaid is hard; render HTML in Webview. |
| `dotlottie-react` | `lottie` | Direct replacement for `.json`/`.lottie` files. |
| `canvas-confetti` | `confetti` | Use for "Success" screens. |
| `lucide-react` | `lucide_icons` | 1:1 Icon mapping available. |
| `@heroicons/react`| `heroicons` | Official Flutter package exists. |
| `firebase` | `firebase_auth`, `cloud_firestore` | Use FlutterFire patterns. |
| `framer-motion` | `flutter_animate` | Declarative animations (e.g., `.animate().fade()`). |

### Complexity Strategy
Analysis identified 3 tiers of complexity.

1.  **Tier 1 (Layouts & Core):** `MobileLayout`, `MobileNav`, `MobileAIWizardLayout`. Migrate FIRST.
2.  **Tier 2 (Features):** `MobileHome` (score 56), `MobileWords` (score 99). Migrate SECOND.
3.  **Tier 3 (Complex Beasts):**
    *   `MobileReader` (Score 162): Has 39 Hooks. Requires breaking into `ReaderController` + `ReaderView`.
    *   `MobilePodcastStudio` (Score 109): Audio logic must move to a `PodcastService`.

---

## 4. Key Implementation Differences

### Component Structure
**React:**
```jsx
function MyButton({ label, onClick }) {
    return <button className="bg-blue-500 p-4" onClick={onClick}>{label}</button>;
}
```

**Flutter:**
```dart
class MyButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const MyButton({required this.label, required this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue, 
        padding: const EdgeInsets.all(16)
      ),
      onPressed: onTap,
      child: Text(label),
    );
  }
}
```

### State Management (Riverpod)
Instead of `useContext`, we use global providers.

**React:**
```js
const { user } = useContext(AuthContext);
```

**Flutter:**
```dart
final user = ref.watch(userProvider);
```
