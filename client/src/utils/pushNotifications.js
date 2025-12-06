/**
 * Push Notification Utilities
 * 
 * Handles Web Push API for browser notifications:
 * - Permission requests
 * - VAPID key support
 * - Service worker integration
 * - Subscription management
 */

// VAPID public key - must match server's private key
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert URL-safe base64 to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
    return 'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', or 'default'
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return { success: false, error: 'Notifications not supported' };
    }

    try {
        const permission = await Notification.requestPermission();
        return {
            success: permission === 'granted',
            permission
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(api) {
    if (!isPushSupported()) {
        return { success: false, error: 'Push notifications not supported' };
    }

    if (!VAPID_PUBLIC_KEY) {
        console.warn('VAPID public key not configured');
        return { success: false, error: 'VAPID key not configured' };
    }

    try {
        // Request permission
        const { success: permissionGranted } = await requestNotificationPermission();
        if (!permissionGranted) {
            return { success: false, error: 'Permission denied' };
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Send subscription to backend
        const response = await api.post('notifications/subscribe/', {
            subscription: subscription.toJSON()
        });

        console.log('[Push] Subscribed successfully');
        return { success: true, subscription };

    } catch (error) {
        console.error('[Push] Subscription failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(api) {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Notify backend
            await api.post('notifications/unsubscribe/', {
                endpoint: subscription.endpoint
            });

            // Unsubscribe from browser
            await subscription.unsubscribe();
            console.log('[Push] Unsubscribed successfully');
        }

        return { success: true };
    } catch (error) {
        console.error('[Push] Unsubscribe failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if currently subscribed to push
 */
export async function isSubscribedToPush() {
    if (!isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
    } catch {
        return false;
    }
}

/**
 * Get notification preferences from server
 */
export async function getNotificationPreferences(api) {
    try {
        const response = await api.get('notifications/preferences/');
        return response.data;
    } catch (error) {
        console.error('[Push] Failed to get preferences:', error);
        return null;
    }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(api, preferences) {
    try {
        await api.put('notifications/preferences/', preferences);
        return { success: true };
    } catch (error) {
        console.error('[Push] Failed to update preferences:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(api) {
    try {
        const response = await api.post('notifications/test/');
        return { success: true, ...response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Show a local notification (for testing)
 */
export function showLocalNotification(title, options = {}) {
    if (Notification.permission !== 'granted') {
        console.warn('[Push] Notification permission not granted');
        return;
    }

    const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };

    return notification;
}
