import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import {
    BookOpenIcon,
    AcademicCapIcon,
    FireIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

function StatsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('stats/');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!stats) return null;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
        >
            <motion.div variants={item}>
                <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <ChartBarIcon className="w-8 h-8 text-primary-600" />
                    Your Progress
                </h2>
                <p className="mt-2 text-slate-600">Detailed breakdown of your learning journey.</p>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Words"
                    value={stats.total_words}
                    icon={BookOpenIcon}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    label="Mastered"
                    value={stats.mastered_words}
                    icon={AcademicCapIcon}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <StatCard
                    label="Learning"
                    value={stats.learning_words}
                    icon={ArrowTrendingUpIcon}
                    color="text-yellow-600"
                    bg="bg-yellow-50"
                />
                <StatCard
                    label="Day Streak"
                    value={stats.streak}
                    icon={FireIcon}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
            </motion.div>

            {/* Future Charts Section */}
            <motion.div variants={item} className="bg-white shadow-soft rounded-2xl border border-slate-100 p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Activity History</h3>
                <div className="h-64 flex flex-col items-center justify-center bg-surface-50 rounded-xl border-2 border-dashed border-surface-200 text-surface-400 gap-4">
                    <ChartBarIcon className="w-12 h-12 opacity-50" />
                    <span className="font-medium">Detailed analytics visualization coming soon...</span>
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-white overflow-hidden shadow-soft rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center">
                <div className={`flex-shrink-0 ${bg} rounded-xl p-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">{label}</dt>
                        <dd className="text-3xl font-bold text-slate-900">{value}</dd>
                    </dl>
                </div>
            </div>
        </div>
    );
}

export default StatsDashboard;
