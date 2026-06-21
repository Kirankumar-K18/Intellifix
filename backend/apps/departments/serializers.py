from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    complaint_count  = serializers.SerializerMethodField()
    resolved_count   = serializers.SerializerMethodField()
    pending_count    = serializers.SerializerMethodField()
    avg_rating       = serializers.SerializerMethodField()
    official_count   = serializers.SerializerMethodField()

    class Meta:
        model  = Department
        fields = [
            'id', 'name', 'description', 'email', 'phone', 'icon',
            'is_active', 'complaint_count', 'resolved_count',
            'pending_count', 'avg_rating', 'official_count', 'created_at'
        ]

    def get_complaint_count(self, obj):  return obj.get_complaint_count()
    def get_resolved_count(self, obj):   return obj.get_resolved_count()
    def get_pending_count(self, obj):    return obj.get_pending_count()
    def get_avg_rating(self, obj):       return round(obj.get_avg_rating(), 2)
    def get_official_count(self, obj):
        from django.contrib.auth import get_user_model
        return get_user_model().objects.filter(department=obj, role='department').count()
