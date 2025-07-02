#!/bin/bash

# Set the environment variables for development
export DJANGO_DEBUG=True
export DJANGO_SECRET_KEY=dev_secret_key
export SCHEDULE_FILE_PATH="$(pwd)/schedule.xlsx"
# Comment out FORCE_SCRIPT_NAME for local development
export DJANGO_FORCE_SCRIPT_NAME=""

# Start the Django development server on port 8004
python manage.py runserver 8004
