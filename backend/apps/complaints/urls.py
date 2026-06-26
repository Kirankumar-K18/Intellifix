from django.urls import path
from .views import (
    ComplaintListCreateView, ComplaintDetailView,complaint_map,
    FeedbackListView, FeedbackCreateView, my_complaints
)
from .views import trigger_escalation
urlpatterns = [
    path('',               ComplaintListCreateView.as_view(), name='complaint-list'),
    path('mine/',          my_complaints,                     name='my-complaints'),
    path('<int:pk>/',      ComplaintDetailView.as_view(),     name='complaint-detail'),
    path('feedback/',      FeedbackListView.as_view(),        name='feedback-list'),
    path('feedback/add/',  FeedbackCreateView.as_view(),      name='feedback-add'),
    path(
        'run-escalation/',
        trigger_escalation,
        name='run-escalation'
    ),
    path(
        'map/',
        complaint_map,
        name='complaint-map'
    ),
]
