# Reader Module Context

## Purpose
Content extraction pipeline for importing text from URLs, YouTube videos, and uploaded files.

---

## Key Files

| File | Size | Purpose |
|------|------|---------|
| `content_extraction_service.py` | 17KB | URL/article scraping |
| `content_extraction_views.py` | 5KB | `/extract-content/` endpoint |
| `text_extraction_service.py` | 15KB | File parsing (PDF, DOCX, TXT, images) |
| `text_extraction_views.py` | 5KB | `/extract-text/` endpoint |
| `text_formatting_service.py` | 7KB | AI text cleanup |
| `ocrspace_service.py` | 6KB | OCR for images |
| `file_type_registry.py` | 8KB | MIME type detection |

---

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/extract-content/` | POST | Extract from URL |
| `/extract-youtube/` | POST | YouTube transcripts |
| `/extract-text/` | POST | File upload parsing |
| `/extract-text/formats/` | GET | Supported formats |
| `/convert-text/` | POST | AI formatting pipeline |
| `/quick-format/` | POST | Quick AI cleanup |

---

## Supported Formats

### URLs
- News articles (Trafilatura)
- Wikipedia
- Blog posts

### YouTube
- Transcript extraction
- Language preference (target language first)

### Files
- PDF (PyPDF2)
- DOCX (python-docx)
- TXT, RTF
- Images (OCR via OCR.space)

---

## Pipeline Flow

```
Input (URL/File/YouTube)
    ↓
Extraction Service
    ↓
Raw Text
    ↓
(Optional) AI Formatting
    ↓
Clean Markdown
    ↓
SavedText or Reader UI
```

---

*Version: 1.1 | Updated: 2025-12-24*
