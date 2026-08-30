from math import radians, sin, cos, sqrt, atan2

from django.db import transaction
from django.db.models import Q

from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from django_filters.rest_framework import DjangoFilterBackend

from apps.notifications.models import Notification
from apps.notifications.email_utils import send_complaint_email
from apps.users.models import User

from .models import Complaint, ComplaintSupport, Feedback

from .serializers import (
    ComplaintSerializer,
    ComplaintCreateSerializer,
    ComplaintStatusSerializer,
    FeedbackCreateSerializer,
    FeedbackSerializer,
    ComplaintMapSerializer,
    ComplaintSupportSerializer,
)

from .escalation import run_escalation_check


# ============================================================
# LOCATION SETTINGS
# ============================================================

# Complaints within this distance are considered the same
# physical location.
SAME_LOCATION_RADIUS_METERS = 30


# ============================================================
# HELPER — DISTANCE BETWEEN TWO COORDINATES
# ============================================================

def calculate_distance_meters(lat1, lon1, lat2, lon2):
    """
    Calculate approximate distance between two latitude/longitude
    coordinates using the Haversine formula.
    """

    if None in (lat1, lon1, lat2, lon2):
        return None

    earth_radius = 6371000

    lat1 = radians(float(lat1))
    lon1 = radians(float(lon1))
    lat2 = radians(float(lat2))
    lon2 = radians(float(lon2))

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earth_radius * c


# ============================================================
# HELPER — CHECK WHETHER COMPLAINTS ARE THE SAME ISSUE
# ============================================================

def normalize_text(text):
    """
    Convert text into a simple set of meaningful words.
    """

    if not text:
        return set()

    words = (
        str(text)
        .lower()
        .replace(",", " ")
        .replace(".", " ")
        .replace("!", " ")
        .replace("?", " ")
        .replace("-", " ")
        .split()
    )

    # Ignore very common words.
    stop_words = {
        "the",
        "a",
        "an",
        "is",
        "are",
        "was",
        "were",
        "of",
        "to",
        "in",
        "on",
        "at",
        "for",
        "and",
        "or",
        "with",
        "there",
        "this",
        "that",
        "has",
        "have",
        "been",
    }

    return {
        word
        for word in words
        if len(word) > 2 and word not in stop_words
    }


def is_similar_issue(new_title, new_description, complaint):
    """
    Determine whether a new complaint describes the same issue.

    We compare the title and description using word overlap.
    """

    new_words = (
        normalize_text(new_title)
        | normalize_text(new_description)
    )

    existing_words = (
        normalize_text(complaint.title)
        | normalize_text(complaint.description)
    )

    if not new_words or not existing_words:
        return False

    intersection = new_words.intersection(existing_words)

    similarity = len(intersection) / max(
        min(len(new_words), len(existing_words)),
        1
    )

    return similarity >= 0.35


# ============================================================
# HELPER — IMAGE SCORE
# ============================================================

def get_image_score(complaint):
    """
    Reconstruct the same image score used during complaint creation.

    Relevant  -> 5
    Uncertain -> 3
    Other     -> 1
    """

    if complaint.is_image_verified:
        return 5

    if complaint.manual_review:
        return 3

    return 1


# ============================================================
# HELPER — RECALCULATE PRIORITY
# ============================================================

def recalculate_priority(complaint):
    """
    Recalculate complaint priority whenever community support changes.

    Maximum priority score = 5.
    """

    support_count = complaint.supports.count()

    # Community support contribution is capped at 5.
    support_score = min(support_count, 5)

    image_score = get_image_score(complaint)

    final_score = (
        complaint.severity * 0.35
        + complaint.population_score * 0.20
        + complaint.frequency_score * 0.20
        + image_score * 0.15
        + support_score * 0.10
    )

    # Safety clamp: always 0–5.
    final_score = max(
        0,
        min(final_score, 5)
    )

    complaint.priority_score = round(
        final_score,
        2
    )

    if final_score >= 4.5:
        complaint.priority = "critical"

    elif final_score >= 3.5:
        complaint.priority = "high"

    elif final_score >= 2.5:
        complaint.priority = "medium"

    else:
        complaint.priority = "low"

    complaint.save(
        update_fields=[
            "priority_score",
            "priority",
            "updated_at",
        ]
    )

    return complaint


