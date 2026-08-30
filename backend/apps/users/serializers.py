from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Avg
from apps.complaints.models import Complaint, Feedback

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False
    )

    assigned_count = serializers.SerializerMethodField()
    resolved_count = serializers.SerializerMethodField()
    in_progress_count = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            'id',
            'email',
            'name',
            'phone',
            'role',
            'department',
            'department_name',
            'avatar',
            'is_active',
            'date_joined',

            'assigned_count',
            'resolved_count',
            'in_progress_count',
            'avg_rating',

            'password'
        ]

        read_only_fields = [
            'id',
            'date_joined',
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)

        # Password is REQUIRED when creating a staff account.
        role = validated_data.get('role')

        if role in ['admin', 'department_admin', 'worker'] and not password:
            raise serializers.ValidationError({
                'password': 'Password is required for staff accounts.'
            })

        user = User(**validated_data)

        if password:
            user.set_password(password)

        user.save()

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        return instance

    def get_assigned_count(self, obj):
        if not obj.is_worker:
            return 0

        return Complaint.objects.filter(
            assigned_to=obj
        ).count()

    def get_resolved_count(self, obj):
        if not obj.is_worker:
            return 0

        return Complaint.objects.filter(
            assigned_to=obj,
            status='resolved'
        ).count()

    def get_in_progress_count(self, obj):
        if not obj.is_worker:
            return 0

        return Complaint.objects.filter(
            assigned_to=obj,
            status='in_progress'
        ).count()

    def get_avg_rating(self, obj):
        if not obj.is_worker:
            return 0

        avg = Feedback.objects.filter(
            complaint__assigned_to=obj
        ).aggregate(
            avg=Avg('rating')
        )['avg']

        return round(avg or 0, 1)

class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['email', 'name', 'phone', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(role='citizen', **validated_data)


class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
