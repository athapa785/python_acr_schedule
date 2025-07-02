from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schedule/', include('schedule.urls')),
]

# Serve static files - Django will handle this when Apache doesn't
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Add catch-all route for SPA - Django will serve the React app
# This will only be used if Apache doesn't handle the request first
urlpatterns += [re_path(r'^.*$', TemplateView.as_view(template_name='index.html'))]