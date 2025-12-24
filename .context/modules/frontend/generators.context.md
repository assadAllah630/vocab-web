# Frontend Generators Module Context

## Purpose
AI-powered content creation tools: stories, articles, dialogues, and grammar exercises.

---

## Key Pages

### TextGenerator
- [TextGenerator.jsx](file:///e:/vocab_web/client/src/pages/TextGenerator.jsx) ~22KB
  - Simple text generation.
  - Topic/Level input.
  - Quick output display.

### AdvancedTextGenerator
- [AdvancedTextGenerator.jsx](file:///e:/vocab_web/client/src/pages/AdvancedTextGenerator.jsx) ~22KB
  - Multi-step wizard:
    1. Type selection (Story, Article, Dialogue).
    2. Topic, Level, Word Count.
    3. Vocabulary targets (optional).
    4. Generation progress.
  - Saves to `GeneratedContent` (backend).

### GrammarGenerator
- [GrammarGenerator.jsx](file:///e:/vocab_web/client/src/pages/GrammarGenerator.jsx) ~13KB
  - Grammar topic selection.
  - Generates exercises and explanations.

### PodcastCreator
- [PodcastCreator.jsx](file:///e:/vocab_web/client/src/pages/PodcastCreator.jsx) ~21KB
  - AI podcast script generation.
  - TTS voice selection.
  - Audio preview.

---

## API Pattern

```javascript
// Advanced text generation
const { data } = await api.post('/ai/generate-advanced-text/', {
  content_type: 'story',
  topic: 'Adventure in Berlin',
  level: 'B1',
  word_count: 500,
  include_images: true
});
// data.id holds the GeneratedContent ID for later retrieval
```

---

*Version: 1.1 | Updated: 2025-12-24*
