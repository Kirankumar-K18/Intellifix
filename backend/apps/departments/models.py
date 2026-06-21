from django.db import models


class Department(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    email       = models.EmailField(blank=True)
    phone       = models.CharField(max_length=15, blank=True)
    icon        = models.CharField(max_length=10, default='🏢')
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_complaint_count(self):
        return self.complaints.count()

    def get_resolved_count(self):
        return self.complaints.filter(status='resolved').count()

    def get_pending_count(self):
        return self.complaints.filter(status='pending').count()

    def get_avg_rating(self):
        from django.db.models import Avg
        return self.complaints.filter(
            feedback__isnull=False
        ).aggregate(avg=Avg('feedback__rating'))['avg'] or 0.0
