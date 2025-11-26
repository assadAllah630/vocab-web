#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify gunicorn is installed
if ! command -v gunicorn &> /dev/null; then
    echo "ERROR: gunicorn could not be found after install!"
    pip list
    exit 1
fi

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully!"
