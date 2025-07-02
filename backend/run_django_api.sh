#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set environment variables
export DJANGO_DEBUG=False
export DJANGO_FORCE_SCRIPT_NAME=/acr_schedule

# Collect static files for Django admin
python manage.py collectstatic --noinput

# Determine which server to use based on environment
if [ "$1" == "gunicorn" ]; then
    echo "Running with Gunicorn..."
    ./venv/bin/python -m gunicorn backend.wsgi:application --bind 127.0.0.1:8000
else
    # Default to uvicorn for production (matches systemd service)
    echo "Running with Uvicorn..."
    ./venv/bin/uvicorn --port=8004 --timeout-graceful-shutdown 5 'backend.asgi:application'
fi
