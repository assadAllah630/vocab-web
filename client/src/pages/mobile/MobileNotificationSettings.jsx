import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Bell, Check, AlertCircle } from 'lucide-react';
import usePushNotifications from '../../hooks/usePushNotifications';
import { useTranslation } from '../../hooks/useTranslation';

const MobileNotificationSettings = ({ user }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { requestPermission, token } = usePushNotifications();
    const [loading, setLoading] = useState(false);

    const handleEnable = async () => {
        setLoading(true);
        await requestPermission();
        setLoading(false);
    };

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 px-5 pt-4 pb-3" style={{ backgroundColor: '#09090B' }}>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/me')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>
                    <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>Notifications</h1>
                </div>
            </div>

            <div className="px-5 mt-6 space-y-6">
                {/* Info Card */}
                <div className="p-5 rounded-2xl" style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                            <Bell size={20} color="#6366F1" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base mb-1" style={{ color: '#FAFAFA' }}>Push Notifications</h3>
                            <p className="text-sm leading-relaxed" style={{ color: '#A1A1AA' }}>
                                Receive alerts when your AI exams are ready, and get daily practice reminders.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleEnable}
                            disabled={!!token || loading}
                            className="w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                            style={{
                                backgroundColor: token ? 'rgba(34, 197, 94, 0.15)' : '#6366F1',
                                border: token ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
                                color: token ? '#22C55E' : '#FFFFFF'
                            }}
                        >
                            {loading ? (
                                <span>Processing...</span>
                            ) : token ? (
                                <>
                                    <Check size={18} />
                                    <span>Notifications Active</span>
                                </>
                            ) : (
                                <span>Enable Notifications</span>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: token ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${token ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` }}>
                    <div className={`w-2 h-2 rounded-full ${token ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="text-sm" style={{ color: token ? '#22C55E' : '#EF4444' }}>
                        {token ? 'Your device is connected to the notification service.' : 'Notifications are currently disabled for this device.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileNotificationSettings;
