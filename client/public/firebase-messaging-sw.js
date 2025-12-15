/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    // We need to hardcode keys here or use a specific build process because 
    // service workers don't have access to import.meta.env by default in Vite development
    // unless configured specially. For now, we'll place placeholders and ask user to replace
    // OR we can try to inject them.
    // Given the constraints, I will put the keys here directly since the user provided them in the prompt 
    // and they are public config anyway.
    apiKey: "AIzaSyC6eSASHaOjdpktqpMls0DpURnLj120cQg",
    authDomain: "vocabmaster-6a729.firebaseapp.com",
    projectId: "vocabmaster-6a729",
    storageBucket: "vocabmaster-6a729.firebasestorage.app",
    messagingSenderId: "53918063752",
    appId: "1:53918063752:web:2b63579091f450af15d33d",
    measurementId: "G-J1MHS6BN31"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png',
        data: payload.data // Pass the data (url) to the notification
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);
    event.notification.close();

    // Get URL from data
    const urlToOpen = event.notification.data?.url || '/';

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (clientList) {
            // Check if tab is already open
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open new window
            if (clients.openWindow) {
                // Determine full URL (if relative path provided)
                const fullUrl = urlToOpen.startsWith('http') ? urlToOpen : self.location.origin + urlToOpen;
                return clients.openWindow(fullUrl);
            }
        })
    );
});
