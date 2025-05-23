#!/bin/bash
# Production deployment script for ACR Schedule Viewer

# Exit on error
set -e

echo "Starting deployment process..."

# 1. Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# 2. Build React frontend
echo "Building React frontend..."
cd ../frontend
npm install
npm run build
cd ../backend

# 3. Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 4. Run migrations
echo "Running database migrations..."
python manage.py migrate

# 5. Start Gunicorn server
echo "Starting Gunicorn server..."
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
