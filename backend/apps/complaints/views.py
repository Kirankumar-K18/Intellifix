from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from apps.notifications.models import Notification

from .models import Complaint, Feedback
from .serializers import (
    ComplaintSerializer, ComplaintCreateSerializer,
    ComplaintStatusSerializer, FeedbackCreateSerializer, FeedbackSerializer
)


class IsOwnerOrOfficialOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        u = request.user
        if u.is_admin_user:
            return True
        if (u.is_worker or u.is_department_admin) and obj.department == u.department:
            return True
        return obj.user == u


class ComplaintListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'priority', 'department']
    search_fields      = ['title', 'description', 'location']
    ordering_fields    = ['priority_score', 'created_at', 'status']
    ordering = [
        '-is_escalated',
        '-priority_score',
        '-created_at'
    ]
    def get_queryset(self):
        u  = self.request.user
        qs = Complaint.objects.select_related(
            'user', 'department', 'assigned_to'
        ).prefetch_related('updates', 'feedback')

        if u.is_admin_user:
            return qs
        if u.is_worker:
            return qs.filter(assigned_to=u)

        if u.is_department_admin:
            return qs.filter(department=u.department)
        return qs.filter(user=u)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def list(self, request, *args, **kwargs):
        qs   = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        s    = ComplaintSerializer(page or qs, many=True, context={'request': request})
        return self.get_paginated_response(s.data) if page else Response(s.data)


class ComplaintDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrOfficialOrAdmin]

    def get_queryset(self):
        return Complaint.objects.select_related(
            'user', 'department', 'assigned_to'
        ).prefetch_related('updates', 'feedback')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ComplaintStatusSerializer
        return ComplaintSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.views += 1
        obj.save(update_fields=['views'])
        s = ComplaintSerializer(obj, context={'request': request})
        return Response(s.data)

    def perform_update(self, serializer):
        u = self.request.user
        complaint = self.get_object()

        if u.is_admin_user or u.is_department_admin:
            serializer.save()
            return

        if u.is_worker and complaint.assigned_to == u:
            serializer.save()
            return

        raise PermissionDenied('You can only update complaints assigned to you.')

    def perform_destroy(self, instance):
        if not self.request.user.is_admin_user:
            raise PermissionDenied('Only admins can delete complaints.')
        instance.delete()


class FeedbackListView(generics.ListAPIView):
    serializer_class   = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        qs = Feedback.objects.select_related('complaint', 'user')

        if u.is_admin_user:
            return qs

        if u.is_worker:
            return qs.filter(complaint__assigned_to=u)

        if u.is_department_admin:
            return qs.filter(complaint__department=u.department)

        return qs.filter(user=u)


class FeedbackCreateView(generics.CreateAPIView):
    serializer_class   = FeedbackCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}
    def perform_create(self, serializer):
            feedback = serializer.save()
            from apps.notifications.email_utils import send_complaint_email
            if complaint.assigned_to:
                send_complaint_email(
                    complaint.assigned_to.email,
                    "New Feedback Received",
                    f"""
            You received a new rating.

            Complaint: {complaint.title}

            Rating: {feedback.rating}/5

            Comment:
            {feedback.comment}
            """
                )

            complaint = feedback.complaint

            if complaint.assigned_to:
                Notification.objects.create(
                    user=complaint.assigned_to,
                    complaint=complaint,
                    type='feedback',
                    title='New Feedback Received',
                    message=f'You received a {feedback.rating}/5 rating for "{complaint.title}".'
                )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_complaints(request):
    qs = Complaint.objects.filter(user=request.user).select_related('department', 'assigned_to').prefetch_related('feedback')
    s  = ComplaintSerializer(qs, many=True, context={'request': request})
    return Response(s.data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .escalation import run_escalation_check


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_escalation(request):

    if not request.user.is_department_admin:
        return Response(
            {'error': 'Only Department Admin can run escalation'},
            status=403
        )

    run_escalation_check()

    return Response({
        'message': 'Escalation check completed successfully'
    })