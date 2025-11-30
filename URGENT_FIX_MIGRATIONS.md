# URGENT: Manual Steps Required to Fix Database

## The Problem
Migrations are NOT running automatically. The database tables (including `auth_user`) don't exist.

## Why Automated Fixes Failed
1. **`render.yaml` changes** - Only apply to NEW services, not existing ones
2. **`wsgi.py` migrations** - May be cached by gunicorn workers

## SOLUTION: Update Start Command in Render Dashboard

### Steps:
1. Go to https://dashboard.render.com/
2. Select your `vocab-web` service
3. Go to **Settings** tab
4. Find **Start Command** setting
5. Change it to:
   ```
   python manage.py migrate --noinput && gunicorn vocab_server.wsgi:application --bind 0.0.0.0:$PORT
   ```
6. Click **Save Changes**
7. Render will automatically redeploy

### Alternative: Run Migration Manually via Shell
1. In Render Dashboard, go to **Shell** tab
2. Run:
   ```bash
   cd server
   python manage.py migrate
   ```

### After Migration Runs
The error "relation 'auth_user' does not exist" will be gone, and login will work!
