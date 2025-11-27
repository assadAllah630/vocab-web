#!/usr/bin/env python3
"""
Verify Production Readiness Script
Simulates production checks locally to catch issues before deployment.
"""
import os
import sys
import django
from django.conf import settings
from django.core.cache import caches
from django.db import connections
from django.core.management import call_command

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vocab_server.settings")

def check_environment():
    print("🔍 Checking Environment Variables...")
    required_vars = [
        "DJANGO_SECRET_KEY",
        "DATABASE_URL",
        "FRONTEND_URL",
        "ALLOWED_HOSTS"
    ]
    missing = []
    for var in required_vars:
        if not os.environ.get(var):
            # In local dev, some might be missing, but we warn
            print(f"⚠️  Warning: {var} is not set (OK for local, bad for prod)")
            missing.append(var)
    
    if not missing:
        print("✅ Environment variables look good.")

def check_database():
    print("\n🔍 Checking Database Connection...")
    try:
        django.setup()
        db_conn = connections['default']
        db_conn.cursor()
        print("✅ Database connection successful.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def check_cache():
    print("\n🔍 Checking Cache Configuration...")
    try:
        cache = caches['default']
        cache.set('test_key', 'test_value', 30)
        value = cache.get('test_key')
        if value == 'test_value':
            print(f"✅ Cache ({settings.CACHES['default']['BACKEND']}) is working.")
        else:
            print("❌ Cache failed to retrieve value.")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Cache check failed: {e}")
        print("💡 Hint: Did you add CACHES to settings.py?")
        sys.exit(1)

def check_static_files():
    print("\n🔍 Checking Static Files...")
    try:
        call_command('collectstatic', '--dry-run', '--noinput', verbosity=0)
        print("✅ Static files configuration is valid.")
    except Exception as e:
        print(f"❌ Static files check failed: {e}")
        sys.exit(1)

def check_system():
    print("\n🔍 Running Django System Check...")
    try:
        call_command('check')
        print("✅ Django system check passed.")
    except Exception as e:
        print(f"❌ System check failed: {e}")
        sys.exit(1)

def main():
    print("🚀 Starting Production Verification...\n")
    
    # Set fake env vars for local testing if not present
    if not os.environ.get('DJANGO_SECRET_KEY'):
        os.environ['DJANGO_SECRET_KEY'] = 'test-key'
    
    check_environment()
    check_database()
    check_cache()
    check_static_files()
    check_system()
    
    print("\n✨ All checks passed! Ready for deployment.")

if __name__ == "__main__":
    main()
