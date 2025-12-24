import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssignment, submitAssignment } from '../../api';
import api from '../../api';
import MobileWritingPlayer from './MobileWritingPlayer';
import MobileReader from './MobileReader';
import MobileVocabPractice from './MobileVocabPractice';

const MobileAssignmentContent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState(''); // Placeholder for actual content interaction

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const res = await getAssignment(id);

            // Start the assignment to get type-specific data (e.g. story_metadata)
            const startRes = await api.post(`assignments/${id}/start/`);

            // Merge metadata from start response if it exists
            const assignmentData = {
                ...res.data,
                metadata: startRes.data.story_metadata || res.data.metadata
            };

            setAssignment(assignmentData);
        } catch (error) {
            console.error('Failed to load assignment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) return;

        setSubmitting(true);
        try {
            await submitAssignment(id, { answers }); // Mock answers
            navigate(`/m/assignment/${id}/view`);
        } catch (error) {
            console.error('Failed to submit:', error);
            alert('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-5 text-white">Loading...</div>;
    if (!assignment) return <div className="p-5 text-white">Not Found</div>;

    return (
        <div className="min-h-screen bg-[#18181B] pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#18181B] border-b border-[#3F3F46] p-4 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ArrowLeft size={24} />
                </button>
                <div className="text-sm font-bold text-gray-400 uppercase">
                    {assignment.content_type}
                </div>
                <div className="w-6" /> {/* Spacer */}
            </div>

            <div className="p-5 space-y-6">
                <h1 className="text-xl font-bold">{assignment.title}</h1>

                {/* Content Logic */}
                {assignment.content_type === 'writing' ? (
                    <MobileWritingPlayer
                        assignment={assignment}
                        progressId={null} // It will fetch itself or we can pass if we had it
                        onComplete={() => navigate(`/m/assignment/${id}/view`)}
                    />
                ) : assignment.content_type === 'story' ? (
                    <MobileReader
                        assignment={assignment}
                        onComplete={async (data) => {
                            // Submit progress data
                            try {
                                const pRes = await api.get(`assignments/${id}/my_progress/`);
                                const pid = pRes.data.id;
                                await api.post(`assignments/progress/${pid}/submit/`, {
                                    progress_data: data,
                                    is_completed: true // Simplified for MVP
                                });
                                navigate(`/m/assignment/${id}/view`);
                            } catch (e) {
                                console.error("Story save failed", e);
                                alert("Failed to save progress");
                            }
                        }}
                    />
                ) : assignment.content_type === 'path' ? (
                    <div className="bg-[#27272A] rounded-xl p-8 border border-[#3F3F46] min-h-[300px] flex flex-col items-center justify-center text-center space-y-6">
                        <div className="p-6 bg-indigo-500/20 rounded-full animate-pulse">
                            {/* Assuming MapPin is imported or can be imported. It's not imported at top yet. */}
                            {/* Actually it IS checking imports... MapPin is NOT imported. I need to add it to imports first. */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Learning Path Assigned</h3>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                You need to complete this path. Your progress is tracked automatically.
                            </p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/m/path/${assignment.content_id}`)}
                            className="w-full bg-indigo-600 font-bold text-white rounded-xl p-4 flex items-center justify-center gap-2"
                        >
                            Open Learning Path
                        </motion.button>
                    </div>
                ) : assignment.content_type === 'vocab_list' ? (
                    <MobileVocabPractice
                        assignment={assignment}
                        onComplete={async (data) => {
                            try {
                                const pRes = await api.get(`assignments/${id}/my_progress/`);
                                const pid = pRes.data.id;
                                await api.post(`assignments/progress/${pid}/submit/`, {
                                    progress_data: data,
                                    is_completed: true
                                });
                                navigate(`/m/assignment/${id}/view`);
                            } catch (e) {
                                console.error("Vocab save failed", e);
                                alert("Failed to save progress");
                            }
                        }}
                    />
                ) : (
                    /* Default Placeholder */
                    <div className="bg-[#27272A] rounded-xl p-8 border border-[#3F3F46] min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-400">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Content Placeholder</h3>
                            <p className="text-gray-400 text-sm max-w-xs">
                                This is where the {assignment.content_type} interface would load (Exam Player, Story Reader, etc).
                            </p>
                        </div>

                        <textarea
                            className="w-full bg-[#1C1C1F] p-3 rounded-lg text-sm text-white mt-4 focus:outline-none border border-gray-700"
                            placeholder="Type your answer here..."
                            value={answers}
                            onChange={e => setAnswers(e.target.value)}
                        />
                        {/* Submit Action Only for non-writing (writing handles its own submit) */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-indigo-600 font-bold text-white rounded-xl p-4 flex items-center justify-center gap-2 mt-4"
                        >
                            {submitting ? "Submitting..." : (
                                <>
                                    <Save size={20} />
                                    Submit Assignment
                                </>
                            )}
                        </motion.button>
                    </div>
                )}

                {/* Submit Action */}

            </div>
        </div>
    );
};

export default MobileAssignmentContent;
