from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial      = True
    dependencies  = [
        ('users',      '0001_initial'),
        ('complaints', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('type',       models.CharField(choices=[('status_update','Status Update'),('assignment','Assignment'),('feedback','Feedback Request'),('system','System')], default='system', max_length=30)),
                ('title',      models.CharField(max_length=255)),
                ('message',    models.TextField()),
                ('is_read',    models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user',       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='users.user')),
                ('complaint',  models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='complaints.complaint')),
            ],
            options={'db_table': 'notifications', 'ordering': ['-created_at']},
        ),
    ]
