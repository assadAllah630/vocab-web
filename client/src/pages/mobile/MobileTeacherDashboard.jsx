import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, BookOpen, GraduationCap, Bell, Plus,
    ChevronRight, Activity, TrendingUp, AlertCircle, Clock, Calendar, Layout, Swords
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Chip, Avatar, AvatarGroup } from '@heroui/react';
import { getDashboardOverview, getMyClassrooms } from '../../api';

const MobileTeacherDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Stats Logic
    const {
        classroom_count = 0,
        total_students = 0,
        pending_requests = 0,
        pending_grading = 0,
        new_submissions_week = 0,
        active_sessions_count = 0
    } = stats || {};

    // Actions Logic
    const hasActions = pending_requests > 0 || pending_grading > 0;
    const activeSessions = classrooms.filter(c => c.is_active_session);

    useEffect(() => {
        loadData();
        // Poll for "Pulse" updates every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, classRes] = await Promise.all([
                getDashboardOverview(),
                getMyClassrooms()
            ]);
            setStats(statsRes.data);
            setClassrooms(classRes.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative pb-24">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[5000ms]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-pink-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Header */}
            <div className="relative z-20 px-6 pt-12 pb-6 flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Command<br />Center
                    </h1>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                        Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, {user.username}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 relative">
                        <Bell size={18} className="text-gray-300" />
                        {hasActions && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        )}
                    </button>
                    <Avatar
                        src={user.avatar}
                        name={user.username?.charAt(0)}
                        className="w-10 h-10 border border-white/10"
                        isBordered
                        color="primary"
                        onClick={() => navigate('/m/teacher/profile')}
                    />
                </div>
            </div>

            <div className="relative z-10 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* 1. Alerts Section (Conditional) */}
                {hasActions && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                            {pending_requests > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 min-w-[200px] snap-center flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                        <Users size={18} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-amber-500 text-sm">Join Requests</div>
                                        <div className="text-xs text-amber-200/60">{pending_requests} students waiting</div>
                                    </div>
                                </div>
                            )}
                            {pending_grading > 0 && (
                                <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 min-w-[200px] snap-center flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                                        <BookOpen size={18} className="text-pink-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-pink-500 text-sm">Needs Grading</div>
                                        <div className="text-xs text-pink-200/60">{pending_grading} submissions</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* 2. Studio Entry Point */}
                {/* 2. Paths Entry Point (Swapped from Studio) */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/m/paths')}
                    className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl shadow-xl shadow-indigo-500/20 relative overflow-hidden group cursor-pointer"
                >
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-xl text-white">Learning Paths</h3>
                            <p className="text-indigo-100 text-xs font-medium mt-1">
                                Explore and assign curriculum to your classes
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10">
                                    BROWSE PATHS
                                </span>
                            </div>
                        </div>
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Swords className="text-white" size={28} />
                        </div>
                    </div>
                </motion.div>

                {/* 3. Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#121215] p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-indigo-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
                        <Users size={24} className="text-indigo-400 mb-3" />
                        <div className="text-3xl font-black text-white">{total_students}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Total Students</div>
                    </div>
                    <div className="bg-[#121215] p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-green-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
                        <Activity size={24} className="text-green-400 mb-3" />
                        <div className="text-3xl font-black text-white">{active_sessions_count}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Live Now</div>
                    </div>
                </div>

                {/* 3. Your Classrooms */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <GraduationCap size={20} className="text-gray-400" />
                            Classrooms
                        </h2>
                        <Button
                            size="sm"
                            variant="light"
                            className="font-bold text-indigo-400"
                            onPress={() => navigate('/m/teacher/classes')}
                        >
                            See All
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {classrooms.slice(0, 3).map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 + 0.2 }}
                            >
                                <Card
                                    isPressable
                                    onPress={() => navigate(`/m/classroom/${c.id}`)}
                                    className="w-full bg-[#18181b]/60 backdrop-blur-md border border-white/5 p-0 overflow-hidden group rounded-[24px]"
                                >
                                    <div className="relative h-24 bg-gradient-to-r from-indigo-900 to-purple-900 border-b border-white/5 p-4 flex justify-between items-start">
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        <div className="relative z-10">
                                            <Chip size="sm" classNames={{ base: "bg-white/10 border border-white/20", content: "font-bold text-white text-[10px] uppercase" }}>
                                                {c.code || "No Code"}
                                            </Chip>
                                        </div>
                                        {c.is_active_session && (
                                            <div className="relative z-10 px-2 py-1 bg-red-500 rounded-lg animate-pulse">
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">LIVE</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 pt-2">
                                        <div className="-mt-8 mb-3">
                                            <div className="w-14 h-14 rounded-2xl bg-[#18181b] p-1 shadow-xl">
                                                <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-xl">
                                                    {c.name.charAt(0)}
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1">{c.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                                            <span>{c.student_count} Students</span>
                                            <span>•</span>
                                            <span>{c.language_name}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-[#18181b]" />)}
                                            </div>
                                            <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Create New CTA */}
                        <Button
                            className="w-full h-16 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-[24px] text-gray-400 hover:text-white font-bold flex flex-col gap-1 items-center justify-center group transition-all"
                            onPress={() => navigate('/m/classroom/create')}
                        >
                            <Plus size={24} className="group-hover:scale-110 transition-transform text-indigo-500" />
                            <span>Create New Classroom</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileTeacherDashboard;
