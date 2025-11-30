import os
import django
from django.conf import settings

# Configure Django settings to use the production database
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
os.environ['DATABASE_URL'] = "postgresql://vocabmaster:1RZ8xSDg5Acx599w1TRBdj2u74jMXjSv@dpg-d4jmdn0bdp1s73825mcg-a.oregon-postgres.render.com/vocabmaster"

django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    username = 'admin'
    email = 'admin@vocabmaster.com'
    password = 'AdminSecurePassword2024!'
    
    if User.objects.filter(username=username).exists():
        print(f"User '{username}' already exists.")
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated password and permissions for '{username}'.")
    else:
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser '{username}' created successfully.")
    
    print(f"\nCredentials:")
    print(f"Username: {username}")
    print(f"Password: {password}")

if __name__ == '__main__':
    create_superuser()
