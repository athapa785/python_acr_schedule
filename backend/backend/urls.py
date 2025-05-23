from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schedule/', include('schedule.urls')),
    
    # Serve static files
    *static(settings.STATIC_URL, document_root=settings.STATIC_ROOT),
    
    # Serve React frontend for all other routes
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]