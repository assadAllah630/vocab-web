import axios from 'axios';


// Remove trailing /api if present to avoid double api/api prefix
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
if (API_URL.endsWith('/api')) {
    API_URL = API_URL.slice(0, -4);
}

const api = axios.create({
    baseURL: `${API_URL}/api/`,
    withCredentials: true,
});

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add a request interceptor to include the CSRF token and Auth token
api.interceptors.request.use((config) => {
    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
        const csrftoken = getCookie('csrftoken');
        if (csrftoken) {
            config.headers['X-CSRFToken'] = csrftoken;
        }

        // REMOVED: API keys should NEVER be sent from frontend
        // Backend will handle API keys from UserProfile
        // SECURITY FIX: Removed X-OpenRouter-Key header injection
    }

    // Add Authorization token if available (for Google OAuth users)
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Token ${token}`;
    }

    return config;
});

export default api;
