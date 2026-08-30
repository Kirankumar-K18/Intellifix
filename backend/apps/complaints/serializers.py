from rest_framework import serializers

from django.db import transaction

from .models import (
    Complaint,
    ComplaintUpdate,
    Feedback,
    ComplaintSupport,
)

from apps.notifications.models import Notification
from apps.users.models import User

from apps.notifications.email_utils import send_complaint_email

from apps.complaints.ai.image_classifier import verify_image

from .ai_priority import (
    predict_severity,
    get_population_score,
    get_frequency_score,
)


# ============================================================
# COMPLAINT UPDATE SERIALIZER
# ============================================================

class ComplaintUpdateSerializer(serializers.ModelSerializer):

    updated_by_name = serializers.CharField(
        source='updated_by.name',
        read_only=True
    )

    class Meta:
        model = Complaint

        fields = [
            'id',
            'old_status',
            'new_status',
            'note',
            'updated_by_name',
            'created_at',
        ]


# ============================================================
# FEEDBACK SERIALIZER
# ============================================================

class FeedbackSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source='user.name',
        read_only=True
    )

    complaint_id = serializers.IntegerField(
        source='complaint.id',
        read_only=True
    )

    assigned_to = serializers.IntegerField(
        source='complaint.assigned_to.id',
        read_only=True
    )

    assigned_to_name = serializers.CharField(
        source='complaint.assigned_to.name',
        read_only=True
    )

    class Meta:
        model = Feedback

        fields = [
            'id',
            'rating',
            'comment',
            'user_name',
            'complaint_id',
            'assigned_to',
            'assigned_to_name',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
        ]


# ============================================================
# FEEDBACK CREATE SERIALIZER
# ============================================================

class FeedbackCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Feedback

        fields = [
            'complaint',
            'rating',
            'comment',
        ]

    def validate_complaint(self, complaint):

        user = self.context['request'].user

        if complaint.user != user:
            raise serializers.ValidationError(
                'You can only rate your own complaints.'
            )

        if complaint.status not in ('resolved', 'closed'):
            raise serializers.ValidationError(
                'Complaint must be resolved before rating.'
            )

        if hasattr(complaint, 'feedback'):
            raise serializers.ValidationError(
                'Already submitted feedback for this complaint.'
            )

        return complaint

    def create(self, validated_data):

        return Feedback.objects.create(
            user=self.context['request'].user,
            **validated_data
        )


# ============================================================
# SUPPORT SERIALIZER
# ============================================================

class ComplaintSupportSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source='user.name',
        read_only=True
    )

    user_email = serializers.CharField(
        source='user.email',
        read_only=True
    )

    user_phone = serializers.CharField(
        source='user.phone',
        read_only=True
    )

    class Meta:
        model = ComplaintSupport

        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'user_phone',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'user',
            'created_at',
        ]


# ============================================================
# MAIN COMPLAINT SERIALIZER
# ============================================================

class ComplaintSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source='user.name',
        read_only=True
    )

    user_email = serializers.CharField(
        source='user.email',
        read_only=True
    )

    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )

    assigned_to_name = serializers.CharField(
        source='assigned_to.name',
        read_only=True
    )

    assigned_to_email = serializers.CharField(
        source='assigned_to.email',
        read_only=True
    )

    assigned_to_phone = serializers.CharField(
        source='assigned_to.phone',
        read_only=True
    )

    updates = ComplaintUpdateSerializer(
        many=True,
        read_only=True
    )

    feedback = FeedbackSerializer(
        read_only=True
    )

    has_feedback = serializers.SerializerMethodField()

    image_url = serializers.SerializerMethodField()

    frequency = serializers.SerializerMethodField()

    is_escalated = serializers.BooleanField(
        read_only=True
    )

    # ========================================================
    # COMMUNITY SUPPORT
    # ========================================================

    support_count = serializers.SerializerMethodField()

    supporters = serializers.SerializerMethodField()

    # ========================================================
    # CURRENT USER SUPPORT STATUS
    # ========================================================

    user_has_supported = serializers.SerializerMethodField()

    class Meta:

        model = Complaint

        fields = [
            'id',

            'title',
            'description',
            'location',
            'address',

            'latitude',
            'longitude',

            'image',
            'image_url',

            'severity',
            'population_affected',

            'priority',
            'priority_score',

            'ai_department_suggestion',

            'status',

            'department',
            'department_name',

            'user',
            'user_name',
            'user_email',

            'assigned_to',
            'assigned_to_name',
            'assigned_to_email',
            'assigned_to_phone',

            'is_anonymous',

            'views',

            'frequency',

            # Community support
            'support_count',
            'supporters',
            'user_has_supported',

            'created_at',
            'updated_at',
            'resolved_at',

            'updates',
            'feedback',
            'has_feedback',

            'is_escalated',
        ]

        read_only_fields = [
            'id',
            'user',

            'priority',
            'priority_score',

            'created_at',
            'updated_at',
            'resolved_at',
        ]

    # ========================================================
    # FEEDBACK
    # ========================================================

    def get_has_feedback(self, obj):

        return hasattr(obj, 'feedback') and obj.feedback is not None

    # ========================================================
    # IMAGE URL
    # ========================================================

    def get_image_url(self, obj):

        request = self.context.get('request')

        if obj.image and request:

            return request.build_absolute_uri(
                obj.image.url
            )

        return None

    # ========================================================
    # FREQUENCY
    # ========================================================

    def get_frequency(self, obj):

        return obj.get_frequency()

    # ========================================================
    # SUPPORT COUNT
    # ========================================================

    def get_support_count(self, obj):

        return obj.supports.count()

    # ========================================================
    # SUPPORTER DETAILS
    # ========================================================

    def get_supporters(self, obj):

        request = self.context.get('request')

        # Only officials/admins can see supporter details
        if not request:
            return []

        user = request.user

        if not (
            user.is_admin_user
            or user.is_department_admin
            or user.is_worker
        ):
            return []

        return [
            {
                'id': support.user.id,
                'name': support.user.name,
                'email': support.user.email,
                'phone': support.user.phone,
                'supported_at': support.created_at,
            }

            for support in obj.supports.select_related(
                'user'
            ).all()
        ]

    # ========================================================
    # CURRENT USER SUPPORT STATUS
    # ========================================================

    def get_user_has_supported(self, obj):

        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return False

        return ComplaintSupport.objects.filter(
            complaint=obj,
            user=request.user
        ).exists()


