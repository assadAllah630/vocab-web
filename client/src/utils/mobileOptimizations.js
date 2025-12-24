/**
 * Mobile Optimization Utilities
 * 
 * Shared utilities for offline caching, touch feedback, and performance.
 */

// ============================================
// OFFLINE CACHING
// ============================================

/**
 * Cache data with timestamp
 */
export const cacheData = (key, data, maxAgeMs = 3600000) => {
    try {
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now(),
            maxAge: maxAgeMs
        }));
    } catch (e) {
        console.warn('Cache write failed:', e);
    }
};

/**
 * Get cached data if still valid
 */
export const getCachedData = (key) => {
    try {
        const cached = localStorage.getItem(key);
        if (cached) {
            const { data, timestamp, maxAge } = JSON.parse(cached);
            if (Date.now() - timestamp < maxAge) {
                return data;
            }
        }
    } catch (e) {
        console.warn('Cache read failed:', e);
    }
    return null;
};

/**
 * Cache-first API wrapper
 */
export const fetchWithCache = async (key, fetchFn, maxAgeMs = 3600000) => {
    // Try cache first for instant response
    const cached = getCachedData(key);

    try {
        const freshData = await fetchFn();
        cacheData(key, freshData, maxAgeMs);
        return { data: freshData, fromCache: false };
    } catch (error) {
        // Fallback to cache on network error
        if (cached) {
            return { data: cached, fromCache: true, error };
        }
        throw error;
    }
};

// ============================================
// TOUCH FEEDBACK
// ============================================

/**
 * Touch feedback class for active states
 */
export const touchFeedbackClass = 'active:scale-[0.98] active:opacity-90 transition-transform';

/**
 * Minimum touch target size (44x44 per iOS/Android guidelines)
 */
export const minTouchTarget = 'min-w-[44px] min-h-[44px]';

// ============================================
// ACCESSIBILITY
// ============================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preference
 */
export const getAnimationDuration = (defaultMs = 300) => {
    return prefersReducedMotion() ? 0 : defaultMs;
};

// ============================================
// PERFORMANCE
// ============================================

/**
 * Debounce function for search inputs
 */
export const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Throttle function for scroll handlers
 */
export const throttle = (fn, limit = 100) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ============================================
// MEDIA QUERIES
// ============================================

/**
 * Check if mobile viewport
 */
export const isMobileViewport = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
};

/**
 * Check if in standalone PWA mode
 */
export const isPWA = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
};

// ============================================
// NATIVE FEATURES
// ============================================

/**
 * Trigger haptic feedback if available
 */
export const hapticFeedback = (type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(25); break;
            case 'heavy': navigator.vibrate(50); break;
            case 'success': navigator.vibrate([10, 50, 10]); break;
            case 'error': navigator.vibrate([50, 30, 50]); break;
        }
    }
};

/**
 * Native share sheet
 */
export const nativeShare = async (data) => {
    if (navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (e) {
            if (e.name !== 'AbortError') console.warn(e);
        }
    }
    return false;
};

/**
 * Add event to device calendar (via ICS download)
 */
export const addToCalendar = (event) => {
    const { title, description, start, end, location } = event;
    const formatDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${title}
DESCRIPTION:${description || ''}
LOCATION:${location || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
};

export default {
    cacheData,
    getCachedData,
    fetchWithCache,
    touchFeedbackClass,
    minTouchTarget,
    prefersReducedMotion,
    getAnimationDuration,
    debounce,
    throttle,
    isMobileViewport,
    isPWA,
    hapticFeedback,
    nativeShare,
    addToCalendar
};
