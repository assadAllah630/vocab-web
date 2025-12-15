import { useState, useEffect } from 'react';
import { requestForToken, onMessageListener } from '../firebase';
import api from '../api';
import toast from 'react-hot-toast';

const usePushNotifications = () => {
    const [token, setToken] = useState(null);
    const [notification, setNotification] = useState({ title: '', body: '' });

    // Register token with backend
    const registerToken = async (token) => {
        try {
            await api.post('/notifications/register-fcm/', { token });
            console.log('FCM Token registered with backend');
        } catch (error) {
            console.error('Error registering FCM token:', error);
        }
    };

    const requestPermission = async (silent = false) => {
        try {
            const token = await requestForToken();
            if (token) {
                setToken(token);
                // We typically register on every load to ensure backend is up to date, 
                // but we could skip if it's the same. 
                // For now, simple is better.
                await registerToken(token);
                if (!silent) toast.success('Notifications enabled!');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            if (!silent) toast.error('Failed to enable notifications.');
        }
    };

    // Check on mount if already granted
    useEffect(() => {
        if (Notification.permission === 'granted') {
            requestPermission(true); // silent check
        }
    }, []);

    useEffect(() => {
        onMessageListener()
            .then((payload) => {
                setNotification({
                    title: payload.notification.title,
                    body: payload.notification.body
                });
                toast((t) => (
                    <div onClick={() => {
                        toast.dismiss(t.id);
                        if (payload.data?.url) window.location.href = payload.data.url;
                    }}>
                        <b>{payload.notification.title}</b>
                        <p>{payload.notification.body}</p>
                    </div>
                ), { duration: 5000 });
            })
            .catch((err) => console.log('failed: ', err));
    }, []);

    return { token, notification, requestPermission };
};

export default usePushNotifications;
