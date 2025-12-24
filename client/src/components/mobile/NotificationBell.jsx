import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, BookOpen, Calendar, Award, Users, AlertTriangle } from 'lucide-react';
import { Badge, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../../api';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const loadUnreadCount = async () => {
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.data.count);
        } catch (err) {
            console.error(err);
        }
    };

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            setNotifications(res.data.slice(0, 10));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        loadNotifications();
    };

    const handleClick = async (notif) => {
        if (!notif.is_read) {
            await markNotificationRead(notif.id);
            setUnreadCount(Math.max(0, unreadCount - 1));
        }
        setIsOpen(false);

        // Navigate based on notification type
        if (notif.data?.assignment_id) {
            navigate(`/m/assignment/${notif.data.assignment_id}/view`);
        } else if (notif.data?.session_id) {
            navigate(`/m/session/${notif.data.session_id}`);
        } else if (notif.data?.classroom_id) {
            navigate(`/m/class/${notif.data.classroom_id}`);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'assignment_new':
            case 'assignment_due':
            case 'assignment_graded':
                return <BookOpen size={16} className="text-blue-400" />;
            case 'session_reminder':
            case 'session_starting':
                return <Calendar size={16} className="text-green-400" />;
            case 'join_approved':
                return <Users size={16} className="text-indigo-400" />;
            case 'achievement':
                return <Award size={16} className="text-amber-400" />;
            case 'streak_risk':
            case 'streak_warning':
                return <AlertTriangle size={16} className="text-red-400" />;
            default:
                return <Bell size={16} className="text-gray-400" />;
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
            <PopoverTrigger>
                <button
                    onClick={handleOpen}
                    className="relative p-2 rounded-full hover:bg-[#27272A] transition-colors"
                >
                    <Bell size={22} className="text-gray-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#1C1C1F] border-[#27272A]">
                <div className="p-3 border-b border-[#27272A] flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:underline">
                            Mark all read
                        </button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            <Bell className="mx-auto mb-2 opacity-20" size={32} />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {notifications.map((n, idx) => (
                                <motion.button
                                    key={n.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => handleClick(n)}
                                    className={`w-full p-3 flex gap-3 text-left border-b border-[#27272A] hover:bg-[#27272A] transition-colors
                                        ${!n.is_read ? 'bg-indigo-500/5' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#27272A] flex items-center justify-center shrink-0">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${!n.is_read ? 'text-white' : 'text-gray-400'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-[11px] text-gray-500 truncate">{n.body}</p>
                                        <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.sent_at)}</p>
                                    </div>
                                    {!n.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                                    )}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
                <div className="p-2 border-t border-[#27272A]">
                    <Button
                        size="sm"
                        variant="light"
                        className="w-full text-xs"
                        onPress={() => { setIsOpen(false); navigate('/m/notifications'); }}
                    >
                        View All Notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
