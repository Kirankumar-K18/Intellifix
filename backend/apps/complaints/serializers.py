from rest_framework import serializers
from .models import Complaint, ComplaintUpdate, Feedback
from apps.notifications.models import Notification
from apps.users.models import User
from apps.notifications.email_utils import send_complaint_email

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True)

    class Meta:
        model  = ComplaintUpdate
        fields = ['id', 'old_status', 'new_status', 'note', 'updated_by_name', 'created_at']


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
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Feedback
        fields = ['complaint', 'rating', 'comment']

    def validate_complaint(self, complaint):
        user = self.context['request'].user
        if complaint.user != user:
            raise serializers.ValidationError('You can only rate your own complaints.')
        if complaint.status not in ('resolved', 'closed'):
            raise serializers.ValidationError('Complaint must be resolved before rating.')
        if hasattr(complaint, 'feedback'):
            raise serializers.ValidationError('Already submitted feedback for this complaint.')
        return complaint

    def create(self, validated_data):
        return Feedback.objects.create(user=self.context['request'].user, **validated_data)


class ComplaintSerializer(serializers.ModelSerializer):
    user_name        = serializers.CharField(source='user.name', read_only=True)
    user_email       = serializers.CharField(source='user.email', read_only=True)
    department_name  = serializers.CharField(source='department.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    assigned_to_email = serializers.CharField(
        source='assigned_to.email',
        read_only=True
    )

    assigned_to_phone = serializers.CharField(
        source='assigned_to.phone',
        read_only=True
    )
    updates          = ComplaintUpdateSerializer(many=True, read_only=True)
    feedback         = FeedbackSerializer(read_only=True)
    has_feedback     = serializers.SerializerMethodField()
    image_url        = serializers.SerializerMethodField()
    frequency        = serializers.SerializerMethodField()
    is_escalated = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Complaint
        fields = [
            'id', 'title', 'description', 'location', 'address',
            'image', 'image_url', 'severity', 'population_affected',
            'priority', 'priority_score', 'ai_department_suggestion',
            'status', 'department', 'department_name',
            'user', 'user_name', 'user_email',
            'assigned_to',
            'assigned_to_name',
            'assigned_to_email',
            'assigned_to_phone',
            'is_anonymous', 'views', 'frequency',
            'created_at', 'updated_at', 'resolved_at',
            'updates', 'feedback', 'has_feedback',
            'is_escalated',
        ]
        read_only_fields = ['id', 'user', 'priority', 'priority_score',
                            'created_at', 'updated_at', 'resolved_at']

    def get_has_feedback(self, obj):
        return hasattr(obj, 'feedback') and obj.feedback is not None

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_frequency(self, obj):
        return obj.get_frequency()


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Complaint
        fields = [
            'title', 'description', 'location', 'address',
            'image', 'severity', 'population_affected',
            'department', 'is_anonymous',
        ]

    def create(self, validated_data):
        from ml.predictor import predict_priority
        request    = self.context['request']
        complaint  = Complaint(**validated_data)
        complaint.user = request.user

        # Calculate frequency before save
        freq = Complaint.objects.filter(
            department=complaint.department
        ).count()

        # ML priority prediction
        result = predict_priority(
            description        = complaint.description,
            severity           = complaint.severity,
            population_affected = complaint.population_affected,
            frequency          = freq,
            has_image          = bool(complaint.image),
            department_name    = complaint.department.name if complaint.department else '',
        )
        complaint.priority = result['priority']
        complaint.priority_score = result['score']

        # Auto Worker Assignment
        workers = User.objects.filter(
            role='worker',
            department=complaint.department,
            is_active=True
        )

        if workers.exists():

            selected_worker = min(
                workers,
                key=lambda w: Complaint.objects.filter(
                    assigned_to=w,
                    status__in=['pending', 'in_progress']
                ).count()
            )

            complaint.assigned_to = selected_worker

        
        complaint.save()
        send_complaint_email(
            complaint.user.email,
            "Complaint Submitted Successfully",
            f"""
        Your complaint has been submitted successfully.

        Title: {complaint.title}
        Priority: {complaint.priority}
        Status: {complaint.status}

        Thank you for using IntelliFix.
        """
        )
        # Notify Department Admins

        dept_admins = User.objects.filter(
            role='department_admin',
            department=complaint.department,
            is_active=True
        )

        for admin in dept_admins:
            Notification.objects.create(
                user=admin,
                complaint=complaint,
                type='system',
                title='New Complaint Received',
                message=f'A new complaint "{complaint.title}" has been submitted.'
            )
            if not complaint.assigned_to:
                for admin in dept_admins:
                    Notification.objects.create(
                        user=admin,
                        complaint=complaint,
                        type='system',
                        title='No Workers Available',
                        message=f'Complaint "{complaint.title}" could not be auto-assigned because no active workers are available.'
                    )

        # Notification
        if complaint.assigned_to:
            Notification.objects.create(
                user=complaint.assigned_to,
                complaint=complaint,
                type='assignment',
                title='New Complaint Assigned',
                message=f'Complaint "{complaint.title}" has been automatically assigned to you.'
            )
            send_complaint_email(
                complaint.assigned_to.email,
                "New Complaint Assigned",
                f"""
            A new complaint has been assigned to you.

            Title: {complaint.title}
            Priority: {complaint.priority}

            Please review it in IntelliFix.
            """
            )

        return complaint


class ComplaintStatusSerializer(serializers.ModelSerializer):
    note = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = Complaint
        fields = ['status', 'assigned_to', 'note']

    def update(self, instance, validated_data):
        from django.utils import timezone
        from apps.notifications.utils import send_status_notification

        note       = validated_data.pop('note', '')
        old_worker = instance.assigned_to
        old_status = instance.status
        instance   = super().update(instance, validated_data)
        # New assignment
        if instance.assigned_to and old_worker is None:
            Notification.objects.create(
                user=instance.assigned_to,
                complaint=instance,
                type='assignment',
                title='New Complaint Assigned',
                message=f'Complaint "{instance.title}" has been assigned to you.'
            )

        # Reassignment
        elif old_worker and old_worker != instance.assigned_to:
            Notification.objects.create(
                user=instance.assigned_to,
                complaint=instance,
                type='assignment',
                title='Complaint Reassigned',
                message=f'You are now responsible for "{instance.title}".'
            )

        if instance.status != old_status:
            # Log the update
            ComplaintUpdate.objects.create(
                complaint  = instance,
                updated_by = self.context['request'].user,
                old_status = old_status,
                new_status = instance.status,
                note       = note,
            )
            if instance.status in ('resolved', 'closed'):
                instance.resolved_at = timezone.now()
                instance.save(update_fields=['resolved_at'])

            # Send notification
            try:
                send_status_notification(instance)
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
