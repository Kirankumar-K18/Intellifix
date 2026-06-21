from django.urls import path
from .views import overview, department_analytics

urlpatterns = [
    path('',           overview,              name='analytics-overview'),
    path('department/', department_analytics,  name='analytics-department'),
]