# ============================================================
# COMPLAINT CREATE SERIALIZER
# ============================================================

class ComplaintCreateSerializer(serializers.ModelSerializer):

    class Meta:

        model = Complaint

        fields = [
            'title',
            'description',
            'location',

            'latitude',
            'longitude',

            'address',

            'image',

            'department',

            'is_anonymous',
        ]

    @transaction.atomic
    def create(self, validated_data):

        request = self.context["request"]

        # ====================================================
        # CREATE COMPLAINT
        # ====================================================

        complaint = Complaint(**validated_data)

        complaint.user = request.user

        # ====================================================
        # AUTO DETECT COORDINATES
        # ====================================================

        from .location_ai import get_coordinates

        if (
            complaint.latitude is None
            or complaint.longitude is None
        ):

            coords = get_coordinates(
                complaint.location
            )

            if coords:

                complaint.latitude = coords["latitude"]

                complaint.longitude = coords["longitude"]

                complaint.address = coords["address"]

        # Save first so uploaded image exists
        complaint.save()

        # ====================================================
        # CNN IMAGE VERIFICATION
        # ====================================================

        image_score = 1

        if complaint.image:

            result = verify_image(
                complaint.image.path
            )

            if result["action"] == "reject":

                raise serializers.ValidationError({
                    "image": result["reason"]
                })

            complaint.image_prediction = result["prediction"]

            if result["label"] == "relevant":

                complaint.is_image_verified = True

                complaint.manual_review = False

                image_score = 5

            elif result["label"] == "uncertain":

                complaint.is_image_verified = False

                complaint.manual_review = True

                image_score = 3

            else:

                complaint.is_image_verified = False

                complaint.manual_review = True

                image_score = 1

            complaint.save(
                update_fields=[
                    "image_prediction",
                    "is_image_verified",
                    "manual_review",
                ]
            )

        # ====================================================
        # AI PRIORITY PREDICTION
        # ====================================================

        severity = predict_severity(
            complaint.description
        )

        population_score = get_population_score(
            complaint.location
        )

        frequency_score = get_frequency_score(
            complaint.location
        )

        # ====================================================
        # COMMUNITY SUPPORT SCORE
        # ====================================================

        # A new complaint starts with zero supporters.
        support_count = complaint.supports.count()

        # Maximum support contribution = 5
        support_score = min(
            support_count,
            5
        )

        # ====================================================
        # FINAL PRIORITY SCORE
        #
        # Maximum = 5
        #
        # Severity          35%
        # Population        20%
        # Frequency         20%
        # Image              15%
        # Community Support  10%
        # ====================================================

        final_score = (

            severity * 0.35

            + population_score * 0.20

            + frequency_score * 0.20

            + image_score * 0.15

            + support_score * 0.10

        )

        # Safety clamp:
        # Priority must always remain between 0 and 5.

        final_score = max(
            0,
            min(final_score, 5)
        )

        complaint.severity = severity

        complaint.population_score = population_score

        complaint.frequency_score = frequency_score

        complaint.priority_score = round(
            final_score,
            2
        )

        complaint.ai_department_suggestion = (

            complaint.department.name

            if complaint.department

            else ""

        )

        # ====================================================
        # PRIORITY CATEGORY
        # ====================================================

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
                "severity",
                "population_score",
                "frequency_score",
                "priority_score",
                "priority",
                "ai_department_suggestion",
            ]
        )

        # ====================================================
        # AUTO WORKER ASSIGNMENT
        # ====================================================

        workers = User.objects.filter(

            role="worker",

            department=complaint.department,

            is_active=True,

        )

        if workers.exists():

            selected_worker = min(

                workers,

                key=lambda w:
                Complaint.objects.filter(

                    assigned_to=w,

                    status__in=[
                        "pending",
                        "in_progress"
                    ],

                ).count(),

            )

            complaint.assigned_to = selected_worker

            complaint.save(
                update_fields=[
                    "assigned_to"
                ]
            )

        # ====================================================
        # EMAIL TO CITIZEN
        # ====================================================

        send_complaint_email(

            complaint.user.email,

            "Complaint Submitted Successfully",

            f"""
Your complaint has been submitted successfully.

Title: {complaint.title}
Priority: {complaint.priority}
Priority Score: {complaint.priority_score}/5
Status: {complaint.status}

Thank you for using IntelliFix.
"""

        )

        # ====================================================
        # DEPARTMENT ADMINS
        # ====================================================

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

                title="New Complaint Received",

                message=(
                    f'A new complaint '
                    f'"{complaint.title}" '
                    f'has been submitted.'
                ),

            )

        # ====================================================
        # NO WORKERS AVAILABLE
        # ====================================================

        if not complaint.assigned_to:

            for admin in dept_admins:

                Notification.objects.create(

                    user=admin,

                    complaint=complaint,

                    type="system",

                    title="No Workers Available",

                    message=(
                        f'Complaint '
                        f'"{complaint.title}" '
                        f'could not be auto-assigned '
                        f'because no active workers '
                        f'are available.'
                    ),

                )

        # ====================================================
        # NOTIFY ASSIGNED WORKER
        # ====================================================

        if complaint.assigned_to:

            Notification.objects.create(

                user=complaint.assigned_to,

                complaint=complaint,

                type="assignment",

                title="New Complaint Assigned",

                message=(
                    f'Complaint '
                    f'"{complaint.title}" '
                    f'has been automatically assigned '
                    f'to you.'
                ),

            )

            send_complaint_email(

                complaint.assigned_to.email,

                "New Complaint Assigned",

                f"""
A new complaint has been assigned to you.

Title: {complaint.title}
Priority: {complaint.priority}
Priority Score: {complaint.priority_score}/5

Please review it in IntelliFix.
"""

            )

        return complaint


