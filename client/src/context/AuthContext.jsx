// AuthContext.jsx - React Context for authentication state
// Provides useAuth() hook for components to access auth state

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOffline, setIsOffline] = useState(false);

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            const { valid, user: validatedUser, offline } = await AuthService.validateSession();
            if (valid) {
                setUser(validatedUser);
                setIsOffline(!!offline);
            }
            setLoading(false);
        };
        initAuth();

        // Listen for unauthorized events from API interceptor
        const handleUnauthorized = () => {
            console.warn('Received unauthorized event, clearing session');
            AuthService.clearSession();
            setUser(null);
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    // Login function
    const login = useCallback(async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const userData = await AuthService.login(username, password);
            setUser(userData);
            setIsOffline(false);
            return userData;
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Login failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await AuthService.logout();
        } finally {
            setUser(null);
            setLoading(false);
        }
    }, []);

    // Update user data (for profile updates)
    const updateUser = useCallback((updates) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            AuthService.updateStoredUser(updated);
            return updated;
        });
    }, []);

    // Refresh session from server
    const refreshSession = useCallback(async () => {
        const { valid, user: validatedUser, offline } = await AuthService.validateSession();
        if (valid) {
            setUser(validatedUser);
            setIsOffline(!!offline);
        } else {
            setUser(null);
        }
        return valid;
    }, []);

    const value = {
        // State
        user,
        loading,
        error,
        isOffline,

        // Computed
        isAuthenticated: !!user,
        isTeacher: AuthService.isTeacher(user),
        isAdmin: AuthService.isAdmin(user),

        // Actions
        login,
        logout,
        setUser,
        updateUser,
        refreshSession,
        setError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
