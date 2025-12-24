import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getMyAssignments, getEnrolledClassrooms, getPaths, getMyPathProgress } from '../../api';
import {
    Plus, Play, Sparkles, BookOpen, TrendingUp, ChevronRight,
    Zap, Trophy, Target, Star, Bell, Map, Calendar, ArrowRight, Mic, BookText, Users, Globe
} from 'lucide-react';
import { AnimatedIcon } from '../../components/AnimatedIcons';
import streakFlame from '../../assets/streak-flame.png';
import { statsStorage, vocabStorage, useOnlineStatus } from '../../utils/offlineStorage';
import { useTranslation } from '../../hooks/useTranslation';

function MobileHome({ user }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [hasActiveClasses, setHasActiveClasses] = useState(false);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [totalWords, setTotalWords] = useState(0);
    const [assignments, setAssignments] = useState([]);
    const [activePath, setActivePath] = useState(null);
    const [liveClassrooms, setLiveClassrooms] = useState([]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            // 1. Fetch Stats (Streak) - Everyone sees this
            const statsRes = await api.get('stats/');
            setStreak(statsRes.data.streak || 0);
            setTotalWords(statsRes.data.total_words || 0);

            // 2. Check Class Enrollment Status
            const classRes = await getEnrolledClassrooms();
            const enrolledClasses = classRes.data || [];
            const isStudent = enrolledClasses.length > 0;
            setHasActiveClasses(isStudent);

            // 3. Fetch Assignments (For everyone, returns empty if none)
            try {
                const assignRes = await getMyAssignments();
                setAssignments(assignRes.data.filter(a => a.user_progress?.status !== 'submitted' && a.user_progress?.status !== 'graded'));
            } catch (e) {
                console.log("No assignments or error", e);
            }

            // 4. Fetch Active Path (Prioritize Class Path, but load for everyone)
            let primaryPathId = localStorage.getItem('lastPathId');
            let primaryClassroom = null;

            const classWithPath = enrolledClasses.find(c => c.linked_path);
            if (classWithPath) {
                primaryPathId = classWithPath.linked_path;
                primaryClassroom = classWithPath;
            }

            if (primaryPathId) {
                try {
                    const pathRes = await api.get(`/paths/${primaryPathId}/`);
                    let progressData = null;

                    if (primaryClassroom) {
                        try {
                            const { getClassPathProgress } = await import('../../api');
                            const cpRes = await getClassPathProgress(primaryClassroom.id);
                            progressData = cpRes.data;

                            // Calculate percent for dashboard
                            const total = progressData.total_nodes || 1;
                            const completed = progressData.completed_nodes || 0;
                            progressData.progress_percent = (completed / total) * 100;
                        } catch (err) {
                            console.error("Failed to load class progress", err);
                        }
                    } else {
                        const progRes = await getMyPathProgress(primaryPathId);
                        progressData = progRes.data;
                    }

                    setActivePath({
                        ...pathRes.data,
                        userProgress: progressData,
                        isClassPath: !!primaryClassroom,
                        classroomName: primaryClassroom?.name
                    });
                } catch (e) {
                    console.log("Could not load last path", e);
                }
            }

            // Live Sessions
            const activeClasses = enrolledClasses.filter(c => c.is_active_session);
            setLiveClassrooms(activeClasses);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Skeleton Loader
    const DashboardSkeleton = () => (
        <div className="min-h-screen bg-[#09090B] pb-24 px-5 pt-14">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="w-24 h-4 bg-[#27272A] rounded animate-pulse" />
                    <div className="w-32 h-6 bg-[#27272A] rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#27272A] animate-pulse" />
            </div>

            {/* Hero Skeleton */}
            <div className="w-full h-48 rounded-2xl bg-[#27272A] mb-8 animate-pulse" />

            {/* Rail Skeleton */}
            <div className="flex gap-4 mb-8 overflow-hidden">
                <div className="w-48 h-32 rounded-xl bg-[#27272A] shrink-0 animate-pulse" />
                <div className="w-48 h-32 rounded-xl bg-[#27272A] shrink-0 animate-pulse" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-xl bg-[#27272A] animate-pulse" />
                <div className="h-24 rounded-xl bg-[#27272A] animate-pulse" />
                <div className="h-24 rounded-xl bg-[#27272A] animate-pulse" />
                <div className="h-24 rounded-xl bg-[#27272A] animate-pulse" />
            </div>
        </div>
    );

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-[#09090B] pb-24">

            {/* Header */}
            <header className="px-5 pt-14 pb-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400">Welcome back,</p>
                    <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[#1C1C1F] px-3 py-1.5 rounded-full border border-[#27272A]">
                        <BookOpen size={14} className="text-emerald-400" />
                        <span className="text-sm font-bold text-white">{totalWords}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#1C1C1F] px-3 py-1.5 rounded-full border border-[#27272A]">
                        <img src={streakFlame} className="w-4 h-4" alt="Streak" />
                        <span className="text-sm font-bold text-orange-400">{streak}</span>
                    </div>
                    <button onClick={() => navigate('/m/me')} className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {user?.username?.[0]?.toUpperCase()}
                    </button>
                </div>
            </header>

            {/* LIVE SESSIONS BANNER (Class Only) */}
            <AnimatePresence>
                {hasActiveClasses && liveClassrooms.length > 0 && (
                    <div className="px-5 mb-6 space-y-3">
                        {liveClassrooms.map(c => (
                            <motion.div
                                key={c.id}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/m/game/lobby?joinCode=${c.invite_code}`)} // Defaulting to game lobby for now, or session list
                                className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-4 shadow-lg shadow-red-900/20 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                                            <Zap size={20} className="text-white fill-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-white text-lg leading-none">LIVE SESSION</h3>
                                                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-bold text-white uppercase">Now</span>
                                            </div>
                                            <p className="text-red-100 text-xs font-medium mt-1">{c.name} is live!</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <ChevronRight size={20} className="text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* HERO: Active Learning Path (For Everyone) */}
            <div className="px-5 mb-8">
                <SectionHeader title={activePath?.isClassPath ? `${activePath.classroomName} Focus` : "My Learning Path"} action="View All" onAction={() => navigate('/m/paths')} />

                {activePath ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/m/path/${activePath.id}`)}
                        className={`border rounded-2xl p-5 relative overflow-hidden ${activePath.isClassPath
                                ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30'
                                : 'bg-gradient-to-br from-[#1C1C1F] to-[#27272A] border-[#3F3F46]'
                            }`}
                    >
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                            <div className="h-full bg-indigo-400" style={{ width: `${activePath.userProgress?.progress_percent || activePath.userProgress?.percent_complete || 0}%` }} />
                        </div>

                        <div className="relative z-10">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${activePath.isClassPath ? 'bg-indigo-500/20 text-indigo-300' : 'bg-green-500/10 text-green-400'
                                }`}>
                                <Map size={12} />
                                {activePath.isClassPath ? 'Class Curriculum' : 'Personal Path'}
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{activePath.title}</h2>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-1">{activePath.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-400">
                                    <span className="text-white font-bold">{Math.round(activePath.userProgress?.progress_percent || activePath.userProgress?.percent_complete || 0)}%</span> complete
                                </div>
                                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                                    Continue
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div onClick={() => navigate('/m/paths')} className="bg-[#1C1C1F] border border-dashed border-gray-700 rounded-2xl p-6 text-center">
                        <Map className="mx-auto text-gray-500 mb-2" />
                        <p className="text-gray-400 text-sm">Start a new learning journey!</p>
                        <button className="mt-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">Browse Paths</button>
                    </div>
                )}
            </div>

            {/* COMMUNITY / CLASSROOMS (New Section) */}
            <div className="px-5 mb-8">
                <SectionHeader title="Community" />
                <div className="grid grid-cols-2 gap-3">
                    <QuickAction
                        icon={Users}
                        title={hasActiveClasses ? "My Classes" : "Join Class"}
                        desc={hasActiveClasses ? "View classrooms" : "Find a community"}
                        color="text-pink-400"
                        bg="bg-pink-500/10"
                        onClick={() => navigate('/m/classes')}
                    />
                    {/* 2nd button could be something else or create class if teacher */}
                    {!hasActiveClasses && (
                        <QuickAction
                            icon={Globe}
                            title="Browse"
                            desc="Public groups"
                            color="text-blue-400"
                            bg="bg-blue-500/10"
                            onClick={() => navigate('/m/classes')}
                        />
                    )}
                    {user?.is_teacher && (
                        <QuickAction
                            icon={Plus}
                            title="Create Class"
                            desc="Start teaching"
                            color="text-emerald-400"
                            bg="bg-emerald-500/10"
                            onClick={() => navigate('/m/classroom/create')}
                        />
                    )}
                </div>
            </div>

            {/* TEACHER DASHBOARD ACCESS */}
            {user?.is_teacher && (
                <div className="px-5 mb-8">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/m/teacher/dashboard')}
                        className="w-full bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Trophy size={24} className="text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white text-lg">Teacher Dashboard</h3>
                                <p className="text-emerald-200/60 text-xs">Manage classes & assignments</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center relative z-10">
                            <ChevronRight size={20} className="text-emerald-400" />
                        </div>
                    </motion.button>
                </div>
            )}

            {/* Assignments Rail */}
            {assignments.length > 0 && (
                <div className="mb-8">
                    <div className="px-5 mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Assignments</h3>
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">{assignments.length}</span>
                    </div>

                    <div className="overflow-x-auto px-5 pb-4 flex gap-4 no-scrollbar snap-x">
                        {assignments.map(assignment => (
                            <motion.button
                                key={assignment.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/m/assignment/${assignment.id}/do`)}
                                className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-4 min-w-[200px] snap-center text-left"
                            >
                                <Calendar size={16} className="text-orange-400 mb-2" />
                                <h4 className="font-bold text-white text-sm line-clamp-1">{assignment.title}</h4>
                                <p className="text-gray-500 text-[10px] mb-3">{assignment.classroom_name}</p>
                                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                    <div className="bg-orange-400 h-full w-1/3" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Practice Grid */}
            <div className="px-5">
                <SectionHeader title="Quick Practice" />
                <div className="grid grid-cols-2 gap-3">
                    <QuickAction
                        icon={Sparkles}
                        title="Flashcards"
                        desc="Review words"
                        color="text-indigo-400"
                        bg="bg-indigo-500/10"
                        onClick={() => navigate('/m/practice/flashcard?hlr=true')}
                    />
                    <QuickAction
                        icon={BookText}
                        title="My Words"
                        desc="Vocabulary List"
                        color="text-amber-400"
                        bg="bg-amber-500/10"
                        onClick={() => navigate('/m/words')}
                    />
                    <QuickAction
                        icon={Mic}
                        title="Studio"
                        desc="Record & Create"
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                        onClick={() => navigate('/m/podcast-studio')}
                    />
                    <QuickAction
                        icon={BookOpen}
                        title="Library"
                        desc="Browse Content"
                        color="text-emerald-400"
                        bg="bg-emerald-500/10"
                        onClick={() => navigate('/m/ai/library')}
                    />
                </div>
            </div>

        </div>
    );
}

// Subcomponents for cleanliness
const SectionHeader = ({ title, action, onAction }) => (
    <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
        {action && (
            <button onClick={onAction} className="text-xs text-indigo-400 font-semibold hover:text-indigo-300">
                {action}
            </button>
        )}
    </div>
);

const QuickAction = ({ icon: Icon, title, desc, color, bg, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="bg-[#1C1C1F] border border-[#27272A] p-4 rounded-xl flex items-start flex-col gap-3 text-left hover:bg-[#27272A] transition-colors"
    >
        <div className={`p-2 rounded-lg ${bg}`}>
            <Icon size={20} className={color} />
        </div>
        <div>
            <h4 className="font-bold text-white text-sm">{title}</h4>
            <p className="text-[10px] text-gray-500">{desc}</p>
        </div>
    </motion.button>
);

export default MobileHome;
