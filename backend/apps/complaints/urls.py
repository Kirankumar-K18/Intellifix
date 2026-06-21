from django.urls import path
from .views import (
    ComplaintListCreateView, ComplaintDetailView,
    FeedbackListView, FeedbackCreateView, my_complaints
)

urlpatterns = [
    path('',               ComplaintListCreateView.as_view(), name='complaint-list'),
    path('mine/',          my_complaints,                     name='my-complaints'),
    path('<int:pk>/',      ComplaintDetailView.as_view(),     name='complaint-detail'),
    path('feedback/',      FeedbackListView.as_view(),        name='feedback-list'),
    path('feedback/add/',  FeedbackCreateView.as_view(),      name='feedback-add'),
]
