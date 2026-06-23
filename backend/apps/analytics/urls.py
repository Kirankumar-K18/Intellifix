from django.urls import path
from .views import (
    overview,
    department_analytics,
    export_workers_pdf
)
urlpatterns = [
    path('',           overview,              name='analytics-overview'),
    path('department/', department_analytics,  name='analytics-department'),
    path(
        'export-workers-pdf/',
        export_workers_pdf,
        name='export-workers-pdf'
    ),
]
