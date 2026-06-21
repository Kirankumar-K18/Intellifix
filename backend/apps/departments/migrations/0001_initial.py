from django.db import migrations, models


class Migration(migrations.Migration):
    initial      = True
    dependencies  = []

    operations = [
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('name',        models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('email',       models.EmailField(blank=True)),
                ('phone',       models.CharField(blank=True, max_length=15)),
                ('icon',        models.CharField(default='🏢', max_length=10)),
                ('is_active',   models.BooleanField(default=True)),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
                ('updated_at',  models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'departments', 'ordering': ['name']},
        ),
    ]
