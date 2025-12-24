# Frontend Viewers Module Context

## Purpose
Pages for viewing and interacting with generated content (stories, articles, dialogues) and their libraries.

---

## Key Pages

### StoryViewer
- [StoryViewer.jsx](file:///e:/vocab_web/client/src/pages/StoryViewer.jsx) ~18KB
  - Paragraph-by-paragraph display.
  - Inline image carousel (if generated).
  - TTS read-aloud button.
  - Word click → vocabulary modal.

### ArticleViewer
- [ArticleViewer.jsx](file:///e:/vocab_web/client/src/pages/ArticleViewer.jsx) ~7KB
  - Clean reading layout.
  - Highlight keywords.

### DialogueViewer
- [DialogueViewer.jsx](file:///e:/vocab_web/client/src/pages/DialogueViewer.jsx) ~13KB
  - Chat-bubble style.
  - Speaker avatars.
  - Translation toggle.

### Libraries
- [GeneratedContentLibrary.jsx](file:///e:/vocab_web/client/src/pages/GeneratedContentLibrary.jsx) ~9KB
  - List of saved generated content.
  - Filter by type (Story/Article/Dialogue).
  - Favorites filter.
- [GrammarLibrary.jsx](file:///e:/vocab_web/client/src/pages/GrammarLibrary.jsx) ~22KB
  - Browse grammar topics.
  - Progress indicators.

---

## Shared Components

| Component | Purpose |
|-----------|---------|
| `ContentCard` | Thumbnail preview for library items. |
| `ReadingProgress` | Visual progress bar for content. |

---

*Version: 1.1 | Updated: 2025-12-24*
