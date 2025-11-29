"""
Permission decorators and utilities for admin views
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .admin_models import AdminRole, AdminAuditLog


def require_permission(permission):
    """
    Decorator to check if admin user has required permission
    Usage: @require_permission('edit_users')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user has admin role
            try:
                admin_role = AdminRole.objects.get(user=request.user, is_active=True)
            except AdminRole.DoesNotExist:
                return Response(
                    {'error': 'Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check permission
            if not admin_role.has_permission(permission):
                # Log unauthorized access attempt
                AdminAuditLog.objects.create(
                    admin_user=request.user,
                    action='unauthorized_access_attempt',
                    resource_type='permission',
                    details={'required_permission': permission},
                    ip_address=get_client_ip(request),
                    success=False,
                    error_message=f'Missing permission: {permission}'
                )
                
                return Response(
                    {'error': f'Permission denied. Required: {permission}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*permissions):
    """
    Decorator to check if admin user has ANY of the required permissions
    Usage: @require_any_permission('edit_users', 'view_users')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                admin_role = AdminRole.objects.get(user=request.user, is_active=True)
            except AdminRole.DoesNotExist:
                return Response(
                    {'error': 'Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user has ANY of the permissions
            has_permission = any(admin_role.has_permission(perm) for perm in permissions)
            
            if not has_permission:
                return Response(
                    {'error': f'Permission denied. Required one of: {", ".join(permissions)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def log_admin_action(action, resource_type):
    """
    Decorator to automatically log admin actions
    Usage: @log_admin_action('user_suspended', 'user')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Execute the view
            response = view_func(self, request, *args, **kwargs)
            
            # Log the action if successful
            if response.status_code < 400:
                resource_id = kwargs.get('pk') or kwargs.get('id')
                AdminAuditLog.objects.create(
                    admin_user=request.user,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=request.data if hasattr(request, 'data') else {},
                    ip_address=get_client_ip(request),
                    success=True
                )
            
            return response
        return wrapper
    return decorator


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def check_permission(user, permission):
    """
    Helper function to check permission programmatically
    """
    try:
        admin_role = AdminRole.objects.get(user=user, is_active=True)
        return admin_role.has_permission(permission)
    except AdminRole.DoesNotExist:
        return False
