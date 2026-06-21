from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied

from .serializers import (
    UserSerializer, RegisterSerializer,
    CustomTokenSerializer, ChangePasswordSerializer
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user   = s.save()
        tokens = RefreshToken.for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(tokens.access_token),
            'refresh': str(tokens),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class   = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        request.user.set_password(s.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


class UserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['role', 'is_active', 'department']
    search_fields = ['name', 'email', 'phone']

    def get_queryset(self):
        user = self.request.user

        if user.is_admin_user:
            return User.objects.select_related('department').all()

        if user.is_department_admin:
            return User.objects.filter(
                department=user.department,
                role='worker'
            )

        return User.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_admin_user:
            serializer.save()
            return

        if user.is_department_admin:
            serializer.save(
                role='worker',
                department=user.department
            )
            return

        raise PermissionDenied("Not allowed")

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin_user:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
        return Response({'detail': 'Logged out successfully.'})
    except Exception:
        return Response({'detail': 'Invalid token.'}, status=400)
