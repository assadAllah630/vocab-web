import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getMySkills } from '../api';
import VocabularyMastery from '../components/VocabularyMastery';
import SkillRadarChart from '../components/dashboard/SkillRadarChart';
import CoachWidget from '../components/dashboard/CoachWidget';
import RecommendationList from '../components/dashboard/RecommendationList';
import ActivityHeatmap from '../components/ActivityHeatmap';
import {
    BookOpenIcon,
    AcademicCapIcon,
    FireIcon,
    TrophyIcon,
    PlusIcon,
    PlayIcon,
    ArrowRightIcon,
    SparklesIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';

function Dashboard({ user }) {
    // Redirect teachers to their dashboard
    if (user?.is_teacher) {
        window.location.href = '/teacher/dashboard';
        return null; // Don't render student dashboard
    }

    const [stats, setStats] = useState({
        totalWords: 0,
        quizzesTaken: 0,
        streak: 0,
        level: 'Beginner',
        wordsAddedThisWeek: 0,
        quizzesThisWeek: 0,
        needsReview: 0
    });
    const [loading, setLoading] = useState(true);
    const [showMastery, setShowMastery] = useState(false);
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        fetchStats();
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const response = await getMySkills();
            setSkills(response.data || []);
        } catch (err) {
            console.error("Failed to fetch skills:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const [vocabRes, quizRes, statsRes] = await Promise.all([
                api.get('vocab/'),
                api.get('quiz/'),
                api.get('stats/')
            ]);

            setStats({
                totalWords: statsRes.data.total_words || vocabRes.data.length,
                quizzesTaken: quizRes.data.length,
                streak: statsRes.data.streak || 0,
                level: statsRes.data.level || 'Novice',
                wordsAddedThisWeek: statsRes.data.words_added_this_week || 0,
                quizzesThisWeek: statsRes.data.quizzes_this_week || 0,
                needsReview: statsRes.data.needs_review || 0,
                activityLog: statsRes.data.activity_log || {}
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Check if user is new (no words)
    const isNewUser = stats.totalWords === 0;
    const hasReviewsToday = stats.needsReview > 0;

    // Empty state for new users
    if (!loading && isNewUser) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center min-h-[70vh] p-6"
            >
                <div className="max-w-2xl w-full text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <RocketLaunchIcon className="w-16 h-16 text-primary-600" />
                    </div>

                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                        🌱 Let's Start Your {user?.target_language === 'de' ? 'German' : 'Language'} Journey!
                    </h1>

                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                        Build your vocabulary foundation by adding your first 10 words.
                        Our smart spaced repetition system will help you remember them forever.
                    </p>

                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8 border border-indigo-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">✨ How it works:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div>
                                <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold mb-3">1</div>
                                <h4 className="font-bold text-slate-900 mb-1">Add Words</h4>
                                <p className="text-sm text-slate-600">Start with words you want to learn</p>
                            </div>
                            <div>
                                <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold mb-3">2</div>
                                <h4 className="font-bold text-slate-900 mb-1">Practice Daily</h4>
                                <p className="text-sm text-slate-600">Review at optimal intervals</p>
                            </div>
                            <div>
                                <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold mb-3">3</div>
                                <h4 className="font-bold text-slate-900 mb-1">Master Forever</h4>
                                <p className="text-sm text-slate-600">Never forget what you've learned</p>
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/vocab/add"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:scale-105 transition-all"
                    >
                        <PlusIcon className="w-6 h-6" />
                        Add Your First Word
                        <ArrowRightIcon className="w-5 h-5" />
                    </Link>

                    <p className="text-sm text-slate-500 mt-6">
                        Or <Link to="/shared" className="text-primary-600 hover:text-primary-700 font-medium">browse public vocabulary</Link> for inspiration
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 p-6"
        >
            {/* Hero Section with Prominent Review CTA */}
            <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-primary-900 text-white shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />

                <div className="relative z-10 p-8 md:p-12">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm border border-white/10">
                                    {stats.level}
                                </span>
                                {stats.streak > 0 && (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 text-xs font-bold backdrop-blur-sm border border-orange-500/30">
                                        <FireIcon className="w-3 h-3" /> {stats.streak} Day Streak!
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                                Welcome back, {user?.username || 'Scholar'}! 🎉
                            </h1>
                            <p className="text-primary-100 text-lg max-w-2xl leading-relaxed">
                                Master <span className="font-bold text-white">{user?.target_language === 'de' ? 'German' : 'your target language'}</span> through
                                smart spaced repetition and daily practice.
                            </p>
                        </div>

                        {/* Primary CTA - Conditional based on review status */}
                        {hasReviewsToday ? (
                            <Link
                                to="/quiz/play/flashcard?hlr=true"
                                className="group flex flex-col items-center gap-2 px-8 py-6 bg-white text-primary-900 rounded-2xl font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all min-w-[200px]"
                            >
                                <div className="flex items-center gap-2">
                                    <FireIcon className="w-6 h-6 text-orange-500 group-hover:animate-pulse" />
                                    <span className="text-3xl font-black">{stats.needsReview}</span>
                                </div>
                                <span className="text-sm text-slate-600">Words Ready to Master</span>
                                <div className="flex items-center gap-2 text-primary-600 mt-2">
                                    <PlayIcon className="w-5 h-5" />
                                    <span>Start Review</span>
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ) : (
                            <Link
                                to="/vocab/add"
                                className="group flex items-center gap-3 px-6 py-4 bg-white text-primary-900 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                                <PlusIcon className="w-6 h-6 text-primary-600" />
                                <span>Add New Words</span>
                                <ArrowRightIcon className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>

                    {/* All Caught Up Message */}
                    {!hasReviewsToday && stats.totalWords > 0 && (
                        <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                            <p className="text-green-100 font-medium">
                                ✅ All caught up! Amazing work. Your brain is processing everything perfectly.
                                Come back tomorrow for your next review session.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid with Skeleton Loaders */}
            <motion.div variants={item} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    <>
                        <SkeletonStatCard />
                        <SkeletonStatCard />
                        <SkeletonStatCard />
                        <SkeletonStatCard />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Words Learned"
                            value={stats.totalWords}
                            icon={BookOpenIcon}
                            color="text-blue-600"
                            bg="bg-blue-50"
                            trend={stats.wordsAddedThisWeek > 0 ? `🔥 +${stats.wordsAddedThisWeek} this week` : 'Add more words'}
                            trendPositive={stats.wordsAddedThisWeek > 0}
                        />
                        <StatCard
                            label="Practice Sessions"
                            value={stats.quizzesTaken}
                            icon={AcademicCapIcon}
                            color="text-purple-600"
                            bg="bg-purple-50"
                            trend={stats.quizzesThisWeek > 0 ? `✨ +${stats.quizzesThisWeek} this week` : 'Start practicing'}
                            trendPositive={stats.quizzesThisWeek > 0}
                        />
                        <StatCard
                            label="Day Streak"
                            value={stats.streak}
                            icon={FireIcon}
                            color="text-orange-600"
                            bg="bg-orange-50"
                            trend={stats.streak > 7 ? "On fire! 🚀" : stats.streak > 0 ? "Keep it up!" : "Start today!"}
                            trendPositive={stats.streak > 0}
                        />
                        <StatCard
                            label="Mastery Level"
                            value={stats.level.split(' - ')[0]}
                            subValue={stats.level.split(' - ')[1]}
                            icon={TrophyIcon}
                            color="text-yellow-600"
                            bg="bg-yellow-50"
                            trend="See your journey"
                            onClick={() => setShowMastery(!showMastery)}
                            isClickable={true}
                            isOpen={showMastery}
                        />
                    </>
                )}
            </motion.div>

            {/* Mastery Details Section (Expandable) */}
            <AnimatePresence>
                {showMastery && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <VocabularyMastery />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Insights Section */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkillRadarChart data={skills} />
                <CoachWidget />
            </motion.div>

            {/* Personalized Action Plan */}
            <motion.div variants={item}>
                <RecommendationList />
            </motion.div>

            {/* Quick Actions - Moved Higher */}
            <motion.div variants={item} className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-primary-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ActionCard
                        to="/vocab/add"
                        title="✨ Add New Word"
                        desc="Expand your vocabulary"
                        icon={PlusIcon}
                        color="bg-primary-500"
                    />
                    <ActionCard
                        to="/quiz/play/flashcard?hlr=true"
                        title="🎯 Practice Now"
                        desc={hasReviewsToday ? `${stats.needsReview} words ready` : "Review your words"}
                        icon={PlayIcon}
                        color="bg-green-500"
                    />
                    <ActionCard
                        to="/exams"
                        title="🤖 AI Challenge"
                        desc="Test your knowledge"
                        icon={SparklesIcon}
                        color="bg-purple-500"
                    />
                </div>
            </motion.div>

            {/* Activity Heatmap */}
            <motion.div variants={item}>
                <ActivityHeatmap activityLog={stats.activityLog || {}} />
            </motion.div>

            {/* Daily Tip */}
            <motion.div variants={item}>
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full -mr-12 -mt-12 opacity-50" />

                    <h3 className="text-lg font-bold text-indigo-900 mb-4 relative z-10">💡 Daily Learning Tip</h3>
                    <p className="text-indigo-700 text-sm leading-relaxed mb-6 relative z-10">
                        "Spaced repetition is your secret weapon. Reviewing words just as you're about to forget them
                        strengthens your memory pathways by up to 200%. That's why we show you words at the perfect moment!"
                    </p>

                    <Link
                        to="/quiz"
                        className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors relative z-10"
                    >
                        Explore practice modes <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Skeleton Loader Component
function SkeletonStatCard() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                <div className="w-20 h-6 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="space-y-2">
                <div className="w-16 h-8 bg-slate-200 rounded"></div>
                <div className="w-24 h-4 bg-slate-200 rounded"></div>
            </div>
        </div>
    );
}

function StatCard({ label, value, subValue, icon: Icon, color, bg, trend, onClick, isClickable, isOpen, trendPositive = true }) {
    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl p-6 shadow-soft border border-slate-100 transition-all duration-300 group ${isClickable ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : 'hover:shadow-lg'}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${trendPositive
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {trend}
                    </span>
                    {isClickable && (
                        isOpen ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-extrabold text-slate-900 mb-1 flex items-baseline gap-2">
                    {value}
                    {subValue && <span className="text-sm font-medium text-slate-400">{subValue}</span>}
                </h3>
                <p className="text-sm font-medium text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function ActionCard({ to, title, desc, icon: Icon, color }) {
    return (
        <Link
            to={to}
            className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-soft border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`} />

            <div className="relative z-10 flex items-center gap-4">
                <div className={`p-4 rounded-xl ${color} text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{title}</h3>
                    <p className="text-sm text-slate-500">{desc}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <ArrowRightIcon className="w-5 h-5 text-slate-300" />
                </div>
            </div>
        </Link>
    );
}

export default Dashboard;
