import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User,
    Settings,
    Globe,
    LogOut,
    ChevronRight,
    BookOpen,
    Flame,
    Award,
    Shield,
    Bell,
    HelpCircle,
    ExternalLink,
    Zap,
    Key,
    Cpu
} from 'lucide-react';
import api from '../../api';
import { useTranslation } from '../../hooks/useTranslation';

const MobileProfile = ({ user, setUser }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loggingOut, setLoggingOut] = useState(false);
    const [stats, setStats] = useState({ totalWords: 0, streak: 0, level: 'B1' });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [vocabRes, statsRes] = await Promise.all([
                api.get('vocab/'),
                api.get('stats/')
            ]);
            setStats({
                totalWords: statsRes.data.total_words || vocabRes.data.length || 0,
                streak: statsRes.data.streak || 0,
                level: user?.level || 'B1'
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            // Use AuthService for complete session cleanup
            const AuthService = (await import('../../services/AuthService')).default;
            await AuthService.logout();
            setUser(null);
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
            navigate('/login');
        } finally {
            setLoggingOut(false);
        }
    };

    const mainMenuItems = [
        { icon: User, label: t('editProfile'), subtitle: t('updatePersonalInfo'), path: '/m/me/edit' },
        { icon: Globe, label: t('language'), subtitle: t('learningPreferences'), path: '/m/me/language' },
        { icon: Cpu, label: t('aiGateway'), subtitle: t('multiProvider'), path: '/m/ai-gateway' },
        { icon: Key, label: t('apiKeys'), subtitle: t('serviceIntegrations'), path: '/m/me/api-keys' },
        { icon: Bell, label: t('notifications'), subtitle: t('pushAlerts'), path: '/m/me/notifications' },
        { icon: Shield, label: t('security'), subtitle: t('passwordSettings'), path: '/m/me/security' },
    ];

    const secondaryMenuItems = [
        { icon: HelpCircle, label: t('help'), path: '/m/me/help' },
        { icon: ExternalLink, label: t('about'), path: '/m/me/about' },
    ];

    const getMemberSince = () => {
        if (user?.date_joined) {
            const date = new Date(user.date_joined);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return 'Member';
    };

    return (
        <div className="min-h-screen pb-28" style={{ backgroundColor: 'transparent' }}>
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-14 pb-6 px-5"
            >
                {/* Holographic Student ID Card */}
                <motion.div
                    initial={{ rotateX: 90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative w-full aspect-[1.586] rounded-2xl p-6 mb-8 overflow-hidden shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #18181B 0%, #09090B 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Holographic Overlay Effect */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            background: 'linear-gradient(125deg, transparent 35%, rgba(99, 102, 241, 0.3) 45%, rgba(168, 85, 247, 0.3) 55%, transparent 65%)',
                            backgroundSize: '200% 200%',
                            animation: 'holo-shine 3s ease infinite'
                        }}
                    />

                    {/* Card Content */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                                    <Globe size={16} className="text-indigo-400" />
                                </div>
                                <span className="text-xs font-bold tracking-widest text-indigo-400/80 uppercase">VocabMaster ID</span>
                            </div>
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 opacity-50" onError={(e) => e.target.style.display = 'none'} />
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight mb-0.5">{user?.username || 'Student'}</h2>
                                <p className="text-xs text-indigo-200/60 font-mono tracking-wider">{user?.email}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Level</div>
                                <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400">
                                    {user?.level || 'B1'}
                                </div>
                            </div>
                        </div>

                        {/* ID Footer */}
                        <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-600 uppercase">Joined</span>
                                <span className="text-[10px] text-gray-400 font-mono">{getMemberSince()}</span>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shrink-0">
                                {user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <span className="text-lg font-bold text-gray-500">{user?.username?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl -ml-10 -mb-10" />
                </motion.div>

                {/* Edit Button (Moved below card) */}
                <div className="flex justify-end mb-4 -mt-4 px-2">
                    <button
                        onClick={() => navigate('/m/me/edit')}
                        className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors"
                    >
                        <Settings size={12} />
                        Edit Profile
                    </button>
                </div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-3"
                >
                    {[
                        { icon: BookOpen, value: stats.totalWords, label: t('wordsCount'), color: '#6366F1' },
                        { icon: Flame, value: stats.streak, label: t('dayStreak'), color: '#F59E0B' },
                        { icon: Award, value: stats.level, label: t('level'), color: '#22C55E' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.25 + i * 0.05 }}
                            className="rounded-2xl p-4 text-center"
                            style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}
                        >
                            <div
                                className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <stat.icon size={18} style={{ color: stat.color }} />
                            </div>
                            <p className="text-lg font-bold" style={{ color: '#FAFAFA' }}>{stat.value}</p>
                            <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#52525B' }}>
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Upgrade Banner - Optional premium feel */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="px-5 mb-5"
            >
                <div
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(135deg, #1C1C1F 0%, #18181B 100%)',
                        border: '1px solid #27272A'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <Zap size={20} style={{ color: '#FFFFFF' }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{t('keepLearning')}</p>
                            <p className="text-xs" style={{ color: '#71717A' }}>{t('trackProgress')}</p>
                        </div>
                    </div>
                    <ChevronRight size={18} style={{ color: '#52525B' }} />
                </div>
            </motion.div>

            {/* Main Menu Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="px-5 mb-4"
            >
                <p className="text-[11px] uppercase tracking-wider font-medium mb-3 px-1" style={{ color: '#52525B' }}>
                    {t('account')}
                </p>
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}
                >
                    {mainMenuItems.map((item, index) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors"
                            style={{
                                borderBottom: index < mainMenuItems.length - 1 ? '1px solid #1F1F23' : 'none'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: '#1F1F23' }}
                                >
                                    <item.icon size={18} style={{ color: '#A1A1AA' }} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{item.label}</p>
                                    <p className="text-xs" style={{ color: '#52525B' }}>{item.subtitle}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} style={{ color: '#3F3F46' }} />
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Secondary Menu Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="px-5 mb-6"
            >
                <p className="text-[11px] uppercase tracking-wider font-medium mb-3 px-1" style={{ color: '#52525B' }}>
                    More
                </p>
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}
                >
                    {secondaryMenuItems.map((item, index) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 + index * 0.05 }}
                            onClick={() => navigate(item.path)}
                            className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors"
                            style={{
                                borderBottom: index < secondaryMenuItems.length - 1 ? '1px solid #1F1F23' : 'none'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} style={{ color: '#71717A' }} />
                                <p className="text-sm" style={{ color: '#A1A1AA' }}>{item.label}</p>
                            </div>
                            <ChevronRight size={16} style={{ color: '#3F3F46' }} />
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Logout Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="px-5"
            >
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl transition-colors disabled:opacity-50"
                    style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)'
                    }}
                >
                    <LogOut size={18} style={{ color: '#EF4444' }} />
                    <span className="font-medium" style={{ color: '#EF4444' }}>
                        {loggingOut ? t('loading') : t('logout')}
                    </span>
                </motion.button>
            </motion.div>

            {/* Version Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-[10px] mt-6 pb-4"
                style={{ color: '#3F3F46' }}
            >
                VocabMaster v1.0.0
            </motion.p>
        </div>
    );
};

export default MobileProfile;

