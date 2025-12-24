import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, ChevronRight, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssignment } from '../../api';

const MobileAssignmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssignment();
    }, [id]);

    const loadAssignment = async () => {
        if (id === 'create') return; // Safety check
        try {
            const res = await getAssignment(id);
            setAssignment(res.data);
        } catch (error) {
            console.error('Failed to load assignment:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#18181B] flex items-center justify-center text-white">Loading...</div>;
    if (!assignment) return <div className="min-h-screen bg-[#18181B] flex items-center justify-center text-white">Assignment not found</div>;

    const submittedCount = assignment.progress.filter(p => ['submitted', 'graded'].includes(p.status)).length;
    const totalStudents = assignment.progress.length; // Actually progress is returned for ALL students if auto-created? 
    // Wait, assignment.progress only exists if progress rows exist.
    // Progress rows are created when student STARTS.
    // So "Not Started" students might NOT be in the list unless I auto-create rows on assignment creation?
    // My backend `start_assignment` does `get_or_create`.
    // So `assignment.progress` only shows students who started.
    // Does the teacher want to see who hasn't started? Ideally yes.
    // But `AssignmentSerializer` only includes existing `AssignmentProgress`.
    // For now, I'll display "Active Attempts" or similar.

    return (
        <div className="min-h-screen bg-[#18181B] pb-24 text-white">
            {/* Header */}
            <div className="bg-[#18181B] border-b border-[#3F3F46] p-5">
                <button onClick={() => navigate(-1)} className="mb-4 text-gray-400">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{submittedCount} Submitted</span>
                    </div>
                </div>
            </div>

            {/* Description */}
            {assignment.description && (
                <div className="p-5 border-b border-[#3F3F46/50]">
                    <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">Instructions</h3>
                    <p className="text-gray-300 leading-relaxed">{assignment.description}</p>
                </div>
            )}

            {/* Student Progress List */}
            <div className="p-5">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Student Progress</h3>

                <div className="space-y-3">
                    {assignment.progress.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No students have started this assignment yet.
                        </div>
                    ) : (
                        assignment.progress.map(p => (
                            <motion.button
                                key={p.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/m/assignment/${id}/grade/${p.id}`)}
                                className="w-full bg-[#27272A] p-4 rounded-xl flex items-center justify-between border border-[#3F3F46]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${p.status === 'graded' ? 'bg-green-500/20 text-green-400' :
                                        p.status === 'submitted' ? 'bg-indigo-500/20 text-indigo-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {p.student_name[0].toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold">{p.student_name}</div>
                                        <div className="text-xs text-gray-400 capitalize">
                                            {p.status.replace('_', ' ')}
                                            {p.status === 'graded' && ` • Score: ${p.score}%`}
                                        </div>
                                    </div>
                                </div>

                                {p.status === 'submitted' ? (
                                    <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                                        Grade
                                    </div>
                                ) : (
                                    <ChevronRight className="text-gray-600" size={18} />
                                )}
                            </motion.button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileAssignmentDetail;
