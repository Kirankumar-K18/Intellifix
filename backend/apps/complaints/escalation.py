from django.utils import timezone
from datetime import timedelta

from apps.complaints.models import Complaint
from apps.notifications.models import Notification
from apps.notifications.email_utils import send_complaint_email
from apps.users.models import User


def run_escalation_check():

    complaints = Complaint.objects.filter(
        status__in=['pending', 'in_progress'],
        is_escalated=False
    )

    now = timezone.now()

    for complaint in complaints:

        days_open = (now - complaint.created_at).days

        should_escalate = False

        if complaint.priority.lower() == 'high' and days_open >= 3:
            should_escalate = True

        elif complaint.priority.lower() == 'medium' and days_open >= 5:
            should_escalate = True

        elif complaint.priority.lower() == 'low' and days_open >= 7:
            should_escalate = True

        if should_escalate:

            complaint.is_escalated = True
            complaint.escalated_at = now
            complaint.save()

            admins = User.objects.filter(
                role='department_admin',
                department=complaint.department,
                is_active=True
            )

            for admin in admins:

                Notification.objects.create(
                    user=admin,
                    complaint=complaint,
                    type='system',
                    title='Complaint Escalated',
                    message=f'Complaint "{complaint.title}" requires attention.'
                )

                send_complaint_email(
                    admin.email,
                    'Complaint Escalated',
                    f'''
Complaint: {complaint.title}

Priority: {complaint.priority}

Status: {complaint.status}

This complaint has exceeded the allowed resolution time.
'''
                )
                # Notify Citizen

                Notification.objects.create(
                    user=complaint.user,
                    complaint=complaint,
                    type='system',
                    title='Complaint Escalated',
                    message=f'Your complaint "{complaint.title}" has been escalated to higher priority.'
                )

                send_complaint_email(
                    complaint.user.email,
                    'Your Complaint Has Been Escalated',
                    f'''
                Dear {complaint.user.name},

                Your complaint has been escalated because it has not been resolved within the expected time.

                Complaint: {complaint.title}

                Current Status: {complaint.status}

                Priority: {complaint.priority}

                Our department has been notified and will take action as soon as possible.

                Thank you,
                IntelliFix Team
                '''
                )