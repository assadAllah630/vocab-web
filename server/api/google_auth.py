"""
Google OAuth and Email Services
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import UserProfile


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def send_otp_email(email, otp):
    """Send OTP email to user"""
    subject = 'Your Vocab App Verification Code'
    message = f"""
    Hello!
    
    Your verification code is: {otp}
    
    This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.
    
    If you didn't request this code, please ignore this email.
    
    Best regards,
    Vocab Learning Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_notification_email(to_email, subject, message):
    """Send notification email"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send notification: {e}")
        return False


@api_view(['POST'])
@authentication_classes([])  # Disable authentication for OAuth login
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Handle Google OAuth login
    Expects: { "credential": "google_id_token" }
    """
    try:
        token = request.data.get('credential')
        
        if not token:
            return Response(
                {'error': 'No credential provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the Google token
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            # Get user info from Google
            email = idinfo.get('email')
            given_name = idinfo.get('given_name', '')
            family_name = idinfo.get('family_name', '')
            picture = idinfo.get('picture', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Google'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
                created = False
            except User.DoesNotExist:
                # Create new user
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                
                # Ensure username is unique
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=given_name,
                    last_name=family_name
                )
                created = True
            
            # Update user profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.is_email_verified = True  # Google emails are verified
            profile.save()
            
            # Generate or get auth token
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'is_new_user': created
            })
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid token: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Send OTP to email for registration
    Expects: { "email": "user@example.com" }
    """
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP in session or cache (for now, we'll use session)
        request.session[f'otp_{email}'] = {
            'code': otp,
            'expires_at': (timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).isoformat()
        }
        
        # Send email
        if send_otp_email(email, otp):
            return Response({
                'message': 'OTP sent successfully',
                'email': email
            })
        else:
            return Response(
                {'error': 'Failed to send OTP email'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP and create user
    Expects: { "email": "user@example.com", "otp": "123456", "username": "user", "password": "pass" }
    """
    try:
        email = request.data.get('email')
        otp = request.data.get('otp')
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not all([email, otp, username, password]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get stored OTP
        otp_data = request.session.get(f'otp_{email}')
        
        if not otp_data:
            return Response(
                {'error': 'No OTP found for this email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OTP expired
        expires_at = timezone.datetime.fromisoformat(otp_data['expires_at'])
        if timezone.now() > expires_at:
            del request.session[f'otp_{email}']
            return Response(
                {'error': 'OTP has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        if otp_data['code'] != otp:
            return Response(
                {'error': 'Invalid OTP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Update profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_email_verified = True
        profile.save()
        
        # Clear OTP from session
        del request.session[f'otp_{email}']
        
        # Generate auth token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_exam_share_notification(request):
    """
    Send notification when user shares an exam
    Expects: { "recipient_email": "friend@example.com", "exam_title": "German A1 Exam", "share_link": "http://..." }
    """
    try:
        recipient_email = request.data.get('recipient_email')
        exam_title = request.data.get('exam_title')
        share_link = request.data.get('share_link')
        
        if not all([recipient_email, exam_title, share_link]):
            return Response(
                {'error': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sender_name = request.user.get_full_name() or request.user.username
        
        subject = f'{sender_name} shared an exam with you!'
        message = f"""
        Hello!
        
        {sender_name} has shared an exam with you on Vocab Learning App:
        
        Exam: {exam_title}
        
        Click here to try it: {share_link}
        
        Good luck with your practice!
        
        Best regards,
        Vocab Learning Team
        """
        
        if send_notification_email(recipient_email, subject, message):
            return Response({'message': 'Notification sent successfully'})
        else:
            return Response(
                {'error': 'Failed to send notification'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
