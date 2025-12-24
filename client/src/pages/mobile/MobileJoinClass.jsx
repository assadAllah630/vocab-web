import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Search, School, Check, AlertCircle,
    ArrowRight, KeyRound
} from 'lucide-react';
import { validateInviteCode, joinClassroom } from '../../api';

const MobileJoinClass = () => {
    const { code: urlCode } = useParams();
    const navigate = useNavigate();

    const [inviteCode, setInviteCode] = useState(urlCode || '');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        // If code exists in URL or is typed to 8 chars, validate automatically
        if (inviteCode.length === 8) {
            validateCode(inviteCode);
        } else {
            setPreview(null);
            setError('');
        }
    }, [inviteCode]);

    const validateCode = async (code) => {
        try {
            setLoading(true);
            setError('');
            const res = await validateInviteCode(code);

            if (res.data.valid) {
                if (res.data.already_enrolled) {
                    setError(`You are already enrolled (Status: ${res.data.status})`);
                    setPreview(res.data.classroom); // Show classroom anyway
                } else if (res.data.is_full) {
                    setError('This classroom is full.');
                    setPreview(null);
                } else {
                    setPreview({
                        ...res.data.classroom,
                        requires_approval: res.data.requires_approval
                    });
                }
            } else {
                setError('Invalid invite code');
                setPreview(null);
            }
        } catch (err) {
            console.error('Validation failed:', err);
            if (err.response?.status === 404) {
                setError('Invalid invite code');
            } else {
                setError('Failed to validate code');
            }
            setPreview(null);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!preview || error) return;

        try {
            setJoining(true);
            const res = await joinClassroom(inviteCode);

            if (res.data.status === 'active') {
                navigate(`/m/class/${res.data.classroom.id}`);
            } else {
                // Pending approval
                navigate('/m/classes');
                alert('Request sent! Waiting for teacher approval.');
            }
        } catch (err) {
            console.error('Join failed:', err);
            setError(err.response?.data?.error || 'Failed to join classroom');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Join Classroom</h1>
            </div>

            <div className="max-w-sm mx-auto">
                <div className="text-center mb-6">
                    <div className="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                        <KeyRound className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Enter Invite Code</h2>
                    <p className="text-slate-400 text-sm">
                        Enter the 8-character code provided by your teacher
                    </p>
                </div>

                {/* Input Field */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 8))}
                        placeholder="ABC12XYZ"
                        className={`w-full bg-slate-800 border-2 rounded-2xl px-4 py-4 text-center text-2xl font-mono tracking-widest uppercase focus:outline-none transition-colors ${error
                            ? 'border-red-500/50 focus:border-red-500'
                            : preview
                                ? 'border-green-500/50 focus:border-green-500'
                                : 'border-slate-700 focus:border-indigo-500'
                            }`}
                    />
                    {loading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="animate-in fade-in slide-in-from-top-2 mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-red-400 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Classroom Preview Card */}
                {preview && !error && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300">
                                <School className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight mb-1">{preview.name}</h3>
                                <p className="text-slate-400 text-sm">{preview.teacher_name}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <span className="bg-slate-700/50 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300">
                                {preview.level}
                            </span>
                            <span className="bg-slate-700/50 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300">
                                {preview.target_language?.toUpperCase() || 'N/A'}
                            </span>
                            <span className="bg-slate-700/50 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300">
                                {preview.student_count} / {preview.max_students} Students
                            </span>
                        </div>

                        {preview.requires_approval && (
                            <div className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                <AlertCircle className="w-3.5 h-3.5" />
                                This classroom requires teacher approval
                            </div>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleJoin}
                    disabled={!preview || !!error || joining}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${preview && !error
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    {joining ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Joining...
                        </>
                    ) : (
                        <>
                            Join Classroom
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MobileJoinClass;
