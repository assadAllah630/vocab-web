"""Setup admin user with teacher profile and approved application."""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

from django.contrib.auth.models import User
from api.models import Teacher, TeacherApplication

# Get admin user
admin = User.objects.get(username='admin')
print(f'Admin user: {admin.username}, is_staff: {admin.is_staff}, is_superuser: {admin.is_superuser}')

# Create teacher profile if not exists
teacher, created = Teacher.objects.get_or_create(
    user=admin,
    defaults={
        'organization_name': 'VocabMaster Admin',
        'bio': 'System Administrator',
        'is_verified': True
    }
)
print(f'Teacher profile: {"Created" if created else "Already exists"}')

# Create approved application if not exists
app, app_created = TeacherApplication.objects.get_or_create(
    user=admin,
    defaults={
        'status': 'approved',
        'resume_link': 'https://admin',
        'intro_video_link': 'https://admin',
        'experience_years': 10,
        'teaching_languages': ['en', 'ar', 'de'],
        'bio': 'System Administrator'
    }
)
if not app_created and app.status != 'approved':
    app.status = 'approved'
    app.save()
print(f'Application: {"Created" if app_created else "Updated"} - Status: {app.status}')
print('')
print('✅ Admin user is ready!')
print('Login at http://localhost:5173/login')
print('Username: admin')
print('Password: admin123')
