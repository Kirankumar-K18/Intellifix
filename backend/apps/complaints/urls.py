from django.urls import path

from .views import (
    ComplaintListCreateView,
    ComplaintDetailView,
    complaint_map,
    FeedbackListView,
    FeedbackCreateView,
    my_complaints,
    trigger_escalation,
    check_existing_complaint,
    support_complaint,
    remove_support,
)


urlpatterns = [

    # ------------------------------------------------------------------
    # Complaints
    # ------------------------------------------------------------------

    path(
        '',
        ComplaintListCreateView.as_view(),
        name='complaint-list'
    ),

    path(
        'mine/',
        my_complaints,
        name='my-complaints'
    ),

    # ------------------------------------------------------------------
    # Existing complaint detection
    # ------------------------------------------------------------------

    path(
        'check-existing/',
        check_existing_complaint,
        name='check-existing-complaint'
    ),

    # ------------------------------------------------------------------
    # Feedback
    # ------------------------------------------------------------------

    path(
        'feedback/',
        FeedbackListView.as_view(),
        name='feedback-list'
    ),

    path(
        'feedback/add/',
        FeedbackCreateView.as_view(),
        name='feedback-add'
    ),

    # ------------------------------------------------------------------
    # Escalation
    # ------------------------------------------------------------------

    path(
        'run-escalation/',
        trigger_escalation,
        name='run-escalation'
    ),

    # ------------------------------------------------------------------
    # Complaint Map
    # ------------------------------------------------------------------

    path(
        'map/',
        complaint_map,
        name='complaint-map'
    ),

    # ------------------------------------------------------------------
    # Complaint Support
    # ------------------------------------------------------------------

    path(
        '<int:pk>/support/',
        support_complaint,
        name='complaint-support'
    ),

    path(
        '<int:pk>/support/remove/',
        remove_support,
        name='complaint-remove-support'
    ),

    # ------------------------------------------------------------------
    # Complaint detail
    # ------------------------------------------------------------------

    path(
        '<int:pk>/',
        ComplaintDetailView.as_view(),
        name='complaint-detail'
    ),
]