from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from ..models import UserProfile
from ..serializers import UserSerializer
from ..rate_limiting import rate_limit_signup, rate_limit_auth, rate_limit_otp
from django.utils import timezone
import random

@api_view(['POST'])
# FIXME: Rate limit decorator interferes with request.data in tests. Re-enable after fixing rate_limiting.py
# @rate_limit_signup
@authentication_classes([])  # Disable authentication for signup
@permission_classes([permissions.AllowAny])
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    native_language = request.data.get('native_language', 'en')
    target_language = request.data.get('target_language', 'de')
    
    print(f"[SIGNUP] Received signup request for email: {email}, username: {username}")

    # Check if email already exists
    existing_user = User.objects.filter(email=email).first()
    if existing_user:
        # If user exists but email is NOT verified, allow re-signup (resend OTP)
        if not existing_user.profile.is_email_verified:
            print(f"[SIGNUP] Email {email} exists but not verified. Resending OTP...")
            try:
                # Update password in case user wants to change it
                existing_user.set_password(password)
                existing_user.username = username  # Allow username update for unverified users
                existing_user.save()
                
                # Update profile languages
                existing_user.profile.native_language = native_language
                existing_user.profile.target_language = target_language
                
                # Generate new OTP
                otp = f"{random.randint(100000, 999999)}"
                existing_user.profile.otp_code = otp
                existing_user.profile.otp_created_at = timezone.now()
                existing_user.profile.save()
                print(f"[SIGNUP] New OTP generated: {otp}")
                
                # Resend email
                from ..email_utils import send_otp_email
                try:
                    email_sent = send_otp_email(email, otp)
                    if email_sent:
                        print(f"[SIGNUP] ✅ OTP resent to {email}")
                    else:
                        print(f"[SIGNUP] ⚠️ Failed to send email, OTP: {otp}")
                        return Response(
                            {'error': 'Failed to send verification email. Please try again or contact support.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                except Exception as e:
                    print(f"[SIGNUP] ❌ Error sending email: {e}, OTP: {otp}")
                    return Response(
                        {'error': f'Error sending email: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                return Response({
                    'message': 'A new verification code has been sent to your email.',
                    'email': email
                }, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"[SIGNUP] ❌ Error resending OTP: {e}")
                return Response({'error': f'Failed to resend verification: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # User exists and IS verified
            print(f"[SIGNUP] Email {email} already exists and is verified")
            return Response({'error': 'This email is already registered. Please sign in instead.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username already exists (but only for NEW users, not re-signup)
    if User.objects.filter(username=username).exclude(email=email).exists():
        print(f"[SIGNUP] Username {username} already exists")
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)


    try:
        print(f"[SIGNUP] Starting user creation for {email}")
        from django.db import transaction
        with transaction.atomic():
            # Create user but keep inactive until verified (optional, or just use is_email_verified)
            user = User.objects.create_user(username=username, password=password, email=email)
            user.is_active = True # We'll use is_email_verified flag instead of deactivating
            user.save()
            print(f"[SIGNUP] User {username} created successfully")

            # Profile setup
            if hasattr(user, 'profile'):
                print(f"[SIGNUP] User already has profile, updating it")
                profile = user.profile
                profile.native_language = native_language
                profile.target_language = target_language
                profile.is_email_verified = False
                profile.save()
            else:
                print(f"[SIGNUP] Creating new profile for user")
                UserProfile.objects.create(
                    user=user, 
                    native_language=native_language, 
                    target_language=target_language,
                    is_email_verified=False
                )
            
            # Generate OTP
            otp = f"{random.randint(100000, 999999)}"
            user.profile.otp_code = otp
            user.profile.otp_created_at = timezone.now()
            user.profile.save()
            print(f"[SIGNUP] OTP generated and saved: {otp}")
            
            # Send Email via SendGrid
            from ..email_utils import send_otp_email
            try:
                print(f"[SIGNUP] Attempting to send OTP email to {email}")
                email_sent = send_otp_email(email, otp)
                if not email_sent:
                    print(f"[SIGNUP] ⚠️ Failed to send email to {email}")
                    print(f"[SIGNUP] DEBUG OTP: {otp}")
                    return Response(
                        {'error': 'Failed to send verification email. Please try again or contact support.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                else:
                    print(f"[SIGNUP] ✅ Email sent successfully to {email}")
            except Exception as e:
                print(f"[SIGNUP] ❌ Error sending email: {e}")
                print(f"[SIGNUP] DEBUG OTP: {otp}")
                return Response(
                    {'error': f'Error sending email: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            print(f"[SIGNUP] Signup completed successfully for {email}")
            return Response({
                'message': 'Account created. Please verify your email.',
                'email': email
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        print(f"[SIGNUP] ❌ CRITICAL ERROR during signup: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[SIGNUP] Traceback: {traceback.format_exc()}")
        return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

# @rate_limit_otp
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    profile = user.profile
    
    # Check if already verified
    if profile.is_email_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
        
    # Check OTP
    if profile.otp_code != otp:
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check Expiration (e.g., 10 mins)
    time_diff = timezone.now() - profile.otp_created_at
    if time_diff.total_seconds() > 600: # 10 minutes
        return Response({'error': 'OTP expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Verify
    profile.is_email_verified = True
    profile.otp_code = None # Clear OTP
    profile.save()
    
    # Auto Login
    login(request, user)
    return Response(UserSerializer(user).data)

# @rate_limit_otp
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_otp(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if user.profile.is_email_verified:
        return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
        
    # Generate New OTP
    otp = f"{random.randint(100000, 999999)}"
    user.profile.otp_code = otp
    user.profile.otp_created_at = timezone.now()
    user.profile.save()
    
    
    # Send Email via SendGrid/Gmail
    from ..email_utils import send_otp_email
    try:
        email_sent = send_otp_email(email, otp)
        if not email_sent:
            print(f"Failed to send email to {email}")
            print(f"DEBUG OTP: {otp}")
            return Response(
                {'error': 'Failed to send verification email. Please try again or contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        print(f"Error sending email: {e}")
        print(f"DEBUG OTP: {otp}")
        return Response(
            {'error': f'Error sending email: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    return Response({'message': 'OTP resent successfully'})

# @rate_limit_auth
@api_view(['POST'])
@authentication_classes([])  # Disable authentication/CSRF for this endpoint
@permission_classes([permissions.AllowAny])
def signin(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Debug logging
        print(f"Signin attempt for username: {username}")
        
        user = authenticate(username=username, password=password)
        
        if user:
            if not hasattr(user, 'profile'):
                UserProfile.objects.create(user=user)
                
            if not user.profile.is_email_verified:
                # Trigger OTP flow if not verified
                # For now, we'll just block login and ask to verify
                # Ideally, we should trigger resend_otp here if needed
                return Response({
                    'error': 'Email not verified', 
                    'email': user.email,
                    'requires_verification': True
                }, status=status.HTTP_403_FORBIDDEN)
                
            login(request, user)
            return Response(UserSerializer(user).data)
            
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in signin: {error_details}")
        return Response({
            'error': 'Internal Server Error',
            'details': str(e),
            'traceback': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_username(request):
    username = request.query_params.get('username')
    if not username:
        return Response({'error': 'Username required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Case insensitive check
    exists = User.objects.filter(username__iexact=username).exists()
    return Response({'exists': exists, 'available': not exists})
