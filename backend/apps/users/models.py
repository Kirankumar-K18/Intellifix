from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('citizen', 'Citizen'),
        ('worker', 'Worker'),
        ('department_admin', 'Department Admin'),
        ('admin', 'Admin'),
    ]

    email       = models.EmailField(unique=True)
    name        = models.CharField(max_length=150)
    phone       = models.CharField(max_length=15, blank=True)
    role        = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    department  = models.ForeignKey(
        'departments.Department',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='officials'
    )
    avatar      = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table  = 'users'
        ordering  = ['-date_joined']
        verbose_name = 'User'

    def __str__(self):
        return f'{self.name} <{self.email}>'

    @property
    def is_citizen(self):
        return self.role == 'citizen'

    @property
    def is_worker(self):
        return self.role == 'worker'

    @property
    def is_department_admin(self):
        return self.role == 'department_admin'

    @property
    def is_admin_user(self):
        return self.role == 'admin'