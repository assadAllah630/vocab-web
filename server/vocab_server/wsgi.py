"""
WSGI config for vocab_server project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
from django.core.management import call_command
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')

# Run migrations on startup to ensure database is up to date
# This is crucial for production environments like Render
try:
    print("Running database migrations...")
    call_command('migrate', '--noinput')
    print("✅ Migrations completed successfully")
except Exception as e:
    print(f"⚠️ Migration error: {e}")
    # Don't fail startup even if migrations fail
    # This allows the app to start and show more detailed errors

application = get_wsgi_application()
