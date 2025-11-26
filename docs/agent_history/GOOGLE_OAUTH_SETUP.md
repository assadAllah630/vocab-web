# Google OAuth & Email Integration Guide

This guide will help you set up Google OAuth for authentication and Gmail for sending OTP and notification emails.

## Part 1: Google Cloud Console Setup

### Step 1: Create/Access Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing project (the one you used for TTS)
3. Note your Project ID

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable these APIs:
   - **Google+ API** (for OAuth)
   - **Gmail API** (for sending emails)
   - **People API** (for user profile info)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: Vocab Learning App
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Add test users (your email addresses for testing)
6. Save and continue

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Vocab Web App
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/callback`
     - `http://localhost:8000/api/auth/google/callback`
5. Click **Create**
6. **IMPORTANT**: Copy your **Client ID** and **Client Secret** - you'll need these!

### Step 5: Create Service Account for Gmail (Email Sending)

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in:
   - **Service account name**: vocab-email-service
   - **Service account ID**: (auto-generated)
4. Click **Create and Continue**
5. Grant role: **Project** > **Editor**
6. Click **Done**
7. Click on the service account you just created
8. Go to **Keys** tab
9. Click **Add Key** > **Create new key**
10. Choose **JSON** format
11. Download the JSON file - this is your service account key!

### Step 6: Enable Gmail API for Service Account

For the service account to send emails, you need to set up domain-wide delegation (if using Google Workspace) OR use OAuth with a regular Gmail account.

**For Development (Using Your Gmail Account):**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App Passwords**
4. Generate a new app password for "Mail"
5. Copy this password - you'll use it as `EMAIL_HOST_PASSWORD`

## Part 2: Backend Configuration

### Step 1: Install Required Packages

```bash
cd server
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Step 2: Update Django Settings

Add to `server/vocab_server/settings.py`:

```python
# Google OAuth Settings
GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET', '')
GOOGLE_OAUTH_REDIRECT_URI = 'http://localhost:5173/auth/callback'

# Gmail Settings for Sending Emails
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('GMAIL_USER', 'your-email@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')  # App password from Step 6
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# OTP Settings
OTP_EXPIRY_MINUTES = 10
```

### Step 3: Create Environment Variables File

Create `server/.env`:

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here

# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Database (your existing settings)
DB_NAME=vocab_db
DB_USER=postgres
DB_PASSWORD=123
DB_HOST=localhost
DB_PORT=5432
```

### Step 4: Install python-dotenv

```bash
pip install python-dotenv
```

Update `settings.py` to load .env:

```python
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()  # Add this line at the top

BASE_DIR = Path(__file__).resolve().parent.parent
# ... rest of settings
```

## Part 3: Frontend Configuration

### Step 1: Create Environment File

Create `client/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_API_URL=http://localhost:8000/api
```

### Step 2: Install Google OAuth Library

```bash
cd client
npm install @react-oauth/google
```

## Part 4: Testing

### Test Email Sending

Create `server/test_email.py`:

```python
import os
from django.core.mail import send_mail
from dotenv import load_dotenv

load_dotenv()

send_mail(
    'Test Email',
    'This is a test email from your Vocab App!',
    os.environ.get('GMAIL_USER'),
    ['recipient@example.com'],
    fail_silently=False,
)
print("Email sent successfully!")
```

Run:
```bash
python manage.py shell < test_email.py
```

## Part 5: Security Notes

1. **NEVER commit** `.env` files to Git
2. Add to `.gitignore`:
   ```
   .env
   *.json  # Service account keys
   ```
3. For production, use environment variables from your hosting platform
4. Rotate credentials regularly
5. Use different credentials for development and production

## Next Steps

After completing this setup:
1. I'll create the backend endpoints for OAuth and email
2. I'll create the frontend components for Google Sign-In
3. I'll implement OTP email sending
4. I'll implement notification emails
5. I'll remove the Stats page from the sidebar

## Troubleshooting

**OAuth Error: redirect_uri_mismatch**
- Make sure the redirect URI in your code exactly matches what you configured in Google Console

**Email not sending**
- Check that 2-Step Verification is enabled
- Make sure you're using an App Password, not your regular Gmail password
- Check spam folder

**API not enabled**
- Make sure you enabled Gmail API and Google+ API in Google Cloud Console

---

Ready to proceed? Let me know when you've completed the Google Cloud Console setup (Parts 1) and I'll help you with the code implementation!
