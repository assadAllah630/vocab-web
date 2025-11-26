# VocabMaster - AI-Powered Language Learning Platform

A comprehensive web application for learning German (and other languages) with AI-powered features including vocabulary management, spaced repetition, story generation, grammar lessons, and more.

## 🌟 Features

### Core Vocabulary Management
- **Smart Vocabulary Bank**: Add, organize, and manage vocabulary with tags and categories
- **Spaced Repetition (SRS)**: Multiple algorithms including SuperMemo 2 and Half-Life Regression (HLR)
- **Interactive Quizzes**: Practice with various quiz modes and difficulty levels
- **Progress Tracking**: Detailed statistics and activity heatmaps

### AI-Powered Content Generation
- **Story Generator**: Create personalized stories at different CEFR levels (A1-C2)
- **Article Generator**: Generate educational articles on any topic
- **Dialogue Generator**: Practice conversations with AI-generated dialogues
- **Image Generation**: Automatic illustration of stories using Stable Horde and Hugging Face
- **Grammar Lessons**: AI-generated grammar explanations with examples and Mermaid diagrams

### Advanced Features
- **Semantic Search**: Find vocabulary using natural language queries (powered by OpenRouter)
- **Text-to-Speech**: Multiple TTS providers (Google Cloud, Deepgram, Speechify)
- **Podcast Creator**: Convert text to audio podcasts
- **Exam Generator**: Create custom language exams with AI evaluation
- **Social Features**: Follow users, share vocabulary, public profiles

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 4.x + Django REST Framework
- **Database**: PostgreSQL
- **AI Integration**: 
  - Google Gemini API (content generation)
  - OpenRouter API (semantic search)
  - Stable Horde & Hugging Face (image generation)
- **Authentication**: Token-based + Google OAuth

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **UI Components**: Heroicons, Framer Motion
- **Markdown**: ReactMarkdown with Mermaid diagram support

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Create virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables (create `.env` file):
```env
# Database
DB_NAME=vocab_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret

# Email (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Start development server:
```bash
python manage.py runserver
```

## 🚀 Deployment

VocabMaster can be deployed to production using **100% FREE services** (no credit card required):

- **Backend**: Render (Free tier)
- **Database**: Render PostgreSQL (Free tier)
- **Frontend**: Vercel (Hobby tier)
- **CI/CD**: GitHub Actions (Free)

📖 **[Read the Complete Deployment Guide](DEPLOYMENT.md)**

### Quick Deploy

1. Push code to GitHub
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Configure CI/CD with GitHub Actions

**Estimated Time**: ~2 hours

### Production URLs

- **Live Demo**: [Coming Soon]
- **Backend API**: [Your Render URL]
- **Status**: ![Backend](https://img.shields.io/badge/backend-online-success) ![Frontend](https://img.shields.io/badge/frontend-online-success)

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔑 API Keys Configuration

Users need to configure their API keys in the Settings page:

### Required
- **Gemini API Key**: For AI content generation
  - Get it at: https://aistudio.google.com/app/apikey

### Optional (Enhanced Features)
- **OpenRouter API Key**: For semantic search
  - Get it at: https://openrouter.ai/keys
- **Stable Horde API Key**: For faster image generation
  - Get it at: https://stablehorde.net/register
- **Hugging Face Token**: For image generation
  - Get it at: https://huggingface.co/settings/tokens
- **Deepgram API Key**: For high-quality TTS
  - Get it at: https://console.deepgram.com/

## 📚 Usage

1. **Sign up** or log in with Google OAuth
2. **Configure API keys** in Settings
3. **Add vocabulary** manually or import from CSV
4. **Practice** with quizzes using spaced repetition
5. **Generate content** (stories, articles, dialogues) at your level
6. **Track progress** with statistics and heatmaps

## 🏗️ Project Structure

```
vocab_web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── api.js         # API client
│   └── public/
├── server/                # Django backend
│   ├── api/              # Main API app
│   │   ├── models.py     # Database models
│   │   ├── views.py      # API endpoints
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── vocab_server/     # Django project settings
│   └── manage.py
└── docs/                 # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

**Assad Allah Alebrahim**
- GitHub: [@assadAllah630](https://github.com/assadAllah630)

## 🙏 Acknowledgments

- Google Gemini for AI content generation
- Stable Horde community for free image generation
- All open-source libraries used in this project
