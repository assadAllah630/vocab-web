import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, GraduationCap, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClassroomAssignments } from '../../api';

const MobileClassAssignments = () => {
    const { id: classroomId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed

    useEffect(() => {
        loadAssignments();
    }, [classroomId]);

    const loadAssignments = async () => {
        try {
            const res = await getClassroomAssignments(classroomId);
            setAssignments(res.data);
        } catch (error) {
            console.error('Failed to load assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (assign) => {
        if (!assign.my_progress) return 'not_started';
        return assign.my_progress.status;
    };

    const filteredAssignments = assignments.filter(a => {
        const status = getStatus(a);
        if (filter === 'all') return true;
        if (filter === 'pending') return ['not_started', 'in_progress'].includes(status);
        if (filter === 'completed') return ['submitted', 'graded'].includes(status);
        return true;
    });

    return (
        <div className="min-h-screen bg-[#18181B] pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#18181B]/80 backdrop-blur-md border-b border-[#3F3F46] p-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold">Assignments</h1>
            </div>

            {/* Filters */}
            <div className="flex p-4 gap-2 overflow-x-auto">
                {['all', 'pending', 'completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-[#27272A] text-gray-400 border border-[#3F3F46]'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="px-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No assignments found</p>
                    </div>
                ) : (
                    filteredAssignments.map(assign => {
                        const status = getStatus(assign);
                        const progress = assign.my_progress;

                        return (
                            <motion.button
                                key={assign.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/m/assignment/${assign.id}/view`)}
                                className="w-full bg-[#27272A] rounded-xl p-4 border border-[#3F3F46] text-left relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <Badge status={status} score={progress?.score} />
                                </div>

                                <h3 className="font-bold text-lg mb-1">{assign.title}</h3>
                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>Due: {new Date(assign.due_date).toLocaleDateString()}</span>
                                </div>
                            </motion.button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const Badge = ({ status, score }) => {
    if (status === 'graded') {
        return (
            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20">
                Score: {score}%
            </div>
        );
    }
    if (status === 'submitted') {
        return (
            <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                Submitted
            </div>
        );
    }
    if (status === 'in_progress') {
        return (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20">
                In Progress
            </div>
        );
    }
    return (
        <div className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-bold border border-gray-500/20">
            To Do
        </div>
    );
};

export default MobileClassAssignments;
