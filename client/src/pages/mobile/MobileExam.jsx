import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { useExam } from '../../context/ExamContext';
import {
    ChevronLeft,
    Plus,
    Clock,
    Trophy,
    Users,
    Play,
    RotateCcw,
    Eye,
    Trash2,
    Globe,
    Lock,
    Sparkles,
    Brain
} from 'lucide-react';
import { AnimatedIcon } from '../../components/AnimatedIcons';

function MobileExam() {
    const navigate = useNavigate();
    const { activeExam, isExamActive } = useExam();
    const [activeTab, setActiveTab] = useState('new');
    const [history, setHistory] = useState([]);
    const [communityExams, setCommunityExams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
        else if (activeTab === 'community') fetchCommunityExams();
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('exams/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCommunityExams = async () => {
        setLoading(true);
        try {
            const res = await api.get('exams/community/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setCommunityExams(data);
        } catch (err) {
            console.error("Failed to fetch community exams:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (examId) => {
        if (!window.confirm('Delete this exam?')) return;
        try {
            await api.delete(`exams/${examId}/`);
            setHistory(prev => prev.filter(e => e.id !== examId));
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const toggleVisibility = async (examId, isPublic) => {
        try {
            await api.patch(`exams/${examId}/`, { is_public: !isPublic });
            setHistory(prev => prev.map(e =>
                e.id === examId ? { ...e, is_public: !isPublic } : e
            ));
        } catch (err) {
            console.error("Failed to toggle visibility:", err);
        }
    };

    const tabs = [
        { id: 'new', label: 'New', icon: Plus },
        { id: 'history', label: 'History', icon: Clock },
        { id: 'community', label: 'Community', icon: Users }
    ];

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 px-5 pt-4 pb-3" style={{ backgroundColor: '#09090B' }}>
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/practice')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>
                    <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>AI Quiz</h1>
                    <div className="w-10" />
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl p-1" style={{ backgroundColor: '#141416' }}>
                    {tabs.map(tab => (
                        <motion.button
                            key={tab.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
                            style={{
                                backgroundColor: activeTab === tab.id ? '#27272A' : 'transparent',
                                color: activeTab === tab.id ? '#FAFAFA' : '#71717A'
                            }}
                        >
                            <tab.icon size={16} />
                            <span className="text-sm font-medium">{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'new' && (
                    <motion.div
                        key="new"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="px-5 py-4"
                    >
                        {/* Active Exam Banner */}
                        {isExamActive && activeExam && (
                            <motion.button
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/m/exam/play')}
                                className="w-full mb-6 p-4 rounded-2xl flex items-center gap-4"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Play size={24} color="#FFFFFF" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-white font-bold">Exam in Progress</p>
                                    <p className="text-white/80 text-sm">Tap to continue</p>
                                </div>
                                <ChevronLeft size={24} color="#FFFFFF" className="rotate-180" />
                            </motion.button>
                        )}

                        {/* Create New Exam Card */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/m/exam/create')}
                            className="w-full rounded-2xl p-6 mb-4 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
                                <Brain size={128} />
                            </div>
                            <div className="relative z-10 text-left">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                                    <Sparkles size={28} color="#FFFFFF" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Generate AI Exam</h2>
                                <p className="text-white/80 text-sm">
                                    Create a custom exam with AI-generated questions
                                </p>
                            </div>
                        </motion.button>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {[
                                { icon: Brain, title: 'Smart Questions', desc: 'AI-powered' },
                                { icon: Clock, title: 'Timed Exams', desc: 'Track progress' },
                                { icon: Trophy, title: 'Score Tracking', desc: 'See results' },
                                { icon: Users, title: 'Community', desc: 'Share & discover' }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="p-4 rounded-xl"
                                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                                >
                                    <feature.icon size={24} style={{ color: '#6366F1' }} className="mb-2" />
                                    <h3 className="font-semibold text-sm" style={{ color: '#FAFAFA' }}>{feature.title}</h3>
                                    <p className="text-xs" style={{ color: '#71717A' }}>{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-5 py-4 space-y-3"
                    >
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
                                />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock size={48} style={{ color: '#3F3F46' }} className="mx-auto mb-4" />
                                <p className="font-medium" style={{ color: '#71717A' }}>No exams yet</p>
                                <p className="text-sm" style={{ color: '#52525B' }}>Generate your first AI exam</p>
                            </div>
                        ) : (
                            history.map((exam, i) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="rounded-xl p-4"
                                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>{exam.topic}</h3>
                                            <p className="text-xs" style={{ color: '#71717A' }}>
                                                {new Date(exam.updated_at || exam.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="px-2 py-1 rounded-md text-xs font-bold"
                                                style={{
                                                    backgroundColor: (exam.best_score || 0) >= 80 ? 'rgba(34, 197, 94, 0.2)' : (exam.best_score || 0) >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: (exam.best_score || 0) >= 80 ? '#22C55E' : (exam.best_score || 0) >= 50 ? '#F59E0B' : '#EF4444'
                                                }}
                                            >
                                                {exam.best_score || 0}%
                                            </span>
                                            <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: '#27272A', color: '#71717A' }}>
                                                {exam.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => navigate(`/m/exam/review/${exam.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg"
                                            style={{ backgroundColor: '#27272A' }}
                                        >
                                            <Eye size={16} color="#A1A1AA" />
                                            <span className="text-sm font-medium" style={{ color: '#A1A1AA' }}>Review</span>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => navigate(`/m/exam/retake/${exam.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg"
                                            style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                                        >
                                            <RotateCcw size={16} color="#6366F1" />
                                            <span className="text-sm font-medium" style={{ color: '#6366F1' }}>Retake</span>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => toggleVisibility(exam.id, exam.is_public)}
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: exam.is_public ? 'rgba(59, 130, 246, 0.2)' : '#27272A' }}
                                        >
                                            {exam.is_public ? <Globe size={16} color="#3B82F6" /> : <Lock size={16} color="#71717A" />}
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(exam.id)}
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        >
                                            <Trash2 size={16} color="#EF4444" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'community' && (
                    <motion.div
                        key="community"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-5 py-4 space-y-3"
                    >
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
                                />
                            </div>
                        ) : communityExams.length === 0 ? (
                            <div className="text-center py-12">
                                <Users size={48} style={{ color: '#3F3F46' }} className="mx-auto mb-4" />
                                <p className="font-medium" style={{ color: '#71717A' }}>No community exams</p>
                                <p className="text-sm" style={{ color: '#52525B' }}>Follow users to see their shared exams</p>
                            </div>
                        ) : (
                            communityExams.map((exam, i) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="rounded-xl p-4"
                                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                            style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
                                        >
                                            {exam.user_details?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold" style={{ color: '#FAFAFA' }}>{exam.topic}</h3>
                                            <p className="text-xs" style={{ color: '#71717A' }}>
                                                by {exam.user_details?.username || 'Unknown'}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: '#27272A', color: '#71717A' }}>
                                            {exam.difficulty}
                                        </span>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/m/exam/take/${exam.id}`)}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
                                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                                    >
                                        <Play size={18} color="#6366F1" />
                                        <span className="font-semibold" style={{ color: '#6366F1' }}>Take Exam</span>
                                    </motion.button>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MobileExam;
