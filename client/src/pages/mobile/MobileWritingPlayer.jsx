import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Clock, AlignLeft, Check, AlertCircle, Save,
    Maximize2, Minimize2, Type
} from 'lucide-react';
import api from '../../api';

const MobileWritingPlayer = ({ assignment, progressId, onComplete }) => {
    // Determine content logic (writing exercise is inside assignment metdata or fetched via start_assignment response)
    // Wait, assignment object from 'getAssignment' might not have the specialized 'exercise' content if it's generic.
    // The 'start_assignment' call usually returns the specific content structure.
    // But here we are likely loading from 'getAssignment' in the parent.
    // We might need to fetch the specific exercise details if not present.
    // However, let's assume valid data will eventually be passed or we fetch it.

    // Actually, normally 'start_assignment' is called by the user clicking "Start". 
    // This component is "MobileAssignmentContent", implying they are DOING it.
    // So we should have the `submission` ID and `exercise` details from the start Response 
    // OR we fetch progress.

    const [content, setContent] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [exercise, setExercise] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Timer
    const [timeLeft, setTimeLeft] = useState(null);

    // Fullscreen mode for distraction free
    const [fullScreen, setFullScreen] = useState(false);

    useEffect(() => {
        initSession();
    }, []);

    const initSession = async () => {
        try {
            // we assume the assignment is already "started" by the parent or we call start here.
            // But let's check if we have progress linked.
            // If the parent passed 'progressId', we can fetch it.
            // But MobileAssignmentContent calls 'start_assignment' usually? 
            // No, it calls 'getAssignment'.

            // Let's rely on 'start_assignment' being called implicitly or explicitly.
            // For now, let's call start_assignment to ensure we get the exercise content.
            const res = await api.post(`assignments/${assignment.id}/start/`);

            if (res.data.exercise) {
                setExercise(res.data.exercise);
                setTimeLeft(res.data.exercise.time_limit || null);
            }
            if (res.data.submission) {
                setSubmission(res.data.submission);
                setContent(res.data.submission.content || '');
                setWordCount(res.data.submission.word_count || 0);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Autosave Timer
    useEffect(() => {
        if (!submission) return;

        const timer = setTimeout(async () => {
            if (content !== submission.content) {
                handleSave(false);
            }
        }, 3000); // 3 seconds debouce

        return () => clearTimeout(timer);
    }, [content]);

    // Count Words
    useEffect(() => {
        const count = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(count);
    }, [content]);

    const handleSave = async (isFinal = false) => {
        setSaving(true);
        try {
            // We need progress ID. 
            // The 'start_assignment' response gave us 'progress_id'.
            // But if we missed it, we assume parent passed it or we need to look it up.
            // Let's assume we can use the 'initSession' response but I didn't save progressId.
            // Re-fetch logic needed? 
            // Alternative: The submit endpoint takes ProgressID.

            // Hack for MVP: We fetch 'my_progress' from assignment viewset?
            // Or simple: We use the `assignment.id` to find progress? No, one student can have multiple? No, 1 active.

            // Let's fetch progress ID if missing.
            let pid = progressId;
            if (!pid) {
                const pRes = await api.get(`assignments/${assignment.id}/my_progress/`);
                pid = pRes.data.id;
            }

            await api.post(`assignments/progress/${pid}/submit-writing/`, {
                content: content,
                word_count: wordCount,
                is_final: isFinal
            });

            setLastSaved(new Date());

            if (isFinal) {
                onComplete();
            }
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Writing Environment...</div>;

    return (
        <div className={`flex flex-col h-full ${fullScreen ? 'fixed inset-0 z-50 bg-[#141416]' : ''}`}>

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-[#1C1C1F] border-b border-[#27272A]">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-sm font-bold ${wordCount >= exercise.min_words ? 'text-green-400' : 'text-orange-400'}`}>
                        <AlignLeft size={16} />
                        <span>{wordCount} / {exercise.min_words} words</span>
                    </div>
                    {timeLeft > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock size={16} />
                            <span>{Math.floor(timeLeft / 60)} min</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setFullScreen(!fullScreen)} className="p-2 text-gray-400 bg-[#27272A] rounded-lg">
                        {fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button onClick={() => handleSave(false)} className="px-3 py-1 bg-[#27272A] text-xs text-gray-400 rounded-lg">
                        {saving ? 'Saving...' : 'Saved'}
                    </button>
                </div>
            </div>

            {/* Split View: Prompt & Editor */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Prompt Card */}
                <div className="bg-[#1C1C1F] p-5 rounded-xl border border-[#27272A]">
                    <h2 className="text-lg font-bold text-white mb-2">{exercise.topic}</h2>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{exercise.prompt_text}</p>
                </div>

                {/* Editor */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[400px] bg-transparent text-white text-base leading-relaxed p-2 outline-none resize-none font-serif placeholder-gray-600"
                    placeholder="Start writing here..."
                    spellCheck={false}
                />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#27272A] bg-[#141416]">
                <button
                    onClick={() => {
                        if (wordCount < exercise.min_words) {
                            if (!window.confirm(`You haven't reached the minimum ${exercise.min_words} words. Submit anyway?`)) return;
                        }
                        handleSave(true);
                    }}
                    className="w-full py-4 bg-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20"
                >
                    Submit Assignment
                </button>
            </div>
        </div>
    );
};

export default MobileWritingPlayer;
