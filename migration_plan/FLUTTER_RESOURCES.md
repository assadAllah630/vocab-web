# Flutter Open Source Resources & Smart Component Matching

> **Use this guide to find the BEST Flutter replacement for any React component.**
> Always check these resources before writing custom code!

---

## 🌟 Master Resource Lists

| Resource | Link | Description |
| :--- | :--- | :--- |
| **Awesome Flutter** | [github.com/Solido/awesome-flutter](https://github.com/Solido/awesome-flutter) | Curated list of 1000+ packages |
| **Flutter Gems** | [fluttergems.dev](https://fluttergems.dev) | Categorized package explorer |
| **Pub.dev** | [pub.dev](https://pub.dev) | Official package registry |
| **GetWidget** | [getwidget.dev](https://getwidget.dev) | 1000+ pre-built components (FREE) |

---

## 🎨 UI Kits (Complete Design Systems)

| Package | Pub.dev | Best For |
| :--- | :--- | :--- |
| **getwidget** | `getwidget: ^4.0.0` | 1000+ components, buttons, cards, avatars |
| **velocityx** | `velocity_x: ^4.1.0` | Tailwind-like utilities for Flutter |
| **fluent_ui** | `fluent_ui: ^4.8.0` | Windows 11 style apps |
| **macos_ui** | `macos_ui: ^2.0.0` | macOS style apps |
| **tdesign_flutter** | `tdesign_flutter` | Tencent's design system |

### 🔥 Recommended: GetWidget
```yaml
dependencies:
  getwidget: ^4.0.0
```
Provides: GFButton, GFCard, GFAvatar, GFCarousel, GFDrawer, GFToast, GFLoader, GFShimmer, etc.

---

## ✨ Animation Libraries (Pro-Level)

| Package | Use Case | React Equivalent |
| :--- | :--- | :--- |
| **flutter_animate** | Chained widget animations | `framer-motion` |
| **animations** | Material Design transitions | Page transitions |
| **lottie** | After Effects JSON animations | `lottie-react` |
| **rive** | Interactive 2D animations | Complex illustrations |
| **animated_text_kit** | Text entrance effects | Hero text animations |
| **shimmer** | Loading skeleton effects | Skeleton loaders |
| **confetti** | Celebration effects | `canvas-confetti` |
| **sprung** | Spring physics animations | Natural bounces |
| **animate_do** | CSS-like animations (fade, bounce) | `animate.css` |

### 🔥 Recommended Animation Stack
```yaml
dependencies:
  flutter_animate: ^4.3.0      # Primary animation library
  animations: ^2.0.0           # Page transitions
  lottie: ^3.0.0               # Complex pre-made animations
  shimmer: ^3.0.0              # Loading states
  confetti: ^0.7.0             # Success celebrations
```

---

## 🧩 Component Matching Guide

### Navigation & Routing
| React Component | Flutter Package | Notes |
| :--- | :--- | :--- |
| `react-router-dom` | **go_router** | Type-safe, deep linking |
| Bottom Nav | **curved_navigation_bar** | Animated curve nav |
| Drawer | **flutter_advanced_drawer** | Modern side drawer |
| Tab Bar | **buttons_tabbar** | Animated tab bar |

### Forms & Inputs
| React Component | Flutter Package | Notes |
| :--- | :--- | :--- |
| Form Validation | **flutter_form_builder** | Complete form solution |
| Text Field | **pinput** | OTP/PIN inputs |
| Dropdown | **dropdown_button2** | Enhanced dropdown |
| Date Picker | **syncfusion_flutter_datepicker** | Beautiful date picker |

### Media & Content
| React Component | Flutter Package | Notes |
| :--- | :--- | :--- |
| `react-markdown` | **flutter_markdown** | Markdown rendering |
| Syntax Highlighter | **flutter_highlight** | Code blocks |
| Mermaid Diagrams | **flutter_mermaid** or WebView | Render diagrams |
| Image Gallery | **photo_view** | Zoom & pan |
| Carousel | **carousel_slider** | Image slideshows |
| Video Player | **chewie** | Beautiful video UI |
| Audio Player | **just_audio** + **audio_video_progress_bar** | Full audio solution |

### Icons
| React Library | Flutter Package | Notes |
| :--- | :--- | :--- |
| `lucide-react` | **lucide_icons** | 1:1 mapping |
| `@heroicons/react` | **heroicons_flutter** | Official port |
| `react-icons` | **icons_plus** | 30+ icon packs |
| Custom SVG | **flutter_svg** | SVG rendering |

### State & Data
| React Pattern | Flutter Package | Notes |
| :--- | :--- | :--- |
| `useContext` | **flutter_riverpod** | Recommended state |
| `useState` | **flutter_hooks** | Hook-like patterns |
| `axios` | **dio** | HTTP client |
| `swr` / `react-query` | **riverpod** + dio | Caching built-in |

### Utilities
| Need | Flutter Package | Notes |
| :--- | :--- | :--- |
| Toast/Snackbar | **fluttertoast** or **flash** | Notifications |
| Loading Overlay | **loading_overlay** | Full screen loader |
| Pull to Refresh | **pull_to_refresh** | Refresh indicator |
| Infinite Scroll | **infinite_scroll_pagination** | Lazy loading |
| Local Storage | **shared_preferences** | Simple key-value |
| Secure Storage | **flutter_secure_storage** | Encrypted storage |
| Intro/Onboarding | **introduction_screen** | App intro slides |

---

## 📦 GitHub Repos for Reference

### Complete App Examples
| Repo | Description |
| :--- | :--- |
| [flutter-architecture-blueprints](https://github.com/nicholaschiang/flutter-architecture-blueprints) | Clean architecture examples |
| [flutter_deer](https://github.com/simplezhli/flutter_deer) | Complete e-commerce app |
| [spotube](https://github.com/KRTirtho/spotube) | Spotify clone (production) |
| [inKino](https://github.com/nicholaschiang/inKino) | Movie app with Redux |
| [flutter-wonderous-app](https://github.com/nicholaschiang/wonderous) | Official Flutter showcase |

### UI Inspiration
| Repo | Description |
| :--- | :--- |
| [Best-Flutter-UI-Templates](https://github.com/nicholaschiang/Best-Flutter-UI-Templates) | 100+ UI templates |
| [FlutterExampleApps](https://github.com/nicholaschiang/FlutterExampleApps) | Many example apps |
| [flutter_ui_challenges](https://github.com/nicholaschiang/flutter_ui_challenges) | UI recreations |

---

## 🎯 Smart Matching Rules

When converting a React component:

1. **Check GetWidget First**
   - 90% of basic UI components exist there
   - Example: Need a card? Use `GFCard`

2. **Check Flutter Gems**
   - Search by category (e.g., "carousel")
   - Sort by "likes" for popularity

3. **Check Awesome Flutter**
   - Search the GitHub README
   - Look for "Widgets" section

4. **Before Writing Custom Code**
   - Search pub.dev for the component name
   - Check if GetWidget has it
   - Look for similar components in sample apps

5. **Mark Resources Used**
   - Update `MIGRATION_COMPONENTS_DEEP.csv` with package used
   - Add notes for future reference

---

## 📋 Recommended pubspec.yaml (Full Stack)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Core
  dio: ^5.4.0
  go_router: ^14.0.0
  flutter_riverpod: ^2.4.0
  flutter_secure_storage: ^9.0.0
  flutter_dotenv: ^5.1.0
  
  # UI Kit
  getwidget: ^4.0.0
  google_fonts: ^6.1.0
  lucide_icons: ^0.257.0
  flutter_svg: ^2.0.0
  
  # Animations
  flutter_animate: ^4.3.0
  animations: ^2.0.0
  lottie: ^3.0.0
  shimmer: ^3.0.0
  confetti: ^0.7.0
  
  # Content
  flutter_markdown: ^0.6.18
  flutter_highlight: ^0.7.0
  chewie: ^1.7.0
  just_audio: ^0.9.0
  
  # Forms
  flutter_form_builder: ^9.1.0
  
  # Utils
  cached_network_image: ^3.3.0
  infinite_scroll_pagination: ^4.0.0
  pull_to_refresh: ^2.0.0
  fluttertoast: ^8.2.0
```
