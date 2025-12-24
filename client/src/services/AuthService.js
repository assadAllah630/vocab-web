// AuthService.js - Single source of truth for authentication
// Centralized auth operations with proper error handling

import api from '../api';
import TokenManager from './TokenManager';

class AuthService {
    static STORAGE_KEYS = {
        USER: 'user',
        TOKEN: 'token',
        REFRESH_TOKEN: 'refresh_token',
        SESSION_ID: 'session_id'
    };

    /**
     * Login with username/password
     */
    static async login(username, password) {
        const response = await api.post('auth/signin/', { username, password });
        const userData = response.data;
        this.setSession(userData);
        return userData;
    }

    /**
     * Signup with full registration data
     */
    static async signup(data) {
        const response = await api.post('auth/signup/', data);
        return response.data;
    }

    /**
     * Verify email with OTP
     */
    static async verifyEmail(email, otp) {
        const response = await api.post('auth/verify-email/', { email, otp });
        const userData = response.data;
        this.setSession(userData);
        return userData;
    }

    /**
     * Logout - complete cleanup with server and local
     */
    static async logout() {
        try {
            await api.post('logout/');
        } catch (err) {
            console.warn('Logout API failed (continuing with local cleanup):', err);
        } finally {
            this.clearSession();
        }
    }

    /**
     * Validate current session against server
     * Returns { valid: boolean, user: object|null, offline?: boolean }
     */
    static async validateSession() {
        const token = TokenManager.getToken();
        const storedUser = this.getStoredUser();

        // No credentials = not logged in
        if (!token || !storedUser) {
            this.clearSession();
            return { valid: false, user: null };
        }

        try {
            const { data: profile } = await api.get('profile/');

            // CRITICAL: User ID mismatch = different account logged in elsewhere
            // Convert to strings to avoid type mismatch (e.g. 5 vs "5")
            if (String(profile.id) !== String(storedUser.id)) {
                console.warn(`Session mismatch: stored user ID ${storedUser.id} differs from server ${profile.id}`);
                this.clearSession();
                return { valid: false, user: null };
            }

            // Merge fresh server data with local data
            const updatedUser = {
                ...storedUser,
                ...profile,
                // Explicitly update critical fields
                is_teacher: profile.is_teacher,
                is_staff: profile.is_staff,
                is_superuser: profile.is_superuser,
                native_language: profile.native_language,
                target_language: profile.target_language
            };

            this.updateStoredUser(updatedUser);
            return { valid: true, user: updatedUser };

        } catch (error) {
            // Auth errors = session invalid
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.warn('Session invalid (401/403), clearing auth');
                this.clearSession();
                return { valid: false, user: null };
            }

            // Network error - trust local session temporarily (offline mode)
            console.warn('Network error during validation, using cached session');
            return { valid: true, user: storedUser, offline: true };
        }
    }

    /**
     * Set session after successful login
     */
    static setSession(userData) {
        console.log('[AuthService] setSession called with:', userData);
        const { token, refresh_token, ...user } = userData;
        console.log('[AuthService] Token extracted:', token);

        // Store tokens
        TokenManager.setToken(token);
        console.log('[AuthService] Token stored, verifying:', localStorage.getItem('token'));

        if (refresh_token) {
            TokenManager.setRefreshToken(refresh_token);
        }

        // Store user data (without tokens)
        localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));

        // Generate unique session ID for this login
        const sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
    }

    /**
     * Clear all session data - complete logout
     */
    static clearSession() {
        // Clear all auth-related keys
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear any session storage as well
        sessionStorage.clear();

        // Clear tokens via TokenManager
        TokenManager.clearTokens();
    }

    /**
     * Get stored user from localStorage
     */
    static getStoredUser() {
        const stored = localStorage.getItem(this.STORAGE_KEYS.USER);
        if (!stored || stored === 'undefined' || stored === 'null') {
            return null;
        }
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }

    /**
     * Update stored user data
     */
    static updateStoredUser(user) {
        localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    }

    /**
     * Role check: Is user a teacher?
     */
    static isTeacher(user) {
        return user?.is_teacher || user?.is_staff || false;
    }

    /**
     * Role check: Is user an admin?
     */
    static isAdmin(user) {
        return user?.is_superuser || user?.is_staff || false;
    }

    /**
     * Get current session ID (for multi-tab detection)
     */
    static getSessionId() {
        return localStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
    }
}

export default AuthService;
