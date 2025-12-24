import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, BookOpen, ChevronRight, GraduationCap,
    RefreshCw
} from 'lucide-react';
import { getEnrolledClassrooms } from '../../api';

// Skeleton loader for classroom card
const ClassroomSkeleton = () => (
    <div className="bg-[#1C1C1F] rounded-xl p-4 border border-[#27272A] animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div className="h-6 bg-[#27272A] rounded w-2/3" />
            <div className="w-5 h-5 bg-[#27272A] rounded" />
        </div>
        <div className="h-4 bg-[#27272A] rounded w-full mb-3" />
        <div className="flex gap-4">
            <div className="h-4 bg-[#27272A] rounded w-24" />
            <div className="h-4 bg-[#27272A] rounded w-20" />
        </div>
        <div className="mt-4">
            <div className="h-1.5 bg-[#27272A] rounded-full w-full" />
        </div>
    </div>
);

// Offline caching utility
const CACHE_KEY = 'cached_my_classrooms';
const cacheClassrooms = (data) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) { /* ignore */ }
};
const getCachedClassrooms = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache valid for 1 hour
            if (Date.now() - timestamp < 3600000) return data;
        }
    } catch (e) { /* ignore */ }
    return null;
};

const MobileMyClasses = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classrooms, setClassrooms] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        // Try cache first for instant display
        const cached = getCachedClassrooms();
        if (cached) {
            setClassrooms(cached);
            setLoading(false);
        }
        loadClassrooms();
    }, []);

    const loadClassrooms = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await getEnrolledClassrooms();
            setClassrooms(res.data);
            cacheClassrooms(res.data);
            setError('');
        } catch (err) {
            console.error('Failed to load classrooms:', err);
            // Fallback to cache on error
            const cached = getCachedClassrooms();
            if (cached) {
                setClassrooms(cached);
            } else {
                setError('Failed to load. Pull down to retry.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Pull-to-refresh handler
    const handleRefresh = useCallback(() => {
        loadClassrooms(true);
    }, []);

    return (
        <div className="min-h-screen bg-[#09090B] text-white pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 pt-14 bg-[#09090B] sticky top-0 z-10 border-b border-[#27272A]"
            >
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-2xl font-bold">My Classes</h1>
                    <div className="flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2.5 rounded-full bg-[#1C1C1F] border border-[#27272A] min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/m/join-class')}
                            className="bg-indigo-600 text-white p-2.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
                <p className="text-gray-400 text-sm">Manage your enrolled courses</p>
            </motion.div>

            <div className="p-5">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {loading && classrooms.length === 0 ? (
                    <div className="space-y-3 mt-2">
                        {[1, 2, 3].map(i => <ClassroomSkeleton key={i} />)}
                    </div>
                ) : classrooms.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 bg-[#1C1C1F] rounded-2xl border border-[#27272A] border-dashed mt-4"
                    >
                        <div className="bg-[#27272A] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-gray-300 font-medium mb-1">No classes yet</h3>
                        <p className="text-gray-500 text-sm mb-6 px-6">
                            Join a classroom using an invite code from your teacher.
                        </p>
                        <button
                            onClick={() => navigate('/m/join-class')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-900/20 min-h-[48px]"
                        >
                            Join a Class
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-3 mt-2">
                        <AnimatePresence>
                            {classrooms.map((classroom, idx) => (
                                <motion.div
                                    key={classroom.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => navigate(`/m/class/${classroom.id}`)}
                                    className="bg-[#1C1C1F] rounded-xl p-4 border border-[#27272A] active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group min-h-[120px]"
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 opacity-0 group-active:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-white">{classroom.name}</h3>
                                        <ChevronRight className="w-5 h-5 text-gray-500 group-active:text-indigo-400 transition-colors" />
                                    </div>

                                    <p className="text-gray-400 text-sm mb-3 line-clamp-1">{classroom.description}</p>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-[#27272A] flex items-center justify-center text-[10px] font-bold text-gray-300">
                                                {classroom.teacher_name?.[0]?.toUpperCase()}
                                            </div>
                                            <span>{classroom.teacher_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>{classroom.level} • {classroom.language?.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-400">Progress</span>
                                            <span className="text-indigo-400 font-medium">0%</span>
                                        </div>
                                        <div className="h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full w-0" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileMyClasses;
