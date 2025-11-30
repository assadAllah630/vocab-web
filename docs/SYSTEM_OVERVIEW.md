# VocabMaster - System Overview

**Version:** 1.0  
**Last Updated:** November 27, 2025  
**Author:** Assad Allah Alebrahim

## Executive Summary

VocabMaster is a comprehensive AI-powered language learning platform that combines vocabulary management, spaced repetition, content generation, and social features. The application helps users learn German (and other languages) through intelligent practice, AI-generated content, and gamification.

## Core Purpose

- **Primary Goal:** Provide an intelligent, personalized language learning experience
- **Target Audience:** Language learners at all levels (A1-C2 CEFR)
- **Primary Language:** German (extensible to English, Arabic, Russian)

## Technology Stack Summary

### Backend
- **Framework:** Django 5.2.8 + Django REST Framework 3.16.1
- **Database:** PostgreSQL with pgvector extension
- **Language:** Python 3.11+
- **Key Libraries:** Celery, LangChain, Google Gemini, Hugging Face

### Frontend
- **Framework:** React 19.2.0 + Vite 7.2.4
- **Styling:** Tailwind CSS 4.1.17
- **Routing:** React Router v7.9.6
- **UI Libraries:** Heroicons, Framer Motion, Mermaid

### Infrastructure
- **Backend Hosting:** Render (Free Tier)
- **Frontend Hosting:** Vercel (Hobby Tier)
- **Database:** Render PostgreSQL (Free Tier)
- **CI/CD:** GitHub Actions

## Application Architecture

```
┌─────────────────┐
│   React SPA     │  (Vite + Tailwind)
│  (Port 5173)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Django API     │  (DRF + Token Auth)
│  (Port 8000)    │
└────────┬────────┘
         │
         ├─────► PostgreSQL (User data, vocab, progress)
         │
         ├─────► Google Gemini (Content generation)
         │
         ├─────► Stable Horde/HF (Image generation)
         │
         ├─────► OpenRouter (Semantic search)
         │
         └─────► Google Cloud/Deepgram (TTS)
```

## Key Metrics

- **Database Models:** 11 core models
- **API Endpoints:** 50+ REST endpoints
- **Frontend Pages:** 26 pages
- **UI Components:** 16 reusable components
- **AI Integrations:** 6 different AI services
- **Authentication Methods:** 2 (Token-based + Google OAuth)
- **Supported Languages:** 4 (German, English, Arabic, Russian)

## User Workflow

1. **Sign Up/Login** → Email/password or Google OAuth
2. **Configure API Keys** → Settings page (Gemini required, others optional)
3. **Add Vocabulary** → Manual input or CSV import
4. **Practice** → Quiz with spaced repetition (SuperMemo 2 or HLR)
5. **Generate Content** → AI-powered stories, articles, dialogues
6. **Track Progress** → Statistics dashboard with heatmaps
7. **Social Features** → Follow users, share vocabulary

## Deployment Status

- **Backend:** Deployed on Render (Free tier)
- **Frontend:** Ready for Vercel deployment
- **Database:** PostgreSQL on Render
- **CI/CD:** Automated via GitHub Actions
- **Monitoring:** Health check endpoint at `/api/health/`

## Next Steps

For detailed information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [FEATURES.md](./FEATURES.md) - Complete feature list
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data models
- [AI_INTEGRATIONS.md](./AI_INTEGRATIONS.md) - AI capabilities
- [UPGRADE_RECOMMENDATIONS.md](./UPGRADE_RECOMMENDATIONS.md) - Improvement suggestions
