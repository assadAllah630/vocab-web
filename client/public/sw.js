const CACHE_NAME = 'vocab-master-v2';
const IMAGE_CACHE = 'vocabmaster-images';
const API_CACHE = 'vocabmaster-api';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/vocabmaster-icon.png'
];

// Install SW
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate SW - Clean old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME, IMAGE_CACHE, API_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch handler with strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // API requests: Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(event.request, API_CACHE));
        return;
    }

    // Images: Cache first, network fallback
    if (isImageRequest(event.request)) {
        event.respondWith(cacheFirstWithNetwork(event.request, IMAGE_CACHE));
        return;
    }

    // Static assets: Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

// Check if request is for an image
function isImageRequest(request) {
    const url = new URL(request.url);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => url.pathname.endsWith(ext)) ||
        request.destination === 'image' ||
        url.pathname.includes('/media/');
}

// Network first with cache fallback (for API)
async function networkFirstWithCache(request, cacheName) {
    try {
        const networkResponse = await fetch(request);

        // Only cache successful GET requests
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline JSON for API requests
        return new Response(
            JSON.stringify({ error: 'Offline', offline: true }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Cache first with network fallback (for images)
async function cacheFirstWithNetwork(request, cacheName) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Return cached and update in background
        fetchAndCache(request, cacheName);
        return cachedResponse;
    }

    try {
        return await fetchAndCache(request, cacheName);
    } catch (error) {
        console.log('[SW] Failed to fetch image:', request.url);
        // Return a placeholder or null
        return new Response(null, { status: 404 });
    }
}

// Stale-while-revalidate (for static assets)
async function staleWhileRevalidate(request, cacheName) {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => null);

    return cachedResponse || await fetchPromise || new Response('Offline', { status: 503 });
}

// Helper: Fetch and cache
async function fetchAndCache(request, cacheName) {
    const response = await fetch(request);

    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
    }

    return response;
}

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CACHE_IMAGES') {
        const urls = event.data.urls;
        cacheImages(urls);
    }
});

// Cache multiple images
async function cacheImages(urls) {
    const cache = await caches.open(IMAGE_CACHE);

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log('[SW] Cached image:', url);
            }
        } catch (error) {
            console.log('[SW] Failed to cache image:', url);
        }
    }
}

// ==========================================
// BACKGROUND SYNC
// ==========================================

const DB_NAME = 'VocabMasterDB';
const DB_VERSION = 2;

// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// Get all pending items from a store
async function getPendingItems(storeName) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.log('[SW] Error getting pending items:', error);
        return [];
    }
}

// Delete item from store
async function deleteItem(storeName, id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.log('[SW] Error deleting item:', error);
    }
}

// Sync pending vocabulary words
async function syncPendingWords() {
    const pendingWords = await getPendingItems('pendingWords');
    console.log(`[SW] Syncing ${pendingWords.length} pending words`);

    for (const item of pendingWords) {
        try {
            const response = await fetch('/api/vocab/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(item.data),
                credentials: 'include'
            });

            if (response.ok) {
                await deleteItem('pendingWords', item.id);
                console.log('[SW] Synced word:', item.data.word);
            }
        } catch (error) {
            console.log('[SW] Failed to sync word:', error);
        }
    }
}

// Sync pending practice results
async function syncPendingPractice() {
    const pendingPractice = await getPendingItems('pendingPractice');
    console.log(`[SW] Syncing ${pendingPractice.length} pending practice results`);

    for (const item of pendingPractice) {
        try {
            const endpoint = item.data.useHLR ? '/api/practice/result/' : '/api/progress/update/';
            const payload = item.data.useHLR
                ? { word_id: item.data.word_id, difficulty: item.data.difficulty }
                : { vocab_id: item.data.word_id, correct: item.data.correct };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {
                await deleteItem('pendingPractice', item.id);
                console.log('[SW] Synced practice result for word:', item.data.word_id);
            }
        } catch (error) {
            console.log('[SW] Failed to sync practice result:', error);
        }
    }
}

// Background sync event handler
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event received:', event.tag);

    if (event.tag === 'sync-vocab') {
        event.waitUntil(syncPendingWords());
    }

    if (event.tag === 'sync-practice') {
        event.waitUntil(syncPendingPractice());
    }

    if (event.tag === 'sync-all') {
        event.waitUntil(
            Promise.all([
                syncPendingWords(),
                syncPendingPractice()
            ])
        );
    }
});

// Periodic sync (for browsers that support it)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'vocab-sync') {
        event.waitUntil(
            Promise.all([
                syncPendingWords(),
                syncPendingPractice()
            ])
        );
    }
});

// Notify clients about sync status
async function notifyClients(message) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage(message);
    });
}
