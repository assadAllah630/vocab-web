import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '../api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleAuthButton({ onSuccess, onError }) {
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await api.post('auth/google/', {
                credential: credentialResponse.credential
            });

            // Store user data and token
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (error) {
            console.error('Google login failed:', error);
            if (onError) {
                onError(error);
            }
        }
    };

    const handleGoogleError = () => {
        console.error('Google login error');
        if (onError) {
            onError(new Error('Google login failed'));
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
            />
        </GoogleOAuthProvider>
    );
}

export default GoogleAuthButton;
