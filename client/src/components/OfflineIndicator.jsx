import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../utils/offlineStorage';

const OfflineIndicator = ({ pendingCount = 0 }) => {
    const isOnline = useOnlineStatus();
    const [syncing, setSyncing] = React.useState(false);

    // Simulate syncing animation when coming back online
    React.useEffect(() => {
        if (isOnline && pendingCount > 0) {
            setSyncing(true);
            const timer = setTimeout(() => setSyncing(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, pendingCount]);

    // Don't show if online and nothing to sync
    if (isOnline && pendingCount === 0 && !syncing) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-center gap-2"
                style={{
                    backgroundColor: isOnline ? (syncing ? '#16A34A' : '#F59E0B') : '#EF4444',
                    paddingTop: 'env(safe-area-inset-top, 8px)'
                }}
            >
                {!isOnline ? (
                    <>
                        <WifiOff size={16} style={{ color: '#FFFFFF' }} />
                        <span className="text-xs font-medium" style={{ color: '#FFFFFF' }}>
                            You're offline - changes will sync when connected
                        </span>
                    </>
                ) : syncing ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <RefreshCw size={16} style={{ color: '#FFFFFF' }} />
                        </motion.div>
                        <span className="text-xs font-medium" style={{ color: '#FFFFFF' }}>
                            Syncing {pendingCount} changes...
                        </span>
                    </>
                ) : pendingCount > 0 ? (
                    <>
                        <RefreshCw size={16} style={{ color: '#FFFFFF' }} />
                        <span className="text-xs font-medium" style={{ color: '#FFFFFF' }}>
                            {pendingCount} changes pending sync
                        </span>
                    </>
                ) : null}
            </motion.div>
        </AnimatePresence>
    );
};

export default OfflineIndicator;
