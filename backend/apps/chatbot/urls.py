from django.urls import path
from .views import suggest_department, predict_priority_view

urlpatterns = [
    path('suggest/',          suggest_department,    name='chatbot-suggest'),
    path('predict-priority/', predict_priority_view, name='predict-priority'),
]
