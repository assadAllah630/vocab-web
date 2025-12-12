# Mobile Reader Module Context

## Purpose

**THE CORE MOBILE FEATURE** - Smart Reader (55KB):
- URL content extraction
- YouTube transcript extraction
- File upload & OCR
- AI formatting
- Word extraction
- TTS playback

---

## Key Page

### MobileReader (Main Feature!)
- [MobileReader.jsx](file:///e:/vocab_web/client/src/pages/mobile/MobileReader.jsx) - **55KB**
  
**Features:**
1. **URL Extraction**
   - Article extraction (Trafilatura → Newspaper4k → Jina)
   - Automatic title detection
   
2. **YouTube Support**
   - Transcript extraction
   - Language preference (target language)
   - Auto-captions
   
3. **File Upload**
   - PDF (PyMuPDF + OCR)
   - DOCX, PPTX, XLSX
   - Images (Tesseract OCR)
   
4. **AI Formatting**
   - Clean up extracted text
   - Markdown formatting
   - Summary generation
   
5. **Word Extraction**
   - Inline word selection panel
   - Find unknown words
   - Add to vocabulary
   
6. **TTS Playback**
   - Browser Speech API (free)
   - Multi-provider support

---

## Backend Dependencies

- `content_extraction_service.py` - URL/YouTube
- `text_extraction_service.py` - Files
- `text_formatting_service.py` - AI formatting
- `ocrspace_service.py` - OCR API

---

*Version: 1.0 | Created: 2025-12-10*
