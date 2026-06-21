from django.db import migrations, models

def convert_department_users(apps, schema_editor):
    User = apps.get_model('users', 'User')

    User.objects.filter(role='department').update(
        role='worker'
    )

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_groups_alter_user_is_superuser_and_more'),
    ]

    operations = [
        migrations.RunPython(convert_department_users),

        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                max_length=20,
                default='citizen',
                choices=[
                    ('citizen', 'Citizen'),
                    ('worker', 'Worker'),
                    ('department_admin', 'Department Admin'),
                    ('admin', 'Admin'),
                ],
            ),
        ),
    ]