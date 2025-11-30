"""
Script to assign admin role to the 'admin' user in production database
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.admin_models import AdminRole

# Get the admin user
username = 'admin'

try:
    user = User.objects.get(username=username)
    print(f"✓ Found user: {username}")
    
    # Check if AdminRole already exists
    try:
        admin_role = AdminRole.objects.get(user=user)
        print(f"✓ Admin role already exists: {admin_role.role}")
        print(f"  Is Active: {admin_role.is_active}")
    except AdminRole.DoesNotExist:
        # Create SUPER_ADMIN role
        admin_role = AdminRole.objects.create(
            user=user,
            role='SUPER_ADMIN',
            assigned_by=user,  # Self-assigned
            is_active=True
        )
        print(f"✓ Created AdminRole: SUPER_ADMIN for {username}")
        print(f"  Permissions: {admin_role.get_permissions()}")
        
    print(f"\n✓ Success! User '{username}' can now log into the admin panel.")
    
except User.DoesNotExist:
    print(f"✗ Error: User '{username}' not found in database.")
    print("  Please run create_remote_superuser.py first.")
