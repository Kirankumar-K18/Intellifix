from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from apps.complaints.models import Complaint, Feedback

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overview(request):
    from apps.complaints.models import Complaint, Feedback
    from apps.departments.models import Department
    from django.contrib.auth import get_user_model
    User = get_user_model()

    u = request.user

    # Scope query by role
    if u.is_admin_user:
        c_qs = Complaint.objects.all()
        f_qs = Feedback.objects.all()
    elif u.is_worker or u.is_department_admin:
        c_qs = Complaint.objects.filter(department=u.department)
        f_qs = Feedback.objects.filter(complaint__department=u.department)
    else:
        c_qs = Complaint.objects.filter(user=u)
        f_qs = Feedback.objects.filter(user=u)

    total     = c_qs.count()
    resolved  = c_qs.filter(status='resolved').count()
    pending   = c_qs.filter(status='pending').count()
    in_prog   = c_qs.filter(status='in_progress').count()
    closed    = c_qs.filter(status='closed').count()
    rejected  = c_qs.filter(status='rejected').count()
    escalated = c_qs.filter(is_escalated=True).count()

    by_status = list(c_qs.values('status').annotate(count=Count('id')).order_by('status'))
    by_priority = list(c_qs.values('priority').annotate(count=Count('id')))
    by_dept   = list(
        c_qs.values('department__name', 'department__icon')
            .annotate(count=Count('id'))
            .order_by('-count')
    )

    # Monthly trend – last 6 months
    six_months_ago = timezone.now() - timedelta(days=180)
    # Monthly trend – last 6 months
    monthly = []
    for m in monthly:
        if m['month']:
            m['month'] = m['month'].strftime('%b %Y')

    avg_rating  = f_qs.aggregate(avg=Avg('rating'))['avg'] or 0.0
    rating_dist = list(f_qs.values('rating').annotate(count=Count('id')).order_by('rating'))

    data = {
        'summary': {
            'total': total, 'resolved': resolved, 'pending': pending,
            'in_progress': in_prog, 'closed': closed, 'rejected': rejected,'escalated': escalated,
            'resolution_rate': round(resolved / total * 100, 1) if total else 0,
        },
        'by_status':    by_status,
        'by_priority':  by_priority,
        'by_department': by_dept,
        'monthly_trend': monthly,
        'feedback': {
            'avg_rating':  round(avg_rating, 2),
            'total':       f_qs.count(),
            'distribution': rating_dist,
        },
    }

    # Admin-only extras
    if u.is_admin_user:
        data['total_users']       = User.objects.count()
        data['total_departments'] = Department.objects.filter(is_active=True).count()
        data['top_departments']   = list(
            Department.objects.annotate(c=Count('complaints'))
                              .order_by('-c').values('name', 'icon', 'c')[:5]
        )

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_analytics(request):
    from apps.complaints.models import Complaint, Feedback
    u = request.user

    if u.is_worker or u.is_department_admin:
        dept = u.department
    elif u.is_admin_user:
        dept_id = request.query_params.get('department_id')
        from apps.departments.models import Department
        try:
            dept = Department.objects.get(pk=dept_id)
        except Exception:
            return Response({'error': 'Department not found'}, status=404)
    else:
        return Response({'error': 'Unauthorized'}, status=403)

    c_qs = Complaint.objects.filter(department=dept)

    # Weekly trend – last 8 weeks
    eight_weeks_ago = timezone.now() - timedelta(weeks=8)
    weekly = list(
        c_qs.filter(created_at__gte=eight_weeks_ago)
            .extra(select={"week": "DATE(created_at)"})
            .values("week")
            .annotate(count=Count("id"))
    )
    for w in weekly:
        if w['week']:
            w['week'] = w['week'].strftime('%d %b')

    avg_resolution_hours = None
    resolved_with_times  = c_qs.filter(
        status='resolved',
        resolved_at__isnull=False,
        created_at__isnull=False,
    )
    if resolved_with_times.exists():
        total_hours = sum(
            (c.resolved_at - c.created_at).total_seconds() / 3600
            for c in resolved_with_times
        )
        avg_resolution_hours = round(total_hours / resolved_with_times.count(), 1)

    return Response({
        'department': dept.name,
        'total':      c_qs.count(),
        'resolved':   c_qs.filter(status='resolved').count(),
        'pending':    c_qs.filter(status='pending').count(),
        'in_progress': c_qs.filter(status='in_progress').count(),
        'avg_rating': round(
            Feedback.objects.filter(complaint__department=dept).aggregate(avg=Avg('rating'))['avg'] or 0, 2
        ),
        'weekly_trend':          weekly,
        'avg_resolution_hours':  avg_resolution_hours,
        'by_priority': list(c_qs.values('priority').annotate(count=Count('id'))),
    })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_workers_pdf(request):
    from apps.users.models import User

    user = request.user

    if not user.is_department_admin:
        return Response(
            {'error': 'Only Department Admin can export reports'},
            status=403
        )

    workers = User.objects.filter(
        role='worker',
        department=user.department
    )

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = (
        'attachment; filename="workers_report.pdf"'
    )

    doc = SimpleDocTemplate(response)

    styles = getSampleStyleSheet()

    content = []

    content.append(
        Paragraph(
            f'IntelliFix - {user.department.name} Workers Report',
            styles['Title']
        )
    )

    content.append(Spacer(1, 20))

    data = [[
        'Worker',
        'Assigned',
        'Resolved',
        'Active',
        'Rating'
    ]]


    for worker in workers:

        assigned_count = Complaint.objects.filter(
            assigned_to=worker
        ).count()

        resolved_count = Complaint.objects.filter(
            assigned_to=worker,
            status='resolved'
        ).count()

        in_progress_count = Complaint.objects.filter(
            assigned_to=worker,
            status='in_progress'
        ).count()

        avg_rating = Feedback.objects.filter(
            complaint__assigned_to=worker
        ).aggregate(avg=Avg('rating'))['avg'] or 0

        data.append([
            worker.name,
            assigned_count,
            resolved_count,
            in_progress_count,
            round(avg_rating, 1)
        ])

    table = Table(data)

    table.setStyle(
        TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')
        ])
    )

    content.append(table)

    doc.build(content)

    return response