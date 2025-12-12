# VocabMaster Glossary

## Authentication & Users

| Term | Definition |
|------|------------|
| **Token** | JWT authentication artifact for API access |
| **Session** | Short-lived Redis object for ephemeral state |
| **OAuth** | Google OAuth 2.0 for social login |
| **Profile** | User profile with preferences and settings |

---

## Vocabulary & Learning

| Term | Definition |
|------|------------|
| **SRS** | Spaced Repetition System - algorithm for optimal review timing |
| **HLR** | Half-Life Regression - advanced SRS using machine learning |
| **SuperMemo 2** | Classic SRS algorithm with easiness factor |
| **Interval** | Days until next review (calculated by SRS) |
| **Easiness Factor** | Difficulty multiplier for a word (1.3-2.5) |
| **Repetition Stage** | Current learning stage (0=new, higher=learned) |

---

## Language Levels

| Level | CEFR | Description |
|-------|------|-------------|
| A1 | Beginner | Basic phrases, simple vocabulary |
| A2 | Elementary | Routine tasks, simple communication |
| B1 | Intermediate | Independent use, familiar topics |
| B2 | Upper-Intermediate | Complex texts, fluent interaction |
| C1 | Advanced | Demanding texts, flexible use |
| C2 | Mastery | Near-native fluency |

---

## AI & Machine Learning

| Term | Definition |
|------|------------|
| **Embedding** | Vector representation of text (768-1536 dimensions) |
| **Vector DB** | Database optimized for similarity search |
| **Semantic Search** | Finding content by meaning, not keywords |
| **Adapter** | Provider-specific AI implementation |
| **Circuit Breaker** | Safety pattern preventing cascading failures |
| **Fallback** | Backup provider when primary fails |
| **Health Score** | Provider reliability metric (0-100) |
| **Quota** | Daily API usage limit per provider |

---

## AI Providers

| Provider | Purpose | Free Tier |
|----------|---------|-----------|
| **Gemini** | Text generation, embeddings | 500/day |
| **OpenRouter** | Multi-model gateway | Varies |
| **HuggingFace** | Open models, images | 1000/day |
| **Groq** | Fast inference | Limited |
| **Pollinations** | Image generation | UNLIMITED |

---

## Content Types

| Term | Definition |
|------|------------|
| **Story** | AI-generated narrative for reading practice |
| **Article** | Educational content on specific topics |
| **Dialogue** | Conversational text for speaking practice |
| **Grammar Lesson** | Structured grammar explanation with examples |
| **Exam** | Assessment with multiple question types |

---

## Smart Reader

| Term | Definition |
|------|------------|
| **Content Extraction** | Pulling text from URLs and videos |
| **Trafilatura** | Python library for web content extraction |
| **YouTube Transcript** | Auto-generated or manual video subtitles |
| **OCR** | Optical Character Recognition for images |
| **Jina Reader** | API for JavaScript-heavy sites |

---

## Architecture

| Term | Definition |
|------|------------|
| **DTO** | Data Transfer Object - API request/response contract |
| **Repository** | Data access layer (no business logic) |
| **Service** | Business logic layer |
| **Controller** | HTTP request handler (thin, delegates to services) |
| **Middleware** | Request/response processing pipeline |

---

*Version: 1.0 | Created: 2025-12-10*
