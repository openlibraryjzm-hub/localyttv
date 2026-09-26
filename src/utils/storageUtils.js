import { get, set, del } from 'idb-keyval';

// Zustand persistence storage using IndexedDB
export const idbStorage = {
    getItem: async (name) => {
        let value = await get(name);

        // Migration: If not in IndexedDB but present in localStorage, migrate it!
        if (value === undefined || value === null) {
            const legacyValue = localStorage.getItem(name);
            if (legacyValue !== null) {
                console.log(`[Storage Migration] Migrating ${name} to IndexedDB...`);
                await set(name, legacyValue);
                value = legacyValue;

                // Clear from localStorage once migrated to free up the 5MB quota
                localStorage.removeItem(name);
            }
        }

        return value || null;
    },
    setItem: async (name, value) => {
        await set(name, value);
    },
    removeItem: async (name) => {
        await del(name);
    }
};

// Playback Time LRU Cache for Watch History
const CACHE_KEY = "recent_playback_times";
const MAX_VIDEOS = 100;

function loadPlaybackCache() {
    try {
        const data = localStorage.getItem(CACHE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function savePlaybackCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error("Failed to save playback cache:", error);
    }
}

/**
 * Gets the stored playback time for a specific video ID
 * @param {string} videoId 
 * @returns {number} The playback time in seconds
 */
export const getStoredPlaybackTime = (videoId) => {
    const cache = loadPlaybackCache();
    return cache[videoId]?.time || 0;
};

/**
 * Saves the playback time for a video using an LRU cache in localStorage
 * Removes oldest entries if exceeding MAX_VIDEOS (100)
 * @param {string} videoId 
 * @param {number} time 
 */
export const savePlaybackTime = (videoId, time) => {
    const cache = loadPlaybackCache();

    // If we already have it or we are adding it, just update
    cache[videoId] = {
        time: parseFloat(time),
        timestamp: Date.now()
    };

    const entries = Object.entries(cache);

    if (entries.length > MAX_VIDEOS) {
        // Sort by timestamp descending (newest first)
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

        // Take top 100
        const trimmedCache = {};
        for (let i = 0; i < MAX_VIDEOS; i++) {
            trimmedCache[entries[i][0]] = entries[i][1];
        }
        savePlaybackCache(trimmedCache);
    } else {
        savePlaybackCache(cache);
    }
};

/**
 * Sweeps localStorage for any orphaned "playback_time_*" keys and removes them.
 * This function should be called on app startup to clear out legacy clutter.
 */
export const clearOldPlaybackKeys = () => {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('playback_time_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (keysToRemove.length > 0) {
            console.log(`[Storage Cleanup] Cleared ${keysToRemove.length} orphaned playback time keys from localStorage.`);
        }
    } catch (e) {
        console.error("Failed to clear old playback keys", e);
    }
};
