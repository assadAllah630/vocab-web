"""
Test script for email sending functionality
Tests both Gmail SMTP and SendGrid
"""
import os
import sys
from pathlib import Path

# Add the server directory to the path
server_path = Path(__file__).parent / 'server'
sys.path.insert(0, str(server_path))

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = Path(__file__).parent / 'server' / '.env'
load_dotenv(env_path)

print("=" * 60)
print("EMAIL SENDING TEST")
print("=" * 60)

# Check environment variables
print("\n📋 Checking environment variables...")
gmail_user = os.getenv('GMAIL_USER')
gmail_password = os.getenv('GMAIL_APP_PASSWORD')
sendgrid_key = os.getenv('SENDGRID_API_KEY')

print(f"✓ GMAIL_USER: {gmail_user if gmail_user else '❌ NOT FOUND'}")
print(f"✓ GMAIL_APP_PASSWORD: {'***' + gmail_password[-4:] if gmail_password else '❌ NOT FOUND'}")
print(f"✓ SENDGRID_API_KEY: {'***' + sendgrid_key[-4:] if sendgrid_key else '❌ NOT FOUND'}")

# Import the email utility
print("\n📧 Importing email utility...")
try:
    from api.email_utils import send_otp_email
    print("✓ Email utility imported successfully")
except Exception as e:
    print(f"❌ Failed to import email utility: {e}")
    sys.exit(1)

# Test email
test_email = input("\n📨 Enter test email address (default: assadalshaikh3@gmail.com): ").strip()
if not test_email:
    test_email = "assadalshaikh3@gmail.com"

test_otp = "123456"

print(f"\n🚀 Sending test OTP email to: {test_email}")
print(f"   OTP Code: {test_otp}")
print("\nAttempting to send...")

# Send email
try:
    result = send_otp_email(test_email, test_otp)
    
    print("\n" + "=" * 60)
    if result:
        print("✅ EMAIL SENT SUCCESSFULLY!")
        print(f"✓ Check the inbox of {test_email}")
        print("✓ Also check spam/junk folder")
    else:
        print("❌ EMAIL SENDING FAILED!")
        print("✗ Check the error messages above")
        print("✗ Verify your credentials in server/.env")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error during email sending: {e}")
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()
