import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import {
    Plus,
    Play,
    Sparkles,
    BookOpen,
    TrendingUp,
    ChevronRight,
    Zap,
    Trophy,
    Target,
    Star,
    WifiOff,
    Bell,
    Mic
} from 'lucide-react';
import { AnimatedIcon, GlowingZap, BouncingFlame } from '../../components/AnimatedIcons';
import streakFlame from '../../assets/streak-flame.png';
import { statsStorage, vocabStorage, useOnlineStatus } from '../../utils/offlineStorage';
import { useTranslation } from '../../hooks/useTranslation';

// Motivational messages based on streak
const getMotivation = (streak) => {
    if (streak === 0) return { message: "Start your learning journey today!", emoji: "🚀" };
    if (streak < 3) return { message: "Great start! Keep the momentum!", emoji: "💪" };
    if (streak < 7) return { message: "You're building a habit!", emoji: "🔥" };
    if (streak < 14) return { message: "Incredible consistency!", emoji: "⭐" };
    if (streak < 30) return { message: "You're unstoppable!", emoji: "🏆" };
    return { message: "Legendary dedication!", emoji: "👑" };
};

// Get time-based greeting
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

function MobileHome({ user }) {
    const navigate = useNavigate();
    const { t, translations } = useTranslation();
    const [stats, setStats] = useState({
        totalWords: 0,
        streak: 0,
        needsReview: 0,
        todayProgress: 0,
        dailyGoal: 10
    });
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Try cache first
            const cachedStats = await statsStorage.get();
            const cachedVocab = await vocabStorage.getAll();

            if (cachedStats) {
                setStats({
                    totalWords: cachedStats.totalWords || cachedVocab.length || 0,
                    streak: cachedStats.streak || 0,
                    needsReview: cachedStats.needsReview || 0,
                    todayProgress: cachedStats.todayProgress || 0,
                    dailyGoal: cachedStats.dailyGoal || 10
                });
                setLoading(false);
            }

            // If online, fetch fresh data
            if (navigator.onLine) {
                const [vocabRes, statsRes] = await Promise.all([
                    api.get('vocab/'),
                    api.get('stats/')
                ]);
                const newStats = {
                    totalWords: statsRes.data.total_words || vocabRes.data.length || 0,
                    streak: statsRes.data.streak || 0,
                    needsReview: statsRes.data.needs_review || 0,
                    todayProgress: Math.min(statsRes.data.today_words || 0, 10),
                    dailyGoal: 10
                };
                setStats(newStats);

                // Cache stats and vocab
                await statsStorage.save(newStats);
                await vocabStorage.saveAll(vocabRes.data);

                // Show celebration if goal achieved
                if (newStats.todayProgress >= newStats.dailyGoal) {
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 3000);
                }
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const motivation = getMotivation(stats.streak);
    const progressPercent = (stats.todayProgress / stats.dailyGoal) * 100;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const actions = [
        { icon: Plus, label: t('add'), color: '#22C55E', action: () => navigate('/m/words/add') },
        { icon: Play, label: t('review'), color: '#6366F1', action: () => navigate('/m/practice/flashcard?hlr=true') },
        { icon: Sparkles, label: t('quiz'), color: '#A855F7', action: () => navigate('/m/exam') },
        { icon: BookOpen, label: t('games'), color: '#F59E0B', action: () => navigate('/m/games') }
    ];

    return (
        <div className="min-h-screen"
            style={{ backgroundColor: 'transparent' }}
        >
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.5, repeat: 3 }}
                                className="text-6xl mb-4"
                            >
                                🎉
                            </motion.div>
                            <p className="text-xl font-bold text-white">Daily Goal Complete!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with greeting */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 pt-14 pb-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm" style={{ color: '#71717A' }}>{t('goodMorning')} 👋</p>
                        <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#FAFAFA' }}>
                            {user?.username || 'Learner'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/m/notifications')}
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                        >
                            <Bell size={20} color="#A1A1AA" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/m/me')}
                            className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg"
                            style={{
                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                color: '#FAFAFA'
                            }}
                        >
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </motion.button>
                    </div>
                </div >
            </motion.div >

            {/* Streak Card - Animated */}
            < motion.div
                initial={{ opacity: 0, y: 20 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-5 mb-4"
            >
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #1C1C1F 0%, #27272A 100%)',
                        border: '1px solid #3F3F46'
                    }}
                >
                    {/* Animated background glow */}
                    <motion.div
                        animate={{
                            opacity: [0.3, 0.5, 0.3],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
                        style={{ background: 'radial-gradient(circle, #F59E0B40 0%, transparent 70%)' }}
                    />

                    <div className="flex items-center gap-4 relative z-10">
                        <motion.div
                            animate={{
                                rotate: stats.streak > 0 ? [0, -5, 5, 0] : 0,
                            }}
                            transition={{ duration: 0.5, repeat: stats.streak > 0 ? Infinity : 0, repeatDelay: 2 }}
                            className="w-16 h-16 flex items-center justify-center"
                        >
                            <img src={streakFlame} alt="streak" className="w-14 h-14 object-contain" />
                        </motion.div>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                                <motion.span
                                    key={stats.streak}
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-4xl font-bold"
                                    style={{ color: '#FAFAFA' }}
                                >
                                    {stats.streak}
                                </motion.span>
                                <span className="text-lg font-medium" style={{ color: '#A1A1AA' }}>{t('dayStreak')}</span>
                            </div>
                            <p className="text-sm mt-1" style={{ color: '#71717A' }}>
                                {motivation.emoji} {motivation.message}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div >

            {/* Stats Row */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-5 mb-4"
            >
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: BookOpen, value: stats.totalWords, label: t('wordsCount'), color: '#6366F1' },
                        { icon: Target, value: stats.needsReview, label: t('toReview'), color: '#F59E0B' },
                        { icon: TrendingUp, value: stats.todayProgress, label: t('today'), color: '#22C55E' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="rounded-xl p-4 text-center"
                            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                        >
                            <stat.icon size={20} style={{ color: stat.color }} className="mx-auto mb-2" />
                            <p className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>{stat.value}</p>
                            <p className="text-xs mt-1" style={{ color: '#71717A' }}>{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div >

            {/* Progress Bar */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-5 mb-5"
            >
                <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Trophy size={18} style={{ color: '#F59E0B' }} />
                            <span className="font-medium" style={{ color: '#FAFAFA' }}>{t('dailyGoal')}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: progressPercent >= 100 ? '#22C55E' : '#A1A1AA' }}>
                            {stats.todayProgress}/{stats.dailyGoal}
                        </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#27272A' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                                background: progressPercent >= 100
                                    ? 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)'
                                    : 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)'
                            }}
                        />
                    </div>
                    {progressPercent < 100 && (
                        <p className="text-xs mt-2" style={{ color: '#71717A' }}>
                            {stats.dailyGoal - stats.todayProgress} {t('moreToComplete')}
                        </p>
                    )}
                </div>
            </motion.div >

            {/* Review Banner */}
            {
                stats.needsReview > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="px-5 mb-5"
                    >
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/m/practice/flashcard?hlr=true')}
                            className="w-full rounded-xl p-5 flex items-center justify-between relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <motion.div
                                animate={{ x: [0, 100, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 opacity-20"
                                style={{ background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)' }}
                            />
                            <div className="text-left relative z-10">
                                <div className="flex items-center gap-2">
                                    <Zap size={20} style={{ color: '#FFFFFF' }} />
                                    <p className="font-bold text-lg" style={{ color: '#FFFFFF' }}>
                                        {stats.needsReview} words ready
                                    </p>
                                </div>
                                <p className="text-sm opacity-80 mt-1" style={{ color: '#FFFFFF' }}>
                                    Tap to start your review session
                                </p>
                            </div>
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <ChevronRight size={24} style={{ color: '#FFFFFF' }} />
                            </motion.div>
                        </motion.button>
                    </motion.div>
                )
            }

            {/* Podcast Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="px-5 mb-5"
            >
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/m/podcast-studio')}
                    className="w-full rounded-xl p-5 relative overflow-hidden flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(135deg, #1C1C1F 0%, #27272A 100%)',
                        border: '1px solid #3F3F46'
                    }}
                >
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Mic size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg text-white">Podcast Studio</h3>
                            <p className="text-sm text-gray-400">Turn topics into audio shows</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-500" />
                </motion.button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="px-5"
            >
                <h2 className="text-sm font-semibold mb-3" style={{ color: '#A1A1AA' }}>{t('quickActions')}</h2>
                <div className="grid grid-cols-4 gap-3">
                    {actions.map((item, i) => (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ y: -3 }}
                            onClick={item.action}
                            className="flex flex-col items-center py-4 rounded-xl transition-colors"
                            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                        >
                            <motion.div
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                                style={{ backgroundColor: `${item.color}20` }}
                            >
                                <AnimatedIcon icon={item.icon} size={20} color={item.color} animation="bounce" />
                            </motion.div>
                            <span className="text-xs font-medium" style={{ color: '#A1A1AA' }}>
                                {item.label}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Motivational Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="px-5 py-6 mt-4 text-center"
            >
                <p className="text-sm" style={{ color: '#52525B' }}>
                    "{t('everyWord')}" ✨
                </p>
            </motion.div>
        </div >
    );
}

export default MobileHome;
