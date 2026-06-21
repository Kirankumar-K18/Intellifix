from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Department
from .serializers import DepartmentSerializer
from django.contrib.auth import get_user_model


class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset           = Department.objects.filter(is_active=True)
    serializer_class   = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields      = ['name', 'description']

    def perform_create(self, serializer):
        if not self.request.user.is_admin_user:
            raise PermissionDenied('Only admins can create departments.')

        department = serializer.save()

        User = get_user_model()

        # Create Department Admin automatically
        if department.email:
            User.objects.create_user(
                email=department.email,
                name=f"{department.name} Admin",
                password="Dept@1234",
                role="department_admin",
                department=department,
                is_staff=True
            )


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Department.objects.all()
    serializer_class   = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        if not self.request.user.is_admin_user:
            raise PermissionDenied('Only admins can update departments.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_admin_user:
            raise PermissionDenied('Only admins can delete departments.')
        instance.is_active = False
        instance.save()
