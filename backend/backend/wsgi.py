import os
from django.core.wsgi import get_wsgi_application

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get WSGI application
application = get_wsgi_application()

# This application object is used by the WSGI server (Apache with mod_wsgi or gunicorn)
# It will be referenced by the service file