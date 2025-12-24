# Frontend Reading Module Context

## Purpose
The "Smart Reader" for importing and reading external content (URLs, YouTube, Files).

---

## Key Page

### TextReader
- [TextReader.jsx](file:///e:/vocab_web/client/src/pages/TextReader.jsx) ~20KB
  - **Import modes**:
    - URL paste → `POST /api/extract-content/`.
    - YouTube link → transcript extraction.
    - File upload (PDF, DOCX, TXT).
  - **AI Formatting**: "Quick Format" with AI for clean Markdown.
  - **Vocabulary Extraction**:
    - Select words in text.
    - Add to vocabulary list.
  - **TTS**: Read-aloud via browser or backend TTS.

---

## User Flow

```
Paste URL → Extract → (Optional) AI Format → Read → Highlight Words → Add to Vocab
```

---

## API Integration

```javascript
// Extract content from URL
const { data } = await api.post('/extract-content/', { url: 'https://...' });
// data.content contains raw text

// Quick AI formatting
const formatted = await api.post('/quick-format/', { text: data.content });
// formatted.formatted_content contains Markdown
```

---

*Version: 1.1 | Updated: 2025-12-24*
