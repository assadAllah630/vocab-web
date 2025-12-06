import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * IndexedDB wrapper for offline storage
 */
const DB_NAME = 'VocabMasterDB';
const DB_VERSION = 2;

const STORES = {
    VOCABULARY: 'vocabulary',
    STATS: 'stats',
    PENDING_WORDS: 'pendingWords',
    PENDING_PRACTICE: 'pendingPractice',
    SETTINGS: 'settings',
    // Library content
    EXAMS: 'exams',
    EXAM_ATTEMPTS: 'examAttempts',
    STORIES: 'stories',
    ARTICLES: 'articles',
    GRAMMAR: 'grammar',
    DIALOGUES: 'dialogues',
    GENERATED_CONTENT: 'generatedContent'
};

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Vocabulary store
            if (!db.objectStoreNames.contains(STORES.VOCABULARY)) {
                const vocabStore = db.createObjectStore(STORES.VOCABULARY, { keyPath: 'id' });
                vocabStore.createIndex('word', 'word', { unique: false });
                vocabStore.createIndex('language', 'language', { unique: false });
            }

            // Stats store
            if (!db.objectStoreNames.contains(STORES.STATS)) {
                db.createObjectStore(STORES.STATS, { keyPath: 'id' });
            }

            // Pending words (to sync when online)
            if (!db.objectStoreNames.contains(STORES.PENDING_WORDS)) {
                db.createObjectStore(STORES.PENDING_WORDS, { keyPath: 'tempId', autoIncrement: true });
            }

            // Pending practice results
            if (!db.objectStoreNames.contains(STORES.PENDING_PRACTICE)) {
                db.createObjectStore(STORES.PENDING_PRACTICE, { keyPath: 'tempId', autoIncrement: true });
            }

            // User settings
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }

            // Library content stores
            if (!db.objectStoreNames.contains(STORES.EXAMS)) {
                const examStore = db.createObjectStore(STORES.EXAMS, { keyPath: 'id' });
                examStore.createIndex('language', 'language', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.EXAM_ATTEMPTS)) {
                const attemptStore = db.createObjectStore(STORES.EXAM_ATTEMPTS, { keyPath: 'id' });
                attemptStore.createIndex('examId', 'exam', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.STORIES)) {
                db.createObjectStore(STORES.STORIES, { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
                db.createObjectStore(STORES.ARTICLES, { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains(STORES.GRAMMAR)) {
                const grammarStore = db.createObjectStore(STORES.GRAMMAR, { keyPath: 'id' });
                grammarStore.createIndex('level', 'level', { unique: false });
                grammarStore.createIndex('category', 'category', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORES.DIALOGUES)) {
                db.createObjectStore(STORES.DIALOGUES, { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains(STORES.GENERATED_CONTENT)) {
                const genStore = db.createObjectStore(STORES.GENERATED_CONTENT, { keyPath: 'id' });
                genStore.createIndex('content_type', 'content_type', { unique: false });
            }
        };
    });

    return dbPromise;
}

// Vocabulary Storage
export const vocabStorage = {
    async saveAll(words) {
        const db = await openDB();
        const tx = db.transaction(STORES.VOCABULARY, 'readwrite');
        const store = tx.objectStore(STORES.VOCABULARY);

        // Clear and replace
        store.clear();
        words.forEach(word => store.put(word));

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getAll() {
        const db = await openDB();
        const tx = db.transaction(STORES.VOCABULARY, 'readonly');
        const store = tx.objectStore(STORES.VOCABULARY);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getByLanguage(language) {
        const all = await this.getAll();
        return all.filter(w => w.language === language);
    },

    async save(word) {
        const db = await openDB();
        const tx = db.transaction(STORES.VOCABULARY, 'readwrite');
        const store = tx.objectStore(STORES.VOCABULARY);
        store.put(word);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async delete(id) {
        const db = await openDB();
        const tx = db.transaction(STORES.VOCABULARY, 'readwrite');
        const store = tx.objectStore(STORES.VOCABULARY);
        store.delete(id);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};

// Stats Storage
export const statsStorage = {
    async save(stats) {
        const db = await openDB();
        const tx = db.transaction(STORES.STATS, 'readwrite');
        const store = tx.objectStore(STORES.STATS);
        store.put({ id: 'userStats', ...stats, cachedAt: Date.now() });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async get() {
        const db = await openDB();
        const tx = db.transaction(STORES.STATS, 'readonly');
        const store = tx.objectStore(STORES.STATS);

        return new Promise((resolve, reject) => {
            const request = store.get('userStats');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// Pending Sync Queue
export const syncQueue = {
    async addWord(word) {
        const db = await openDB();
        const tx = db.transaction(STORES.PENDING_WORDS, 'readwrite');
        const store = tx.objectStore(STORES.PENDING_WORDS);
        store.add({ ...word, queuedAt: Date.now() });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async addPracticeResult(result) {
        const db = await openDB();
        const tx = db.transaction(STORES.PENDING_PRACTICE, 'readwrite');
        const store = tx.objectStore(STORES.PENDING_PRACTICE);
        store.add({ ...result, queuedAt: Date.now() });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getPendingWords() {
        const db = await openDB();
        const tx = db.transaction(STORES.PENDING_WORDS, 'readonly');
        const store = tx.objectStore(STORES.PENDING_WORDS);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getPendingPractice() {
        const db = await openDB();
        const tx = db.transaction(STORES.PENDING_PRACTICE, 'readonly');
        const store = tx.objectStore(STORES.PENDING_PRACTICE);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async clearSyncedWords(ids) {
        const db = await openDB();
        const tx = db.transaction(STORES.PENDING_WORDS, 'readwrite');
        const store = tx.objectStore(STORES.PENDING_WORDS);
        ids.forEach(id => store.delete(id));

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async clearSyncedPractice(ids) {
        const db = await openDB();
        const tx = db.transaction(STORES.PENDING_PRACTICE, 'readwrite');
        const store = tx.objectStore(STORES.PENDING_PRACTICE);
        ids.forEach(id => store.delete(id));

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getPendingCount() {
        const words = await this.getPendingWords();
        const practice = await this.getPendingPractice();
        return words.length + practice.length;
    },

    /**
     * Register background sync with the service worker
     * @param {string} tag - Sync tag ('sync-vocab', 'sync-practice', 'sync-all')
     */
    async registerSync(tag = 'sync-all') {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register(tag);
                console.log('[SyncQueue] Registered sync:', tag);
                return true;
            } catch (error) {
                console.log('[SyncQueue] Sync registration failed:', error);
                return false;
            }
        }
        return false;
    },

    /**
     * Trigger sync when coming back online
     */
    async triggerSync() {
        const pendingCount = await this.getPendingCount();
        if (pendingCount > 0) {
            const registered = await this.registerSync('sync-all');
            if (!registered) {
                // If Background Sync not supported, sync manually
                await this.manualSync();
            }
        }
    },

    /**
     * Manual sync fallback for browsers without Background Sync support
     */
    async manualSync() {
        console.log('[SyncQueue] Manual sync started');
        const pendingWords = await this.getPendingWords();
        const pendingPractice = await this.getPendingPractice();

        // Sync words
        for (const item of pendingWords) {
            try {
                const response = await fetch('/api/vocab/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.data),
                    credentials: 'include'
                });
                if (response.ok) {
                    await this.clearSyncedWords([item.id]);
                }
            } catch (error) {
                console.log('[SyncQueue] Manual word sync failed:', error);
            }
        }

        // Sync practice results
        for (const item of pendingPractice) {
            try {
                const endpoint = item.useHLR ? '/api/practice/result/' : '/api/progress/update/';
                const payload = item.useHLR
                    ? { word_id: item.word_id, difficulty: item.difficulty }
                    : { vocab_id: item.word_id, correct: item.correct };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                if (response.ok) {
                    await this.clearSyncedPractice([item.id]);
                }
            } catch (error) {
                console.log('[SyncQueue] Manual practice sync failed:', error);
            }
        }

        console.log('[SyncQueue] Manual sync completed');
    }
};

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[OfflineStorage] Back online, triggering sync');
        syncQueue.triggerSync();
    });
}

// Settings Storage
export const settingsStorage = {
    async set(key, value) {
        const db = await openDB();
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        store.put({ key, value });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async get(key) {
        const db = await openDB();
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }
};

/**
 * Hook for using offline storage with auto-sync
 */
export function useOfflineVocab(targetLanguage) {
    const [vocabulary, setVocabulary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const isOnline = useOnlineStatus();

    // Load vocabulary (from cache first, then API)
    const loadVocabulary = useCallback(async (api) => {
        setLoading(true);
        try {
            // Try cache first
            const cached = await vocabStorage.getAll();
            if (cached.length > 0) {
                setVocabulary(cached);
                setLoading(false);
            }

            // If online, fetch fresh data
            if (isOnline && api) {
                const res = await api.get('vocab/');
                const words = res.data;
                setVocabulary(words);
                await vocabStorage.saveAll(words);
            }
        } catch (err) {
            console.error('Failed to load vocabulary:', err);
            // Fall back to cache on error
            const cached = await vocabStorage.getAll();
            setVocabulary(cached);
        } finally {
            setLoading(false);
        }
    }, [isOnline]);

    // Update pending count
    useEffect(() => {
        syncQueue.getPendingCount().then(setPendingCount);
    }, [vocabulary]);

    return {
        vocabulary,
        loading,
        pendingCount,
        loadVocabulary,
        isOnline
    };
}

// ============================================
// Library Content Storage (Exams, Stories, etc.)
// ============================================

// Generic content storage factory
function createContentStorage(storeName) {
    return {
        async saveAll(items) {
            const db = await openDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.clear();
            items.forEach(item => store.put(item));
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        },

        async getAll() {
            const db = await openDB();
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        },

        async getById(id) {
            const db = await openDB();
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        async save(item) {
            const db = await openDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.put({ ...item, cachedAt: Date.now() });
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        },

        async delete(id) {
            const db = await openDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(id);
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }
    };
}

// Library content storages
export const examsStorage = createContentStorage(STORES.EXAMS);
export const examAttemptsStorage = createContentStorage(STORES.EXAM_ATTEMPTS);
export const storiesStorage = createContentStorage(STORES.STORIES);
export const articlesStorage = createContentStorage(STORES.ARTICLES);
export const grammarStorage = createContentStorage(STORES.GRAMMAR);
export const dialoguesStorage = createContentStorage(STORES.DIALOGUES);
export const generatedContentStorage = createContentStorage(STORES.GENERATED_CONTENT);

/**
 * Hook for offline library content with cache-first strategy
 */
export function useOfflineContent(contentType, apiEndpoint) {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const isOnline = useOnlineStatus();

    const storageMap = {
        exams: examsStorage,
        stories: storiesStorage,
        articles: articlesStorage,
        grammar: grammarStorage,
        dialogues: dialoguesStorage,
        generated: generatedContentStorage
    };

    const storage = storageMap[contentType];

    const loadContent = useCallback(async (api) => {
        setLoading(true);
        try {
            // Try cache first
            const cached = await storage.getAll();
            if (cached.length > 0) {
                setContent(cached);
                setLoading(false);
            }

            // If online, fetch fresh data
            if (isOnline && api && apiEndpoint) {
                const res = await api.get(apiEndpoint);
                const data = res.data.results || res.data;
                setContent(data);
                await storage.saveAll(data);
            }
        } catch (err) {
            console.error(`Failed to load ${contentType}:`, err);
            const cached = await storage.getAll();
            setContent(cached);
        } finally {
            setLoading(false);
        }
    }, [isOnline, storage, apiEndpoint, contentType]);

    return { content, loading, loadContent, isOnline };
}

/**
 * Cache images for offline use
 */
export async function cacheImage(url) {
    if (!url) return;
    try {
        const cache = await caches.open('vocabmaster-images');
        const response = await fetch(url);
        if (response.ok) {
            await cache.put(url, response);
        }
    } catch (err) {
        console.error('Failed to cache image:', err);
    }
}

/**
 * Cache multiple images
 */
export async function cacheImages(urls) {
    const validUrls = urls.filter(url => url && typeof url === 'string');
    await Promise.all(validUrls.map(cacheImage));
}

