// RouteGuards.jsx - Protected route components
// Provides authentication and role-based access control for routes

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen bg-[#18181B]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
);

/**
 * ProtectedRoute - Requires authentication
 * Redirects to login if not authenticated, preserving return URL
 */
export function ProtectedRoute({ children, redirectTo = '/login' }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;
}

/**
 * RoleGuard - Requires specific role
 * Use after ProtectedRoute to check roles
 */
export function RoleGuard({ children, requiredRole, fallback = '/m' }) {
    const { user, isTeacher, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />;
    }

    // Determine if user has required access
    let hasAccess = true;

    switch (requiredRole) {
        case 'teacher':
            hasAccess = isTeacher;
            break;
        case 'admin':
            hasAccess = isAdmin;
            break;
        case 'student':
            hasAccess = !!user && !isTeacher; // Student = logged in but not teacher
            break;
        default:
            hasAccess = true;
    }

    if (!hasAccess) {
        console.warn(`Access denied: required role "${requiredRole}", redirecting to ${fallback}`);
        return <Navigate to={fallback} state={{ from: location }} replace />;
    }

    return children;
}

/**
 * AuthRoleGuard - Combined auth + role check
 * Convenience wrapper for routes that need both
 */
export function AuthRoleGuard({ children, requiredRole, redirectTo = '/login', fallback = '/m' }) {
    return (
        <ProtectedRoute redirectTo={redirectTo}>
            <RoleGuard requiredRole={requiredRole} fallback={fallback}>
                {children}
            </RoleGuard>
        </ProtectedRoute>
    );
}

/**
 * TeacherRoute - Shortcut for teacher-only routes
 */
export function TeacherRoute({ children }) {
    return (
        <AuthRoleGuard requiredRole="teacher" fallback="/m">
            {children}
        </AuthRoleGuard>
    );
}

/**
 * AdminRoute - Shortcut for admin-only routes
 */
export function AdminRoute({ children }) {
    return (
        <AuthRoleGuard requiredRole="admin" fallback="/m/teacher/dashboard">
            {children}
        </AuthRoleGuard>
    );
}

/**
 * PublicOnlyRoute - For login/signup pages
 * Redirects to dashboard if already authenticated
 */
export function PublicOnlyRoute({ children, redirectTo = '/m' }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}

export default {
    ProtectedRoute,
    RoleGuard,
    AuthRoleGuard,
    TeacherRoute,
    AdminRoute,
    PublicOnlyRoute
};
