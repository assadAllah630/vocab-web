import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, CheckCircle, Play, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssignment, startAssignment } from '../../api';

const MobileAssignmentView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const res = await getAssignment(id);
            setAssignment(res.data);
        } catch (error) {
            console.error('Failed to load assignment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        setStarting(true);
        try {
            await startAssignment(id);
            if (assignment.content_type === 'path') {
                navigate(`/m/path/${assignment.content_id}`);
            } else {
                navigate(`/m/assignment/${id}/do`);
            }
        } catch (error) {
            console.error('Failed to start:', error);
            alert('Error starting assignment');
        } finally {
            setStarting(false);
        }
    };

    if (loading) return <div className="p-5 text-white">Loading...</div>;
    if (!assignment) return <div className="p-5 text-white">Not Found</div>;

    const progress = assignment.my_progress;
    const status = progress ? progress.status : 'not_started';

    return (
        <div className="min-h-screen bg-[#18181B] pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#18181B] border-b border-[#3F3F46] p-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold truncate">{assignment.title}</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Meta Card */}
                <div className="bg-[#27272A] rounded-xl p-4 border border-[#3F3F46] space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs">
                        <FileText size={14} />
                        {assignment.content_type}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400 border-t border-[#3F3F46] pt-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>Attempts: {assignment.max_attempts}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">Instructions</h3>
                    <p className="text-gray-300 leading-relaxed bg-[#27272A] p-4 rounded-xl border border-[#3F3F46]">
                        {assignment.description || "No instructions provided."}
                    </p>
                </div>

                {/* Grade/Feedback */}
                {(status === 'graded' || status === 'submitted') && (
                    <div className={`p-4 rounded-xl border ${status === 'graded' ? 'bg-green-500/10 border-green-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                        <h3 className="text-sm font-bold mb-2 uppercase flex items-center gap-2">
                            {status === 'graded' ? (
                                <>
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span className="text-green-400">Graded</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} className="text-indigo-500" />
                                    <span className="text-indigo-400">Submitted</span>
                                </>
                            )}
                        </h3>

                        {status === 'graded' && (
                            <div className="mt-2 space-y-2">
                                <div className="text-3xl font-bold text-white">{progress.score}%</div>
                                {progress.feedback && (
                                    <div className="p-3 bg-black/20 rounded-lg text-sm text-gray-300 italic">
                                        "{progress.feedback}"
                                    </div>
                                )}
                            </div>
                        )}

                        {status === 'submitted' && (
                            <p className="text-sm text-indigo-300">
                                Waiting for teacher feedback.
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#18181B] border-t border-[#3F3F46]">
                    {status === 'not_started' && (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStart}
                            disabled={starting}
                            className="w-full bg-indigo-600 font-bold text-white rounded-xl p-4 flex items-center justify-center gap-2"
                        >
                            {starting ? "Starting..." : (
                                <>
                                    <Play size={20} />
                                    Start Assignment
                                </>
                            )}
                        </motion.button>
                    )}

                    {status === 'in_progress' && (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (assignment.content_type === 'path') {
                                    navigate(`/m/path/${assignment.content_id}`);
                                } else {
                                    navigate(`/m/assignment/${id}/do`);
                                }
                            }}
                            className="w-full bg-amber-600 font-bold text-white rounded-xl p-4 flex items-center justify-center gap-2"
                        >
                            <Play size={20} />
                            Continue Assignment
                        </motion.button>
                    )}

                    {(status === 'submitted' || status === 'graded') && (
                        <div className="text-center text-xs text-gray-500">
                            Assignment completed on {new Date(progress.submitted_at).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileAssignmentView;
