"""
Password Management Views for Google OAuth Users
Allows users who signed up with Google to set a password for traditional login
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_password(request):
    """
    Allow users (especially Google OAuth users) to set a password
    This enables them to login with username/password in the future
    """
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not new_password or not confirm_password:
        return Response({
            'error': 'Both new_password and confirm_password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'error': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    try:
        validate_password(new_password, request.user)
    except ValidationError as e:
        return Response({
            'error': 'Password validation failed',
            'details': list(e.messages)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set the password
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({
        'message': 'Password set successfully! You can now login with your username and password.'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change password for users who already have a password
    Requires current password for security
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'error': 'current_password, new_password, and confirm_password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user has a usable password
    if not request.user.has_usable_password():
        return Response({
            'error': 'You signed up with Google. Please use "Set Password" instead.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify current password
    if not request.user.check_password(current_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'error': 'New passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    try:
        validate_password(new_password, request.user)
    except ValidationError as e:
        return Response({
            'error': 'Password validation failed',
            'details': list(e.messages)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Change the password
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({
        'message': 'Password changed successfully!'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_password_status(request):
    """
    Check if user has a password set (useful for Google OAuth users)
    """
    has_password = request.user.has_usable_password()
    
    return Response({
        'has_password': has_password,
        'message': 'User can login with password' if has_password else 'User needs to set a password'
    })
