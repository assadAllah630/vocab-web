import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone
            || document.referrer.includes('android-app://');
        setIsStandalone(standalone);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        // Check if dismissed recently (don't show for 7 days after dismiss)
        const dismissed = localStorage.getItem('installPromptDismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDays) {
                return;
            }
        }

        // Listen for beforeinstallprompt (Android Chrome)
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a delay (better UX)
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // For iOS, show after delay if not standalone
        if (iOS && !standalone) {
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    };

    // Don't show if already installed
    if (isStandalone) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="fixed bottom-20 left-4 right-4 z-50"
                >
                    <div
                        className="rounded-2xl p-5 shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #18181B 0%, #1F1F23 100%)',
                            border: '1px solid #3F3F46'
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full"
                            style={{ backgroundColor: '#27272A' }}
                        >
                            <X size={16} style={{ color: '#71717A' }} />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                            >
                                <Download size={24} style={{ color: '#FFFFFF' }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pr-6">
                                <h3 className="text-base font-semibold mb-1" style={{ color: '#FAFAFA' }}>
                                    Install VocabMaster
                                </h3>
                                <p className="text-sm mb-4" style={{ color: '#A1A1AA' }}>
                                    {isIOS
                                        ? 'Add to your home screen for offline access!'
                                        : 'Install for faster access and offline mode!'
                                    }
                                </p>

                                {isIOS ? (
                                    // iOS Instructions
                                    <div
                                        className="rounded-xl p-3 mb-3"
                                        style={{ backgroundColor: '#27272A' }}
                                    >
                                        <div className="flex items-center gap-3 text-sm" style={{ color: '#A1A1AA' }}>
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: '#6366F1' }}>1.</span>
                                                <span>Tap</span>
                                                <Share size={16} style={{ color: '#6366F1' }} />
                                            </div>
                                            <span style={{ color: '#52525B' }}>→</span>
                                            <div className="flex items-center gap-2">
                                                <span style={{ color: '#6366F1' }}>2.</span>
                                                <span>Add to Home</span>
                                                <Plus size={16} style={{ color: '#6366F1' }} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Android/Chrome Install Button
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleInstall}
                                        className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                            color: '#FFFFFF'
                                        }}
                                    >
                                        <Download size={18} />
                                        Install Now
                                    </motion.button>
                                )}

                                <button
                                    onClick={handleDismiss}
                                    className="w-full mt-2 py-2 text-sm font-medium"
                                    style={{ color: '#71717A' }}
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
