from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_department(request):
    """
    ML-powered department suggestion chatbot.
    Input:  { "description": "..." }
    Output: { "suggestions": [{ "department", "department_id", "confidence" }] }
    """
    description = request.data.get('description', '').strip()
    if len(description) < 10:
        return Response(
            {'error': 'Please provide at least 10 characters describing your issue.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from ml.predictor import predict_department
    from apps.departments.models import Department

    predictions = predict_department(description, top_n=3)

    results = []
    for pred in predictions:
        dept_name = pred['department']
        # Try to match with actual DB department
        dept = Department.objects.filter(
            name__icontains=dept_name.split('&')[0].strip(),
            is_active=True
        ).first()

        # Second attempt: partial match on any word
        if not dept:
            words = dept_name.split()
            for word in words:
                if len(word) > 3:
                    dept = Department.objects.filter(name__icontains=word, is_active=True).first()
                    if dept:
                        break

        results.append({
            'department':    dept_name,
            'department_id': dept.id if dept else None,
            'confidence':    pred['confidence'],
        })

    return Response({
        'input':       description[:200],
        'suggestions': results,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_priority_view(request):
    """
    Predict complaint priority from submitted data.
    Input: { description, severity, population_affected, department_name, has_image }
    """
    from ml.predictor import predict_priority

    description         = request.data.get('description', '')
    severity            = int(request.data.get('severity', 3))
    population_affected = int(request.data.get('population_affected', 1))
    department_name     = request.data.get('department_name', '')
    has_image           = bool(request.data.get('has_image', False))

    from apps.complaints.models import Complaint
    from apps.departments.models import Department

    dept = Department.objects.filter(name=department_name).first()
    frequency = Complaint.objects.filter(department=dept).count() if dept else 0

    result = predict_priority(
        description         = description,
        severity            = severity,
        population_affected = population_affected,
        frequency           = frequency,
        has_image           = has_image,
        department_name     = department_name,
    )
    return Response(result)
