import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ArrowLeft, Trash2, X } from 'lucide-react';
import api from '../../api';

const MobileNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/list/');
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/list/', { mark_all_read: true });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        // Mark as read
        if (!notif.is_read) {
            try {
                await api.post('/notifications/list/', { id: notif.id });
                setNotifications(prev =>
                    prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Error marking as read', error);
            }
        }

        // Navigate based on type/body check (or backend URL passed?)
        // The backend log doesn't store URL explicitly, but body implies context.
        // For now, if "Exam Ready", we can guess url, but better to just show detail or do nothing.
        // Wait, background_exam creates "custom" type.
        // Ideally we'd store a 'link' or 'data' field in NotificationLog but we can't migrate models.
        // So we just show the message.
        if (notif.body.includes("exam is ready")) {
            // Extract ID or just go to exam list?
            navigate('/m/exam');
        }
    };

    return (
        <div className="min-h-screen bg-[#09090B] pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#09090B]/80 backdrop-blur-md border-b border-[#27272A] px-4 py-4 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-[#27272A] text-[#A1A1AA]"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-white">Notifications</h1>
                <button
                    onClick={markAllRead}
                    className="p-2 rounded-full hover:bg-[#27272A] text-[#3B82F6]"
                    title="Mark all as read"
                >
                    <Check size={20} />
                </button>
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center text-[#A1A1AA] py-10">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#A1A1AA]">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                onClick={() => handleNotificationClick(notif)}
                                className={`
                                    relative p-4 rounded-xl border cursor-pointer transition-colors
                                    ${notif.is_read
                                        ? 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                                        : 'bg-[#1C1C20] border-[#3B82F6]/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    }
                                `}
                            >
                                {!notif.is_read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#3B82F6]" />
                                )}
                                <div className="flex items-start gap-3">
                                    <div className={`
                                        mt-1 p-2 rounded-full 
                                        ${notif.error ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}
                                    `}>
                                        <Bell size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-medium text-sm mb-1 ${notif.is_read ? 'text-[#E4E4E7]' : 'text-white'}`}>
                                            {notif.title}
                                        </h3>
                                        <p className="text-xs text-[#A1A1AA] leading-relaxed">
                                            {notif.body}
                                        </p>
                                        <span className="text-[10px] text-[#52525B] mt-2 block">
                                            {new Date(notif.sent_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default MobileNotifications;
