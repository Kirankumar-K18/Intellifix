from django.contrib import admin
from .models import Complaint, ComplaintUpdate, Feedback


class ComplaintUpdateInline(admin.TabularInline):
    model  = ComplaintUpdate
    extra  = 0
    readonly_fields = ['updated_by', 'old_status', 'new_status', 'note', 'created_at']


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display   = ['id', 'title', 'user', 'department', 'priority', 'status', 'created_at']
    list_filter    = ['status', 'priority', 'department']
    search_fields  = ['title', 'description', 'location', 'user__email']
    ordering       = ['-priority_score', '-created_at']
    readonly_fields = ['priority', 'priority_score', 'created_at', 'updated_at']
    inlines        = [ComplaintUpdateInline]


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display  = ['complaint', 'user', 'rating', 'created_at']
    list_filter   = ['rating']
    search_fields = ['comment', 'user__email']
