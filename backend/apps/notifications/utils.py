"""Notification utilities — creates in-app records and sends emails."""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

STATUS_MESSAGES = {
    'pending':     ('Complaint Received', 'Your complaint  has been received and is pending review.'),
    'in_progress': ('Complaint In Progress', 'Your complaint "{title}" is now being worked on by our team.'),
    'resolved':    ('Complaint Resolved', 'Your complaint "{title}" has been resolved. Please rate your experience.'),
    'closed':      ('Complaint Closed', 'Your complaint "{title}" has been closed.'),
    'rejected':    ('Complaint Rejected', 'Your complaint "{title}" has been reviewed and rejected. Please contact support for more information.'),
}


def send_status_notification(complaint):
    """Creates an in-app notification and sends an email for a status change."""
    from .models import Notification

    entry = STATUS_MESSAGES.get(complaint.status)
    if not entry:
        return

    title   = entry[0]
    message = entry[1].format(id=complaint.id, title=complaint.title)

    # In-app notification
    Notification.objects.create(
        user      = complaint.user,
        complaint = complaint,
        type      = 'status_update',
        title     = title,
        message   = message,
    )

    # Email notification
    if complaint.user.email and settings.EMAIL_HOST_USER:
        try:
            send_mail(
                subject      = f'[IntelliFix] {title}',
                message      = f'Dear {complaint.user.name},\n\n{message}\n\nThank you,\nIntelliFix Team',
                from_email   = settings.DEFAULT_FROM_EMAIL,
                recipient_list = [complaint.user.email],
                fail_silently  = True,
            )
        except Exception as e:
            logger.warning(f'Email send failed for this complaint ')


def create_notification(user, title, message, complaint=None, notif_type='system'):
    """Generic notification creator."""
    from .models import Notification
    return Notification.objects.create(
        user=user, complaint=complaint,
        type=notif_type, title=title, message=message,
    )
