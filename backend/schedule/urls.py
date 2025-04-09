from django.urls import path
from .views import ScheduleAPIView

urlpatterns = [
    path('', ScheduleAPIView.as_view(), name='schedule'),
]