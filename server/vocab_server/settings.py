from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url
from corsheaders.defaults import default_headers

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
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_spectacular',  # API Documentation
    'api',
    'api.ai_gateway.apps.AiGatewayConfig',  # Multi-Provider AI Gateway Module
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
    'api.middleware.APIUsageMiddleware',
    'api.middleware.UpdateLastActivityMiddleware',  # Track user activity for online status
    'api.security_middleware.IPWhitelistMiddleware',
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
ASGI_APPLICATION = 'vocab_server.asgi.application'

# Database Configuration
# Support both DATABASE_URL (Render) and individual env vars (local)
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')

# Only use DATABASE_URL if it's PostgreSQL (not SQLite)
if DATABASE_URL and 'postgresql' in DATABASE_URL:
    # Production: Use Render's DATABASE_URL with connection pooling
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=60,  # Connections live 60 seconds (better for serverless)
            conn_health_checks=True,
            ssl_require=not DEBUG,  # SSL in production
        )
    }
    # Add connection pool settings for PostgreSQL
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 10,  # Timeout after 10 seconds
    }
else:
    # Local development: Use individual env vars for PostgreSQL
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'vocab_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', '123'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'CONN_MAX_AGE': 60,
            'CONN_HEALTH_CHECKS': True,
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

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
if not os.path.exists(STATIC_ROOT):
    os.makedirs(STATIC_ROOT, exist_ok=True)
# STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
# Add production frontend URL from environment
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# Allow all Vercel subdomains (Robust Fix)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "https://vocab-admin-panel.vercel.app",
]

# Add production frontend URL if set
if FRONTEND_URL and FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-gemini-key",
    "xi-api-key",
    "x-openrouter-key",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "https://vocab-admin-panel.vercel.app",
]

# Add production frontend URL if set
if FRONTEND_URL and FRONTEND_URL not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(FRONTEND_URL)

# For API endpoints, we'll use session authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.ExpiringTokenAuthentication',  # Custom token auth with 30-day expiration
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# API Documentation Settings (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'VocabMaster API',
    'DESCRIPTION': '''
VocabMaster API - Language Learning Platform

## Features
- **Authentication**: User signup, signin, email verification
- **Vocabulary**: CRUD operations for vocabulary words
- **Practice**: Spaced repetition (HLR) practice system
- **AI Generation**: Story, article, dialogue generation
- **Exams**: Create and take language exams
- **Grammar**: Grammar topics and lessons
- **TTS**: Text-to-speech with multiple providers

## Authentication
Most endpoints require authentication via Token header:
```
Authorization: Token your-auth-token
```
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Auth', 'description': 'Authentication endpoints'},
        {'name': 'Vocabulary', 'description': 'Vocabulary CRUD'},
        {'name': 'Practice', 'description': 'Practice and progress'},
        {'name': 'AI', 'description': 'AI generation features'},
        {'name': 'Exams', 'description': 'Exam management'},
        {'name': 'Grammar', 'description': 'Grammar topics'},
        {'name': 'TTS', 'description': 'Text-to-speech'},
        {'name': 'Profile', 'description': 'User profile'},
    ],
}

# Disable CSRF for API endpoints
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# Media files (for podcast audio)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# S3 Storage (For Supabase/AWS persistence on Render)
if os.environ.get('AWS_ACCESS_KEY_ID'):
    INSTALLED_APPS += ['storages']
    
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME', 'media')
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL') # Essential for Supabase
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'eu-central-1')
    
    # Public URLs configuration
    AWS_QUERYSTRING_AUTH = True  # Enable signed URLs to bypass 403 Forbidden
    AWS_S3_SIGNATURE_VERSION = 's3v4'  # Required for modern S3/Supabase
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # Use modern STORAGES setting (Django 4.2+)
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
    
    print(f"☁️ S3 Storage Enabled (Bucket: {AWS_STORAGE_BUCKET_NAME})")
else:
    print("📁 Local Storage Enabled (Warning: Ephemeral on Render)")
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }



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

# Caching (Required for Rate Limiting)
# Using LocalMemoryCache for simplicity and speed on Render free tier
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'api': {  # Custom logger for our app
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# ==========================================
# SENTRY ERROR MONITORING (Optional)
# ==========================================
# Set SENTRY_DSN environment variable to enable error tracking
# Get your DSN from: https://sentry.io/

SENTRY_DSN = os.environ.get('SENTRY_DSN', '')

if SENTRY_DSN and not DEBUG:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(
                    transaction_style='url',
                    middleware_spans=True,
                ),
                LoggingIntegration(
                    level=None,  # Capture all levels
                    event_level='ERROR',  # Send errors+ as events
                ),
            ],
            # Performance monitoring
            traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            
            # Release tracking
            release=os.environ.get('APP_VERSION', 'vocabmaster@1.0.0'),
            
            # Environment
            environment=os.environ.get('ENVIRONMENT', 'production'),
            
            # Don't send PII
            send_default_pii=False,
            
            # Ignore common framework errors
            ignore_errors=[
                'django.security.DisallowedHost',
            ],
        )
        print("✅ Sentry monitoring enabled")
    except ImportError:
        print("⚠️ sentry-sdk not installed. Run: pip install sentry-sdk")

# ==========================================
# CELERY CONFIGURATION
# ==========================================
# Broker URL (using Redis or memory for local dev)
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'memory://')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'cache+memory://')

# Task settings
CELERY_TASK_ALWAYS_EAGER = DEBUG and not os.environ.get('CELERY_BROKER_URL')  # Run tasks sync in dev
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Beat schedule for AI Gateway v2.0 tasks
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Unblock expired model instances (every 30 seconds)
    'ai-gateway-refresh-blocked': {
        'task': 'ai_gateway.refresh_blocked_instances',
        'schedule': 30.0,
    },
    # Reset minute quotas (every 60 seconds)
    'ai-gateway-reset-minute-quotas': {
        'task': 'ai_gateway.reset_minute_quotas',
        'schedule': 60.0,
    },
    # Reset daily quotas (midnight UTC)
    'ai-gateway-reset-daily-quotas': {
        'task': 'ai_gateway.reset_daily_quotas',
        'schedule': crontab(hour=0, minute=0),
    },
    # Cleanup old failure logs (3 AM UTC)
    'ai-gateway-cleanup-failure-logs': {
        'task': 'ai_gateway.cleanup_old_failure_logs',
        'schedule': crontab(hour=3, minute=0),
    },
    # Daily Podcast Digest (7 AM UTC)
    'podcast-daily-digest': {
        'task': 'api.services.external_podcast.tasks.check_new_episodes_and_notify',
        'schedule': crontab(hour=7, minute=0),
    },
}