# ============================================================
# COMPLAINT STATUS SERIALIZER
# ============================================================

class ComplaintStatusSerializer(
    serializers.ModelSerializer
):

    note = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:

        model = Complaint

        fields = [
            'status',
            'assigned_to',
            'note',
        ]

    def update(
        self,
        instance,
        validated_data
    ):

        from django.utils import timezone

        from apps.notifications.utils import (
            send_status_notification
        )

        note = validated_data.pop(
            'note',
            ''
        )

        old_worker = instance.assigned_to

        old_status = instance.status

        instance = super().update(
            instance,
            validated_data
        )

        # ====================================================
        # NEW ASSIGNMENT
        # ====================================================

        if (
            instance.assigned_to
            and old_worker is None
        ):

            Notification.objects.create(

                user=instance.assigned_to,

                complaint=instance,

                type='assignment',

                title='New Complaint Assigned',

                message=(
                    f'Complaint '
                    f'"{instance.title}" '
                    f'has been assigned to you.'
                )

            )

        # ====================================================
        # REASSIGNMENT
        # ====================================================

        elif (
            old_worker
            and old_worker != instance.assigned_to
        ):

            Notification.objects.create(

                user=instance.assigned_to,

                complaint=instance,

                type='assignment',

                title='Complaint Reassigned',

                message=(
                    f'You are now responsible '
                    f'for "{instance.title}".'
                )

            )

        # ====================================================
        # STATUS CHANGE
        # ====================================================

        if instance.status != old_status:

            ComplaintUpdate.objects.create(

                complaint=instance,

                updated_by=self.context[
                    'request'
                ].user,

                old_status=old_status,

                new_status=instance.status,

                note=note,

            )

            # ==================================================
            # RESOLVED / CLOSED
            # ==================================================

            if instance.status in (
                'resolved',
                'closed'
            ):

                instance.resolved_at = (
                    timezone.now()
                )

                instance.save(
                    update_fields=[
                        'resolved_at'
                    ]
                )

            # ==================================================
            # STATUS NOTIFICATION
            # ==================================================

            try:

                send_status_notification(
                    instance
                )

                send_complaint_email(

                    instance.user.email,

                    "Complaint Status Updated",

                    f"""
Your complaint status has changed.

Title: {instance.title}

Old Status: {old_status}
New Status: {instance.status}

Thank you for using IntelliFix.
"""

                )

            except Exception:

                pass

        return instance


# ============================================================
# COMPLAINT MAP SERIALIZER
# ============================================================

class ComplaintMapSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Complaint

        fields = [
            'id',
            'title',
            'latitude',
            'longitude',
            'priority',
            'status',
            'location',
        ]