import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, TrendingUp, CheckCircle, Clock,
    AlertCircle, BookOpen, Award
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentPerformance } from '../../api';

const MobileStudentInsight = () => {
    const navigate = useNavigate();
    const { classroomId, studentId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [classroomId, studentId]);

    const loadData = async () => {
        try {
            const res = await getStudentPerformance(classroomId, studentId);
            setData(res.data);
        } catch (error) {
            console.error('Failed to load student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'graded': return 'text-green-400';
            case 'submitted': return 'text-blue-400';
            case 'in_progress': return 'text-amber-400';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'graded': return <CheckCircle size={14} className="text-green-400" />;
            case 'submitted': return <Clock size={14} className="text-blue-400" />;
            case 'in_progress': return <TrendingUp size={14} className="text-amber-400" />;
            default: return <AlertCircle size={14} className="text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 text-white">
                <AlertCircle size={48} className="text-gray-600 mb-4" />
                <p className="text-gray-400">Student not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-sm"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { student, stats, assignments } = data;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0B] z-10 p-4 border-b border-[#27272A]">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-[#1C1C1F] rounded-lg">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg">{student.username}</h1>
                        <p className="text-xs text-gray-400">Student Performance</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-xl"
                    >
                        <Award size={24} className="mb-2 opacity-80" />
                        <div className="text-3xl font-bold">{stats.average_score}%</div>
                        <div className="text-xs opacity-80">Average Score</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A]"
                    >
                        <TrendingUp size={24} className="mb-2 text-green-400" />
                        <div className="text-3xl font-bold">{stats.completion_rate}%</div>
                        <div className="text-xs text-gray-400">Completion Rate</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A]"
                    >
                        <CheckCircle size={24} className="mb-2 text-blue-400" />
                        <div className="text-3xl font-bold">{stats.completed}</div>
                        <div className="text-xs text-gray-400">Completed</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A]"
                    >
                        <BookOpen size={24} className="mb-2 text-amber-400" />
                        <div className="text-3xl font-bold">{stats.total_assignments}</div>
                        <div className="text-xs text-gray-400">Total Assigned</div>
                    </motion.div>
                </div>

                {/* Assignment History */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-400 mb-3">Assignment History</h2>
                    <div className="space-y-2">
                        {assignments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No assignments yet</p>
                        ) : (
                            assignments.map((assignment) => (
                                <motion.div
                                    key={assignment.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-3 bg-[#1C1C1F] rounded-xl border border-[#27272A]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {getStatusIcon(assignment.status)}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{assignment.title}</p>
                                            <p className="text-xs text-gray-500 capitalize">{assignment.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {assignment.score !== null ? (
                                            <span className="text-lg font-bold text-green-400">{assignment.score}%</span>
                                        ) : (
                                            <span className={`text-xs capitalize ${getStatusColor(assignment.status)}`}>
                                                {assignment.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileStudentInsight;
