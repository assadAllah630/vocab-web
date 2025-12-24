import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hooks for mobile optimization
 */

// ============================================
// MEDIA QUERY HOOK
// ============================================

export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');

// ============================================
// PULL TO REFRESH HOOK
// ============================================

export const usePullToRefresh = (onRefresh, threshold = 80) => {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefresh]);

    useEffect(() => {
        let startY = 0;

        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                setIsPulling(true);
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling) return;
            const currentY = e.touches[0].clientY;
            const distance = Math.max(0, currentY - startY);
            setPullDistance(Math.min(distance, threshold * 1.5));
        };

        const handleTouchEnd = () => {
            if (pullDistance >= threshold && !isRefreshing) {
                handleRefresh();
            }
            setIsPulling(false);
            setPullDistance(0);
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, threshold, isRefreshing, handleRefresh]);

    return { isPulling, pullDistance, isRefreshing, progress: Math.min(pullDistance / threshold, 1) };
};

// ============================================
// INFINITE SCROLL HOOK
// ============================================

export const useInfiniteScroll = (loadMore, { threshold = 200, hasMore = true } = {}) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!hasMore) return;

        const handleScroll = async () => {
            const scrollBottom = window.innerHeight + window.scrollY;
            const docHeight = document.documentElement.scrollHeight;

            if (scrollBottom >= docHeight - threshold && !loading && hasMore) {
                setLoading(true);
                try {
                    await loadMore();
                } finally {
                    setLoading(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore, threshold, hasMore, loading]);

    return { loading };
};

// ============================================
// KEYBOARD VISIBILITY HOOK
// ============================================

export const useKeyboardVisible = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof visualViewport === 'undefined') return;

        const handleResize = () => {
            const heightDiff = window.innerHeight - visualViewport.height;
            setIsVisible(heightDiff > 150); // Keyboard typically > 150px
        };

        visualViewport.addEventListener('resize', handleResize);
        return () => visualViewport.removeEventListener('resize', handleResize);
    }, []);

    return isVisible;
};

// ============================================
// ONLINE STATUS HOOK
// ============================================

export const useOnlineStatus = () => {
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
};

// ============================================
// DEBOUNCED VALUE HOOK
// ============================================

export const useDebouncedValue = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

// ============================================
// SWIPE GESTURE HOOK
// ============================================

export const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
    const [touchStart, setTouchStart] = useState(null);

    const handleTouchStart = useCallback((e) => {
        setTouchStart(e.touches[0].clientX);
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (touchStart === null) return;

        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (Math.abs(diff) >= threshold) {
            if (diff > 0 && onSwipeLeft) {
                onSwipeLeft();
            } else if (diff < 0 && onSwipeRight) {
                onSwipeRight();
            }
        }
        setTouchStart(null);
    }, [touchStart, threshold, onSwipeLeft, onSwipeRight]);

    return { handleTouchStart, handleTouchEnd };
};

export default {
    useMediaQuery,
    useIsMobile,
    useIsTablet,
    usePrefersReducedMotion,
    usePrefersDarkMode,
    usePullToRefresh,
    useInfiniteScroll,
    useKeyboardVisible,
    useOnlineStatus,
    useDebouncedValue,
    useSwipeGesture
};
