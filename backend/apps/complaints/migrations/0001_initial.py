from django.db import migrations, models
import apps.complaints.models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial      = True
    dependencies  = [
        ('users', '0001_initial'),
        ('departments', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Complaint',
            fields=[
                ('id',                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('title',                 models.CharField(max_length=300)),
                ('description',           models.TextField()),
                ('location',              models.CharField(max_length=300)),
                ('address',               models.TextField(blank=True)),
                ('image',                 models.ImageField(blank=True, null=True, upload_to=apps.complaints.models.complaint_image_path)),
                ('severity',              models.IntegerField(choices=[(1,'1'),(2,'2'),(3,'3'),(4,'4'),(5,'5')], default=3)),
                ('population_affected',   models.IntegerField(default=1)),
                ('priority',              models.CharField(choices=[('low','Low'),('medium','Medium'),('high','High'),('critical','Critical')], default='medium', max_length=10)),
                ('priority_score',        models.FloatField(default=0.0)),
                ('ai_department_suggestion', models.CharField(blank=True, max_length=100)),
                ('status',                models.CharField(choices=[('pending','Pending'),('in_progress','In Progress'),('resolved','Resolved'),('closed','Closed'),('rejected','Rejected')], default='pending', max_length=20)),
                ('is_anonymous',          models.BooleanField(default=False)),
                ('views',                 models.IntegerField(default=0)),
                ('created_at',            models.DateTimeField(auto_now_add=True)),
                ('updated_at',            models.DateTimeField(auto_now=True)),
                ('resolved_at',           models.DateTimeField(blank=True, null=True)),
                ('user',         models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='complaints', to='users.user')),
                ('department',   models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='complaints', to='departments.department')),
                ('assigned_to',  models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_complaints', to='users.user')),
            ],
            options={'db_table': 'complaints', 'ordering': ['-priority_score', '-created_at']},
        ),
        migrations.CreateModel(
            name='ComplaintUpdate',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('old_status', models.CharField(max_length=20)),
                ('new_status', models.CharField(max_length=20)),
                ('note',       models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('complaint',  models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='updates', to='complaints.complaint')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='users.user')),
            ],
            options={'db_table': 'complaint_updates', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('rating',     models.IntegerField(choices=[(1,1),(2,2),(3,3),(4,4),(5,5)])),
                ('comment',    models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('complaint',  models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='feedback', to='complaints.complaint')),
                ('user',       models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='feedbacks', to='users.user')),
            ],
            options={'db_table': 'feedback'},
        ),
    ]
