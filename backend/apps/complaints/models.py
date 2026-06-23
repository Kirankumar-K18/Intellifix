import os
import re
from datetime import datetime
from django.db import models
from django.conf import settings


def complaint_image_path(instance, filename):
    """Saves as: complaints/username_YYYYMMDD_HHmmss.ext"""
    try:
        username = instance.user.name or instance.user.email.split('@')[0]
    except Exception:
        username = 'user'
    safe = re.sub(r'[^a-z0-9]', '', username.lower())[:20] or 'user'
    ts   = datetime.now().strftime('%Y%m%d_%H%M%S')
    ext  = os.path.splitext(filename)[1].lower() or '.jpg'
    return f'complaints/{safe}_{ts}{ext}'


class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending',     'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved',    'Resolved'),
        ('closed',      'Closed'),
        ('rejected',    'Rejected'),
    ]
    PRIORITY_CHOICES = [
        ('low',      'Low'),
        ('medium',   'Medium'),
        ('high',     'High'),
        ('critical', 'Critical'),
    ]
    SEVERITY_CHOICES = [(i, str(i)) for i in range(1, 6)]

    # Core fields
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints')
    department      = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, related_name='complaints')
    title           = models.CharField(max_length=300)
    description     = models.TextField()
    location        = models.CharField(max_length=300)
    address         = models.TextField(blank=True)

    # Image
    image           = models.ImageField(upload_to=complaint_image_path, null=True, blank=True)

    # ML-driven priority inputs
    severity        = models.IntegerField(choices=SEVERITY_CHOICES, default=3)
    population_affected = models.IntegerField(default=1)

    # ML outputs
    priority        = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    priority_score  = models.FloatField(default=0.0)
    ai_department_suggestion = models.CharField(max_length=100, blank=True)

    # Status tracking
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_complaints'
    )
    is_escalated = models.BooleanField(default=False)
    escalated_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    resolved_at     = models.DateTimeField(null=True, blank=True)

    # Extra metadata
    is_anonymous    = models.BooleanField(default=False)
    views           = models.IntegerField(default=0)

    class Meta:
        db_table = 'complaints'
        ordering = ['-priority_score', '-created_at']

    def __str__(self):
        return f'#{self.id} {self.title} [{self.priority}]'

    def get_frequency(self):
        """Count similar complaints in same area last 30 days."""
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=30)
        return Complaint.objects.filter(
            department=self.department,
            created_at__gte=cutoff,
        ).exclude(pk=self.pk).count()


class ComplaintUpdate(models.Model):
    """Timeline of status changes."""
    complaint   = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='updates')
    updated_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    old_status  = models.CharField(max_length=20)
    new_status  = models.CharField(max_length=20)
    note        = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_updates'
        ordering = ['-created_at']


class Feedback(models.Model):
    complaint  = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='feedback')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feedbacks')
    rating     = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedback'

    def __str__(self):
        return f'Feedback #{self.complaint_id} — {self.rating}★'
