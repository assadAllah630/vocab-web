import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRightStartOnRectangleIcon,
    CogIcon,
    UserIcon,
    LanguageIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import api from '../../api';

const MobileProfile = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await api.post('logout/');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/login');
        }
    };

    const menuItems = [
        { icon: UserIcon, label: 'Edit Profile', path: '/m/me/edit', color: '#6366F1' },
        { icon: LanguageIcon, label: 'Language Settings', path: '/m/me/language', color: '#14B8A6' },
        { icon: CogIcon, label: 'App Settings', path: '/m/me/settings', color: '#8B5CF6' },
    ];

    return (
        <div className="min-h-screen bg-[#09090B] pb-24">
            {/* Header Card */}
            <div className="px-4 pt-6 pb-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{user?.username || 'User'}</h1>
                            <p className="text-white/70 text-sm">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Stats Row */}
            <div className="px-4 mb-6">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Words', value: user?.total_words || 0 },
                        { label: 'Streak', value: user?.streak || 0 },
                        { label: 'Level', value: user?.level || 'B1' }
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#18181B] rounded-xl p-4 text-center border border-[#27272A]"
                        >
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-[#71717A] mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4 space-y-2">
                {menuItems.map((item, i) => (
                    <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center justify-between p-4 bg-[#18181B] rounded-xl border border-[#27272A] active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${item.color}20` }}
                            >
                                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                            </div>
                            <span className="font-medium text-white">{item.label}</span>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-[#52525B]" />
                    </motion.button>
                ))}
            </div>

            {/* Logout Button */}
            <div className="px-4 mt-8">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                    <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                    {loggingOut ? 'Logging out...' : 'Log Out'}
                </motion.button>
            </div>
        </div>
    );
};

export default MobileProfile;
