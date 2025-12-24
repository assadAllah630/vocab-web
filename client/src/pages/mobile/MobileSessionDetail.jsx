import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Video, Clock, Users, Link2, Play, Square, LogIn, ExternalLink, X, Target, CheckCircle, Award, Sparkles, Zap } from 'lucide-react';
import { Button, Card, Chip, Progress, Avatar, AvatarGroup } from '@heroui/react';
import { getSessionDetail, joinSession, startSession, endSession, getSessionToken, evaluateSession } from '../../api';
import VideoRoom from '../../components/VideoRoom';

const MobileSessionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTeacher, setIsTeacher] = useState(false);
    const [showVideoRoom, setShowVideoRoom] = useState(false);
    const [joiningVideo, setJoiningVideo] = useState(false);

    // Evaluation State
    const [showEvaluation, setShowEvaluation] = useState(false);
    const [evalScores, setEvalScores] = useState({}); // { studentId: 100 }
    const [submittingEval, setSubmittingEval] = useState(false);

    useEffect(() => {
        loadSession();
    }, [id]);

    const loadSession = async () => {
        try {
            const res = await getSessionDetail(id);
            setSession(res.data);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setIsTeacher(res.data.teacher === user.id || res.data.teacher_name === user.username);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        await startSession(id);
        loadSession();
    };

    const handleEnd = async () => {
        await endSession(id);
        loadSession();
    };

    const handleJoin = async () => {
        try {
            setJoiningVideo(true);
            await joinSession(id);
            setShowVideoRoom(true);
        } catch (err) {
            console.error('Failed to join session:', err);
            if (session.meeting_url) window.open(session.meeting_url, '_blank');
        } finally {
            setJoiningVideo(false);
        }
    };

    const formatDateTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!session) return <div className="p-10 text-center text-white">Session not found</div>;

    const isLive = session.status === 'live';
    const isCompleted = session.status === 'completed';

    if (showVideoRoom) {
        return (
            <div className="min-h-screen bg-black">
                <VideoRoom sessionId={id} sessionTitle={session.title} isTeacher={isTeacher} onLeave={() => setShowVideoRoom(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-3000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 pb-32">

                {/* Cinematic Header */}
                <div className="relative h-[45vh] w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/60 to-[#09090b] z-20" />
                    {/* Dynamic abstract geometric shapes based on session type */}
                    <div className="absolute inset-0 z-0 opacity-60">
                        {session.session_type === 'video' ? (
                            <div className="w-full h-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black" />
                        ) : (
                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900 via-stone-900 to-black" />
                        )}
                    </div>

                    <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-30 flex justify-between items-start">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
                        >
                            <ChevronLeft size={24} className="text-white" />
                        </motion.button>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2"
                        >
                            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-xs font-bold tracking-wider uppercase">{isLive ? 'Live On Air' : session.status}</span>
                        </motion.div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 z-30">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center gap-3 mb-3 text-indigo-300">
                                <Sparkles size={16} />
                                <span className="text-sm font-medium tracking-wide uppercase text-indigo-200/80">{session.session_type} Experience</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                                {session.title}
                            </h1>
                            <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
                                <Users size={14} />
                                <span>{session.classroom_name}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span>by {session.teacher_name}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Main Content Card Layout */}
                <div className="px-5 -mt-6 space-y-4">

                    {/* Linked Curriculum Card - "The Mission" */}
                    {session.linked_path_node_details && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-amber-500/50"
                        >
                            <div className="bg-[#121215] rounded-[23px] p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                                <div className="relative z-10 flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-900/20">
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Current Objective</div>
                                        <h3 className="text-lg font-bold text-white mb-1">{session.linked_path_node_details.title}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                                            {session.linked_path_node_details.objectives?.[0] || "Master the concepts in this session to advance your level."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="bg-white/5 border-white/5 p-4 rounded-3xl backdrop-blur-md">
                            <Clock size={20} className="text-indigo-400 mb-3" />
                            <div className="text-xs text-gray-400 uppercase tracking-wide">When</div>
                            <div className="font-bold text-white text-sm mt-0.5">{formatDateTime(session.scheduled_at)}</div>
                        </Card>
                        <Card className="bg-white/5 border-white/5 p-4 rounded-3xl backdrop-blur-md">
                            <Clock size={20} className="text-indigo-400 mb-3" />
                            <div className="text-xs text-gray-400 uppercase tracking-wide">Duration</div>
                            <div className="font-bold text-white text-sm mt-0.5">{session.duration_minutes} Minutes</div>
                        </Card>
                    </div>

                    {/* Description */}
                    {session.description && (
                        <div className="p-1">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-2">Briefing</div>
                            <p className="text-gray-300 leading-relaxed text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                                {session.description}
                            </p>
                        </div>
                    )}

                    {/* Teacher Controls (Attendance) */}
                    {isTeacher && session.attendance?.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4 pl-1">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Roster</div>
                                <div className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-md">{session.attendance.length} Students</div>
                            </div>
                            <div className="space-y-2">
                                {session.attendance.map((a, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                                        key={a.id}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar size="sm" isBordered color="default" src={`https://i.pravatar.cc/150?u=${a.student}`} />
                                            <div>
                                                <div className="text-sm font-medium text-white">{a.student_name}</div>
                                                <div className="text-[10px] text-gray-500">
                                                    {a.status === 'attended' ? `Joined ${a.duration_minutes}m` : 'Missed'}
                                                </div>
                                            </div>
                                        </div>
                                        {a.status === 'attended' && <CheckCircle size={16} className="text-green-500" />}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Floating Action Dock */}
            <div className="fixed bottom-20 left-0 right-0 p-5 pt-10 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
                {isTeacher ? (
                    isLive ? (
                        <div className="flex gap-3">
                            <Button size="lg" className="flex-1 bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-900/40 rounded-2xl h-14" startContent={<Video size={20} />} onPress={handleJoin} isLoading={joiningVideo}>
                                Enter Studio
                            </Button>
                            <Button size="lg" isIconOnly className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20" onPress={handleEnd}>
                                <Square size={20} />
                            </Button>
                        </div>
                    ) : !isCompleted ? (
                        <Button size="lg" className="w-full bg-green-500 font-bold text-black shadow-lg shadow-green-900/20 rounded-2xl h-14" startContent={<Play size={20} />} onPress={handleStart}>
                            Go Live
                        </Button>
                    ) : (
                        <Button size="lg" className="w-full bg-amber-500 font-bold text-black shadow-lg shadow-amber-900/20 rounded-2xl h-14" startContent={<Award size={20} />} onPress={() => setShowEvaluation(true)}>
                            Evaluate Results
                        </Button>
                    )
                ) : (
                    isCompleted && session.recording_url ? (
                        <Button
                            size="lg"
                            className="w-full bg-red-600 font-bold text-white shadow-lg shadow-red-900/20 rounded-2xl h-14"
                            startContent={<Play size={20} />}
                            onPress={() => window.open(session.recording_url, '_blank')}
                        >
                            Watch Recording
                        </Button>
                    ) : !isCompleted && (
                        <Button
                            size="lg"
                            className="w-full bg-white font-bold text-black shadow-lg shadow-white/10 rounded-2xl h-14"
                            startContent={<LogIn size={20} />}
                            onPress={handleJoin}
                            isLoading={joiningVideo}
                        >
                            {isLive ? 'Join Now' : 'Register for Session'}
                        </Button>
                    )
                )}
            </div>

            {/* High-End Evaluation Overlay */}
            <AnimatePresence>
                {showEvaluation && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4"
                    >
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#18181b] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] border-t sm:border border-white/10 overflow-hidden shadow-2xl relative"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute top-[-20%] left-[20%] w-[60%] h-[30%] bg-amber-500/30 rounded-full blur-[80px]" />

                            <div className="p-8 relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 text-amber-400 mb-1">
                                            <Award size={18} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Post-Session Analysis</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white leading-tight">Rate Mastery</h3>
                                    </div>
                                    <button onClick={() => setShowEvaluation(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>

                                <Card className="bg-white/5 border-white/5 p-4 rounded-2xl mb-8 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-black shadow-lg">
                                        <Target size={24} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Focus Objective</div>
                                        <div className="font-bold text-white">{session.linked_path_node_details?.title || 'General Session'}</div>
                                    </div>
                                </Card>

                                <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-8 pr-2 custom-scrollbar">
                                    {session.attendance?.map((a, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                                            key={a.id}
                                            className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar size="sm" src={`https://i.pravatar.cc/150?u=${a.student}`} />
                                                    <span className="font-bold text-sm text-gray-200">{a.student_name}</span>
                                                </div>
                                                <div className={`text-sm font-black ${(evalScores[a.student] || 100) >= 100 ? 'text-green-400' :
                                                    (evalScores[a.student] || 100) >= 75 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {evalScores[a.student] || 100}%
                                                </div>
                                            </div>

                                            {/* Custom Segmented Control */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { val: 50, label: 'Retry', color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
                                                    { val: 75, label: 'Pass', color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' },
                                                    { val: 100, label: 'Mastered', color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setEvalScores({ ...evalScores, [a.student]: opt.val })}
                                                        className={`py-2 rounded-xl text-xs font-bold transition-all ${(evalScores[a.student] || 100) === opt.val
                                                            ? `${opt.color.split(' ')[0].replace('/20', '')} text-white shadow-lg scale-105`
                                                            : opt.color
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-black text-black text-lg h-16 rounded-2xl shadow-xl shadow-orange-900/20"
                                    isLoading={submittingEval}
                                    onPress={async () => {
                                        setSubmittingEval(true);
                                        try {
                                            await evaluateSession(id, { scores: evalScores });
                                            loadSession();
                                            setShowEvaluation(false);
                                        } catch (e) { console.error(e); } finally { setSubmittingEval(false); }
                                    }}
                                >
                                    Confirm Progress
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileSessionDetail;