# ============================================================
# PERMISSION
# ============================================================

class IsOwnerOrOfficialOrAdmin(
    permissions.BasePermission
):

    def has_object_permission(
        self,
        request,
        view,
        obj
    ):
        u = request.user

        if u.is_admin_user:
            return True

        if (
            (u.is_worker or u.is_department_admin)
            and obj.department == u.department
        ):
            return True

        return obj.user == u


# ============================================================
# COMPLAINT LIST / CREATE
# ============================================================

class ComplaintListCreateView(
    generics.ListCreateAPIView
):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "priority",
        "department",
    ]

    search_fields = [
        "title",
        "description",
        "location",
    ]

    ordering_fields = [
        "priority_score",
        "created_at",
        "status",
    ]

    ordering = [
        "-is_escalated",
        "-priority_score",
        "-created_at",
    ]

    def get_queryset(self):

        u = self.request.user

        qs = Complaint.objects.select_related(
            "user",
            "department",
            "assigned_to",
        ).prefetch_related(
            "updates",
            "feedback",
            "supports__user",
        )

        if u.is_admin_user:
            return qs

        if u.is_worker:
            return qs.filter(
                assigned_to=u
            )

        if u.is_department_admin:
            return qs.filter(
                department=u.department
            )

        return qs.filter(
            user=u
        )

    def get_serializer_class(self):

        if self.request.method == "POST":
            return ComplaintCreateSerializer

        return ComplaintSerializer

    def get_serializer_context(self):

        return {
            "request": self.request
        }

    def list(
        self,
        request,
        *args,
        **kwargs
    ):

        qs = self.filter_queryset(
            self.get_queryset()
        )

        page = self.paginate_queryset(qs)

        serializer = ComplaintSerializer(
            page or qs,
            many=True,
            context={
                "request": request
            }
        )

        if page:
            return self.get_paginated_response(
                serializer.data
            )

        return Response(
            serializer.data
        )


