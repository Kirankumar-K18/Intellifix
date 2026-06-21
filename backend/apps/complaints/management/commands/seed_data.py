"""
python manage.py seed_data
Creates sample departments, users and complaints for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.departments.models import Department
from apps.complaints.models import Complaint

User = get_user_model()

DEPARTMENTS = [
    ('Roads & Infrastructure', 'Road maintenance, potholes, bridges, streetlights', '🛣️', 'roads@intellifix.com'),
    ('Water Supply',           'Water distribution, pipelines, billing',             '💧', 'water@intellifix.com'),
    ('Electricity',            'Power supply, outages, meters',                      '⚡', 'elec@intellifix.com'),
    ('Sanitation & Waste',     'Garbage collection, drainage, sewage',               '🗑️', 'sanit@intellifix.com'),
    ('Health & Medical',       'Public health, hospitals, sanitation',               '🏥', 'health@intellifix.com'),
    ('Education',              'Schools, teachers, mid-day meals',                   '📚', 'edu@intellifix.com'),
    ('Parks & Recreation',     'Parks, playgrounds, public spaces',                  '🌳', 'parks@intellifix.com'),
    ('Public Safety',          'Law enforcement, crime, traffic safety',              '🚔', 'safety@intellifix.com'),
    ('Revenue & Taxation',     'Property tax, land records, permits',                '📋', 'revenue@intellifix.com'),
]


class Command(BaseCommand):
    help = 'Seed initial data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database...')

        dept_objs = {}
        for name, desc, icon, email in DEPARTMENTS:
            dept, created = Department.objects.get_or_create(
                name=name,
                defaults={'description': desc, 'icon': icon, 'email': email}
            )
            dept_objs[name] = dept
            if created:
                self.stdout.write(f'  ✓ Department: {name}')

        # Admin
        if not User.objects.filter(email='admin@intellifix.com').exists():
            User.objects.create_superuser(
                email='admin@intellifix.com', name='System Admin', password='Admin@1234'
            )
            self.stdout.write('  ✓ Admin: admin@intellifix.com / Admin@1234')

        # Department officials
        officials = [
            ('Ramesh Patil',  'ramesh@intellifix.com',   'Roads & Infrastructure'),
            ('Kavitha Nair',  'kavitha@intellifix.com',  'Water Supply'),
            ('Suresh Kumar',  'suresh@intellifix.com',   'Electricity'),
            ('Meena Iyer',    'meena@intellifix.com',    'Sanitation & Waste'),
            ('Priya Sharma',  'priya@intellifix.com',    'Health & Medical'),
        ]
        for name, email, dept_name in officials:
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    email=email, name=name, password='Official@1234',
                    role='department', department=dept_objs[dept_name]
                )
                self.stdout.write(f'  ✓ Official: {email} → {dept_name}')

        # Citizens
        citizens = [
            ('Ravi Kumar',   'ravi@example.com'),
            ('Anjali Singh', 'anjali@example.com'),
            ('Mohan Das',    'mohan@example.com'),
        ]
        for name, email in citizens:
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(email=email, name=name, password='User@1234', role='citizen')
                self.stdout.write(f'  ✓ Citizen: {email}')

        # Sample complaints
        if Complaint.objects.count() == 0:
            from ml.predictor import predict_priority
            citizen = User.objects.filter(role='citizen').first()
            samples = [
                ('Large pothole on MG Road', 'Dangerous pothole near junction causing daily accidents.', 'MG Road, Bengaluru', 'Roads & Infrastructure', 4, 200),
                ('No water supply for 3 days', 'Colony has had no water. 200+ families affected.', 'HSR Layout, Bengaluru', 'Water Supply', 5, 400),
                ('Power outage for 12 hours', 'Daily power cuts affecting businesses and homes.', 'BTM Layout, Bengaluru', 'Electricity', 4, 300),
                ('Garbage not collected', 'Garbage not picked up for 5 consecutive days.', 'Indiranagar, Bengaluru', 'Sanitation & Waste', 3, 150),
                ('Dengue outbreak spreading', 'Multiple dengue cases confirmed in our colony.', 'Koramangala, Bengaluru', 'Health & Medical', 5, 500),
            ]
            for title, desc, loc, dept_name, sev, pop in samples:
                dept   = dept_objs[dept_name]
                freq   = Complaint.objects.filter(department=dept).count()
                result = predict_priority(desc, sev, pop, freq, False, dept_name)
                Complaint.objects.create(
                    user=citizen, department=dept,
                    title=title, description=desc, location=loc,
                    severity=sev, population_affected=pop,
                    priority=result['priority'], priority_score=result['score'],
                )
                self.stdout.write(f'  ✓ Complaint: {title} [{result["priority"]}]')

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!\n'))
        self.stdout.write('Test Credentials:')
        self.stdout.write('  Admin:    admin@intellifix.com   / Admin@1234')
        self.stdout.write('  Official: ramesh@intellifix.com  / Official@1234')
        self.stdout.write('  Citizen:  ravi@example.com       / User@1234')
