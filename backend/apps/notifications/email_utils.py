from django.core.mail import send_mail
from django.conf import settings


def send_complaint_email(user_email, subject, message):
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=False
        )
        print("Email sent successfully")
    except Exception as e:
        print("Email Error:", e)