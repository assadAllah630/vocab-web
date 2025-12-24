
import { openDB } from 'idb';

const DB_NAME = 'vocab-podcast-offline';
const STORE_NAME = 'episodes';
const DB_VERSION = 1;

/**
 * Initialize the DB
 */
const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

const OfflineStorage = {
    /**
     * Download and save an episode
     * @param {Object} episode - The episode object
     * @param {string} url - Audio URL
     * @returns {Promise<boolean>} Success status
     */
    saveEpisode: async (episode, url) => {
        try {
            console.log(`Downloading episode ${episode.id}...`);
            const response = await fetch(url);
            const blob = await response.blob();

            const record = {
                id: episode.id,
                title: episode.title,
                audioBlob: blob,
                mimeType: blob.type,
                downloadedAt: Date.now(),
                size: blob.size,
                // Store minimal metadata needed for display without network
                description: episode.description,
                duration: episode.duration,
                published_at: episode.published_at,
                artwork_url: episode.image_url // Store URL, not image blob (cache handles images usually)
            };

            const db = await initDB();
            await db.put(STORE_NAME, record);
            console.log(`Episode ${episode.id} saved offline.`);
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    },

    /**
     * Get a playable URL for an episode
     * @param {string|number} id 
     * @returns {Promise<string|null>} Blob URL or null
     */
    getEpisodeUrl: async (id) => {
        try {
            const db = await initDB();
            const record = await db.get(STORE_NAME, id);
            if (record && record.audioBlob) {
                return URL.createObjectURL(record.audioBlob);
            }
            return null;
        } catch (error) {
            console.error('Failed to get offline URL:', error);
            return null;
        }
    },

    /**
     * Check if an episode is downloaded
     * @param {string|number} id
     * @returns {Promise<boolean>}
     */
    isDownloaded: async (id) => {
        const db = await initDB();
        const record = await db.get(STORE_NAME, id);
        return !!record;
    },

    /**
     * Remove an episode
     * @param {string|number} id
     */
    deleteEpisode: async (id) => {
        const db = await initDB();
        await db.delete(STORE_NAME, id);
    },

    /**
     * Get all downloaded episodes
     */
    getAllDownloaded: async () => {
        const db = await initDB();
        return await db.getAll(STORE_NAME);
    }
};

export default OfflineStorage;
