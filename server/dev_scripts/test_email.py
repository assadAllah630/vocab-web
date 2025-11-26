import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("Testing email configuration...")
print(f"From: {settings.EMAIL_HOST_USER}")
print(f"To: assad.allah630@gmail.com")

try:
    send_mail(
        'Test Email from Vocab App',
        'Congratulations! Your email configuration is working perfectly! 🎉\n\nYou can now:\n- Send OTP codes for registration\n- Send exam share notifications\n- Send any other emails from your app\n\nBest regards,\nVocab Learning Team',
        settings.DEFAULT_FROM_EMAIL,
        ['assad.allah630@gmail.com'],
        fail_silently=False,
    )
    print("\n✅ SUCCESS! Email sent successfully!")
    print("Check your inbox at assad.allah630@gmail.com")
except Exception as e:
    print(f"\n❌ FAILED: {e}")
    print("\nTroubleshooting:")
    print("1. Check that your Gmail App Password is correct (no spaces)")
    print("2. Verify 2-Step Verification is enabled on your Google account")
    print("3. Make sure you're using an App Password, not your regular Gmail password")
