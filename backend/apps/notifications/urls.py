from django.urls import path
from .views import NotificationListView, mark_read, mark_all_read, unread_count

urlpatterns = [
    path('',                  NotificationListView.as_view(), name='notification-list'),
    path('unread-count/',     unread_count,                   name='unread-count'),
    path('mark-all-read/',    mark_all_read,                  name='mark-all-read'),
    path('<int:pk>/read/',    mark_read,                      name='mark-read'),
]
