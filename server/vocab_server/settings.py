from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Define DEBUG first (needed for SECRET_KEY logic)
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# CRITICAL SECURITY: Load SECRET_KEY from environment variable
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        # For local development only - print warning
        SECRET_KEY = 'django-insecure-dev-only-key-change-in-production'
        print("WARNING: Using development SECRET_KEY. Set DJANGO_SECRET_KEY environment variable for production!")
    else:
        raise ValueError("DJANGO_SECRET_KEY environment variable must be set in production")

# ALLOWED_HOSTS: Support production domains
# Format: comma-separated list, e.g., "localhost,127.0.0.1,your-app.onrender.com"
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')
if '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'vocab_server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'vocab_server.wsgi.application'

# Database Configuration
# Support both DATABASE_URL (Render) and individual env vars (local)
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Production: Use Render's DATABASE_URL
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Local development: Use individual env vars
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'vocab_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', '123'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
]

# Add production frontend URL if set
if FRONTEND_URL and FRONTEND_URL not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(FRONTEND_URL)

# For API endpoints, we'll use session authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# Disable CSRF for API endpoints
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# Media files (for podcast audio)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')



# Rate Limiting
# django_ratelimit is installed as a library, doesn't strictly need to be in INSTALLED_APPS 
# unless using its cache backend or models, but good to have if we expand usage.

# Google OAuth Settings
GOOGLE_OAUTH_CLIENT_ID = os.environ.get('GOOGLE_OAUTH_CLIENT_ID', '')
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET', '')
# Support both local and production redirect URIs
GOOGLE_OAUTH_REDIRECT_URI = os.environ.get(
    'GOOGLE_OAUTH_REDIRECT_URI',
    f"{FRONTEND_URL}/auth/callback" if FRONTEND_URL else 'http://localhost:5173/auth/callback'
)

# Gmail Settings for Sending Emails
# Using SMTP with VPN to bypass ISP blocking
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_USE_TLS = False
EMAIL_HOST_USER = os.environ.get('GMAIL_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# OTP Settings
OTP_EXPIRY_MINUTES = 10

# HIGH SECURITY: Request Size Limits (Prevent DoS)
DATA_UPLOAD_MAX_MEMORY_SIZE = 2621440  # 2.5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# MEDIUM SECURITY: Security Headers
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'

# Production security settings (enabled when DEBUG=False)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

