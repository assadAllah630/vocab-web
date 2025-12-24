# TTS (Text-to-Speech) Module Context

## Purpose
Multi-provider text-to-speech synthesis for podcasts, content read-aloud, and pronunciation practice.

---

## Supported Providers

| Provider | File | Free Tier |
|----------|------|-----------|
| Google TTS | Built-in | Limited |
| Speechify | `tts_views.py` | No |
| Deepgram | `tts_views.py` | Yes (limited) |
| Browser | Client-side | Yes |

---

## Key File
`server/api/tts_views.py` (14KB)

### Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tts/voices/` | GET | List all voices |
| `/tts/voices/<lang>/` | GET | Voices for language |
| `/tts/generate/` | POST | Generate audio |
| `/tts/validate/` | POST | Validate Google key |
| `/tts/validate-deepgram/` | POST | Validate Deepgram |
| `/tts/validate-speechify/` | POST | Validate Speechify |
| `/tts/speechify-voices/` | GET | List Speechify voices |

---

## Usage Example

```python
# Generate speech
response = await api.post('/tts/generate/', {
    'text': 'Hallo, wie geht es dir?',
    'voice': 'de-DE-Standard-A',
    'speed': 1.0
})
# Returns audio file or base64
```

---

## Integration with Podcasts
- AI podcasts use TTS for audio synthesis
- Voice selection per character (Host/Guest)
- Speed control for language learners

---

*Version: 1.1 | Updated: 2025-12-24*
