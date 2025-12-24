import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api';
import { motion } from 'framer-motion';
import AuthService from '../services/AuthService';

function GoogleAuthButton({ onSuccess, onError, className, children }) {
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const response = await api.post('auth/google/', {
                    access_token: tokenResponse.access_token
                });

                // Use AuthService for proper session management
                AuthService.setSession({
                    ...response.data.user,
                    token: response.data.token
                });

                if (onSuccess) onSuccess(response.data);
            } catch (error) {
                console.error('Google login failed:', error);
                if (onError) onError(error);
            }
        },
        onError: () => {
            console.error('Google login error');
            if (onError) onError(new Error('Google login failed'));
        }
    });

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => login()}
            className={className}
        >
            <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
                <path
                    d="M12.0003 20.45c4.65 0 8.35-3.12 9.77-7.5h-9.77v-3.75h13.6c.15.68.22 1.35.22 2.03 0 6.68-4.5 11.47-11.07 11.47-6.38 0-11.55-5.17-11.55-11.55s5.17-11.55 11.55-11.55c3.1 0 5.92 1.14 8.1 3.18l-2.65 2.65c-1.35-1.3-3.35-2.08-5.45-2.08-4.48 0-8.12 3.62-8.12 8.12s3.65 8.12 8.12 8.12z"
                    fill="currentColor"
                />
            </svg>
            {children || "Sign in with Google"}
        </motion.button>
    );
}

export default GoogleAuthButton;
