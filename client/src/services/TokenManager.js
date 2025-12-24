// TokenManager.js - Secure token handling
// Single source of truth for token storage operations

class TokenManager {
    static TOKEN_KEY = 'token';
    static REFRESH_KEY = 'refresh_token';

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    static getRefreshToken() {
        return localStorage.getItem(this.REFRESH_KEY);
    }

    static setRefreshToken(token) {
        if (token) {
            localStorage.setItem(this.REFRESH_KEY, token);
        }
    }

    static clearTokens() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_KEY);
    }

    static hasValidToken() {
        const token = this.getToken();
        return !!token && token !== 'undefined' && token !== 'null';
    }
}

export default TokenManager;
