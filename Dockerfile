FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy project
COPY . /app/

# Build React frontend
WORKDIR /app/frontend
RUN npm install \
    && npm run build

# Move back to app directory
WORKDIR /app

# Collect static files
RUN cd backend && python manage.py collectstatic --noinput

# Run gunicorn
WORKDIR /app/backend
CMD gunicorn --bind 0.0.0.0:$PORT backend.wsgi