# ============================================================
# CHECK FOR EXISTING COMPLAINT
# ============================================================

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def check_existing_complaint(request):

    """
    Check whether a similar complaint already exists
    for the same department and physical location.

    This endpoint DOES NOT create a complaint.

    It only returns possible existing complaints so that
    the user can choose:

        Support Existing Complaint
                    OR
        Raise Different Complaint
    """

    title = request.data.get("title", "").strip()
    description = request.data.get(
        "description",
        ""
    ).strip()

    department_id = request.data.get(
        "department"
    )

    latitude = request.data.get(
        "latitude"
    )

    longitude = request.data.get(
        "longitude"
    )

    if not department_id:
        return Response(
            {
                "existing": False,
                "complaints": [],
                "detail": "Department is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if latitude is None or longitude is None:
        return Response(
            {
                "existing": False,
                "complaints": [],
                "detail": "Location coordinates are required."
            },
            status=status.HTTP_200_OK
        )

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (
        TypeError,
        ValueError
    ):
        return Response(
            {
                "existing": False,
                "complaints": [],
                "detail": "Invalid coordinates."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Only active complaints should be suggested.
    complaints = Complaint.objects.filter(
        department_id=department_id,
        status__in=[
            "pending",
            "in_progress",
        ],
        latitude__isnull=False,
        longitude__isnull=False,
    ).select_related(
        "user",
        "department",
        "assigned_to",
    ).prefetch_related(
        "supports__user"
    )

    matching_complaints = []

    for complaint in complaints:

        distance = calculate_distance_meters(
            latitude,
            longitude,
            complaint.latitude,
            complaint.longitude,
        )

        if (
            distance is None
            or distance > SAME_LOCATION_RADIUS_METERS
        ):
            continue

        if not is_similar_issue(
            title,
            description,
            complaint
        ):
            continue

        serializer = ComplaintSerializer(
            complaint,
            context={
                "request": request
            }
        )

        data = serializer.data

        # Extra information specifically for the
        # existing-complaint confirmation screen.
        data["distance_meters"] = round(
            distance,
            1
        )

        matching_complaints.append(data)

    return Response(
        {
            "existing": bool(
                matching_complaints
            ),
            "count": len(
                matching_complaints
            ),
            "complaints": matching_complaints,
        }
    )


# ============================================================
# SUPPORT EXISTING COMPLAINT
# ============================================================

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def support_complaint(
    request,
    pk
):

    """
    Support an existing complaint.

    One user can support a complaint only once.
    Priority is recalculated immediately.
    """

    with transaction.atomic():

        try:

            complaint = Complaint.objects.select_for_update().select_related(
                "user",
                "department",
                "assigned_to",
            ).get(
                pk=pk
            )

        except Complaint.DoesNotExist:

            return Response(
                {
                    "detail": "Complaint not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------------------------
        # Status validation
        # ----------------------------------------------------

        if complaint.status in [
            "resolved",
            "closed",
            "rejected",
        ]:

            return Response(
                {
                    "detail":
                        "This complaint is no longer accepting support."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Prevent owner from supporting own complaint
        # ----------------------------------------------------

        if complaint.user_id == request.user.id:

            return Response(
                {
                    "detail":
                        "You cannot support your own complaint."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Prevent duplicate support
        # ----------------------------------------------------

        support, created = ComplaintSupport.objects.get_or_create(
            complaint=complaint,
            user=request.user,
        )

        if not created:

            return Response(
                {
                    "detail":
                        "You have already supported this complaint."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # RECALCULATE PRIORITY
        # ----------------------------------------------------

        recalculate_priority(
            complaint
        )

        support_count = complaint.supports.count()

        # ----------------------------------------------------
        # NOTIFY ASSIGNED WORKER
        # ----------------------------------------------------

        if complaint.assigned_to:

            Notification.objects.create(
                user=complaint.assigned_to,
                complaint=complaint,
                type="system",
                title="Complaint Supported",
                message=(
                    f'Complaint "{complaint.title}" '
                    f'has received a new supporter. '
                    f'Total supporters: {support_count}. '
                    f'Priority: {complaint.priority_score}/5.'
                ),
            )

        # ----------------------------------------------------
        # NOTIFY DEPARTMENT ADMINS
        # ----------------------------------------------------

        dept_admins = User.objects.filter(
            role="department_admin",
            department=complaint.department,
            is_active=True,
        )

        for admin in dept_admins:

            Notification.objects.create(
                user=admin,
                complaint=complaint,
                type="system",
                title="Complaint Supported",
                message=(
                    f'Complaint "{complaint.title}" '
                    f'has received a new supporter. '
                    f'Total supporters: {support_count}. '
                    f'Priority: {complaint.priority_score}/5.'
                ),
            )

    # --------------------------------------------------------
    # RETURN UPDATED COMPLAINT
    # --------------------------------------------------------

    serializer = ComplaintSerializer(
        complaint,
        context={
            "request": request
        }
    )

    return Response(
        {
            "message":
                "Complaint supported successfully.",
            "complaint": serializer.data,
            "support_count":
                complaint.supports.count(),
            "priority_score":
                complaint.priority_score,
            "priority":
                complaint.priority,
        },
        status=status.HTTP_201_CREATED
    )


# ============================================================
# REMOVE SUPPORT
# ============================================================

@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def remove_support(
    request,
    pk
):

    """
    Allows a user to withdraw their support.

    Priority is recalculated again after removal.
    """

    with transaction.atomic():

        try:

            complaint = Complaint.objects.select_for_update().get(
                pk=pk
            )

        except Complaint.DoesNotExist:

            return Response(
                {
                    "detail": "Complaint not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        support = ComplaintSupport.objects.filter(
            complaint=complaint,
            user=request.user,
        ).first()

        if not support:

            return Response(
                {
                    "detail":
                        "You have not supported this complaint."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        support.delete()

        recalculate_priority(
            complaint
        )

    serializer = ComplaintSerializer(
        complaint,
        context={
            "request": request
        }
    )

    return Response(
        {
            "message":
                "Support removed successfully.",
            "complaint": serializer.data,
            "support_count":
                complaint.supports.count(),
            "priority_score":
                complaint.priority_score,
            "priority":
                complaint.priority,
        }
    )


# ============================================================
# COMPLAINT DETAIL
# ============================================================

class ComplaintDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        permissions.IsAuthenticated,
        IsOwnerOrOfficialOrAdmin,
    ]

    def get_queryset(self):

        return Complaint.objects.select_related(
            "user",
            "department",
            "assigned_to",
        ).prefetch_related(
            "updates",
            "feedback",
            "supports__user",
        )

    def get_serializer_class(self):

        if self.request.method in (
            "PUT",
            "PATCH",
        ):
            return ComplaintStatusSerializer

        return ComplaintSerializer

    def get_serializer_context(self):

        return {
            "request": self.request
        }

    def retrieve(
        self,
        request,
        *args,
        **kwargs
    ):

        obj = self.get_object()

        obj.views += 1

        obj.save(
            update_fields=[
                "views"
            ]
        )

        serializer = ComplaintSerializer(
            obj,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data
        )

    def perform_update(
        self,
        serializer
    ):

        u = self.request.user

        complaint = self.get_object()

        if (
            u.is_admin_user
            or u.is_department_admin
        ):

            serializer.save()

            return

        if (
            u.is_worker
            and complaint.assigned_to == u
        ):

            serializer.save()

            return

        raise PermissionDenied(
            "You can only update complaints assigned to you."
        )

    def perform_destroy(
        self,
        instance
    ):

        if not self.request.user.is_admin_user:

            raise PermissionDenied(
                "Only admins can delete complaints."
            )

        instance.delete()


# ============================================================
# FEEDBACK LIST
# ============================================================

class FeedbackListView(
    generics.ListAPIView
):

    serializer_class = FeedbackSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        u = self.request.user

        qs = Feedback.objects.select_related(
            "complaint",
            "user",
        )

        if u.is_admin_user:
            return qs

        if u.is_worker:
            return qs.filter(
                complaint__assigned_to=u
            )

        if u.is_department_admin:
            return qs.filter(
                complaint__department=u.department
            )

        return qs.filter(
            user=u
        )


# ============================================================
# FEEDBACK CREATE
# ============================================================

class FeedbackCreateView(
    generics.CreateAPIView
):

    serializer_class = FeedbackCreateSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_serializer_context(self):

        return {
            "request": self.request
        }

    def perform_create(
        self,
        serializer
    ):

        feedback = serializer.save()

        # IMPORTANT:
        # complaint must be assigned BEFORE using it.
        complaint = feedback.complaint

        # ----------------------------------------------------
        # Notify assigned worker
        # ----------------------------------------------------

        if complaint.assigned_to:

            Notification.objects.create(
                user=complaint.assigned_to,
                complaint=complaint,
                type="feedback",
                title="New Feedback Received",
                message=(
                    f'You received a {feedback.rating}/5 '
                    f'rating for "{complaint.title}".'
                ),
            )

            try:

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

            except Exception:

                pass


# ============================================================
# MY COMPLAINTS
# ============================================================

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_complaints(request):

    qs = Complaint.objects.filter(
        user=request.user
    ).select_related(
        "department",
        "assigned_to",
    ).prefetch_related(
        "feedback",
        "supports__user",
    )

    serializer = ComplaintSerializer(
        qs,
        many=True,
        context={
            "request": request
        }
    )

    return Response(
        serializer.data
    )


# ============================================================
# TRIGGER ESCALATION
# ============================================================

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def trigger_escalation(request):

    if not request.user.is_department_admin:

        return Response(
            {
                "error":
                    "Only Department Admin can run escalation"
            },
            status=status.HTTP_403_FORBIDDEN
        )

    run_escalation_check()

    return Response(
        {
            "message":
                "Escalation check completed successfully"
        }
    )


# ============================================================
# COMPLAINT MAP
# ============================================================

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def complaint_map(request):

    user = request.user

    if not user.is_department_admin:

        return Response(
            {
                "detail":
                    "Only Department Admin can access map."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    complaints = Complaint.objects.filter(
        department=user.department
    ).exclude(
        latitude__isnull=True,
        longitude__isnull=True
    )

    serializer = ComplaintMapSerializer(
        complaints,
        many=True
    )

    return Response(
        serializer.data
    )