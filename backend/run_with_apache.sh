#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install or update dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run Django with Gunicorn
# Using port 8000 - make sure this doesn't conflict with Apache
gunicorn --bind 127.0.0.1:8000 backend.wsgi:application
