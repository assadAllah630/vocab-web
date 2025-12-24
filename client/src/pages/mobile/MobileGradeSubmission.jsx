import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Calendar, Save, Award, MessageSquare } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssignment, gradeSubmission } from '../../api';

const MobileGradeSubmission = () => {
    const { id, progressId } = useParams();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        score: '',
        feedback: ''
    });

    useEffect(() => {
        loadData();
    }, [id, progressId]);

    const loadData = async () => {
        try {
            const res = await getAssignment(id);
            const assign = res.data;
            setAssignment(assign);

            const prog = assign.progress.find(p => p.id === parseInt(progressId));
            if (prog) {
                setProgress(prog);
                setFormData({
                    score: prog.score || '',
                    feedback: prog.feedback || ''
                });
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await gradeSubmission(progressId, {
                score: parseFloat(formData.score),
                feedback: formData.feedback
            });
            navigate(-1);
        } catch (error) {
            console.error('Failed to submit grade:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-5 text-white">Loading...</div>;
    if (!progress || !assignment) return <div className="p-5 text-white">Validation failed</div>;

    return (
        <div className="min-h-screen bg-[#18181B] pb-24 text-white">
            <div className="sticky top-0 z-10 bg-[#18181B]/80 backdrop-blur-md border-b border-[#3F3F46] p-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold">Grade Submission</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Info Card */}
                <div className="bg-[#27272A] rounded-xl p-4 border border-[#3F3F46]">
                    <h2 className="font-bold text-lg mb-1">{assignment.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                        <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>{progress.student_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{new Date(progress.submitted_at || progress.started_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Submission Content Placeholder */}
                <div className="bg-[#27272A] rounded-xl p-4 border border-[#3F3F46] min-h-[150px] flex items-center justify-center text-gray-500">
                    <p>Submission content preview not available yet.</p>
                </div>

                {/* Grading Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-indigo-400 mb-2">
                            <Award size={18} />
                            Score (0-100)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            required
                            value={formData.score}
                            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                            className="w-full bg-[#1C1C1F] border border-[#3F3F46] rounded-xl p-4 text-white text-2xl font-mono focus:border-indigo-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-indigo-400 mb-2">
                            <MessageSquare size={18} />
                            Feedback
                        </label>
                        <textarea
                            value={formData.feedback}
                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                            className="w-full bg-[#1C1C1F] border border-[#3F3F46] rounded-xl p-4 text-white h-32 resize-none focus:border-indigo-500 focus:outline-none"
                            placeholder="Great job! Next time try to..."
                        />
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 font-bold text-white rounded-xl p-4 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Save Grade
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default MobileGradeSubmission;
