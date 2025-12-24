import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Video, Clock, Users, Link2, Play, Square, LogIn, ExternalLink, X, Target, CheckCircle, Award, Sparkles, Zap, Calendar, Laptop, Monitor } from 'lucide-react';
import { Button, Card, Chip, Progress, Avatar, AvatarGroup, Divider } from '@heroui/react';
import { getSessionDetail, joinSession, startSession, endSession, getSessionToken, evaluateSession } from '../api';
import VideoRoom from '../components/VideoRoom';

const SessionDetail = () => {
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
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!session) return <div className="p-10 text-center text-white">Session not found</div>;

    const isLive = session.status === 'live';
    const isCompleted = session.status === 'completed';

    if (showVideoRoom) {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-[#09090b]">
                    <div className="flex items-center gap-4">
                        <Button isIconOnly variant="light" onPress={() => setShowVideoRoom(false)}>
                            <ChevronLeft className="text-white" />
                        </Button>
                        <div>
                            <h2 className="font-bold text-white">{session.title}</h2>
                            <div className="flex items-center gap-2 text-xs text-green-400">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Session
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <VideoRoom sessionId={id} sessionTitle={session.title} onLeave={() => setShowVideoRoom(false)} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative">
            {/* Desktop Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[40%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-5000" />
                <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[50%] bg-amber-600/5 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 h-screen flex flex-col">
                {/* Navbar Breadcrumb */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        <ChevronLeft size={20} className="text-gray-400" />
                    </button>
                    <div className="flex flex-col">
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">Classroom</div>
                        <div className="text-white font-bold">{session.classroom_name}</div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
                    {/* Left Column: Visuals & Main Info (Scrollable) */}
                    <div className="col-span-8 flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar pb-20">

                        {/* Hero Banner */}
                        <div className="relative w-full aspect-[21/9] rounded-[40px] overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10" />
                            {session.session_type === 'video' ? (
                                <div className="absolute inset-0 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black opacity-80 group-hover:scale-105 transition-transform duration-1000" />
                            ) : (
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900 via-stone-900 to-black opacity-80 group-hover:scale-105 transition-transform duration-1000" />
                            )}

                            <div className="absolute bottom-0 left-0 p-10 z-20 w-full">
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Chip
                                            size="lg"
                                            className={`${isLive ? 'bg-green-500 text-black' : isCompleted ? 'bg-white/10 text-gray-400' : 'bg-indigo-500 text-white'} border-0 font-bold`}
                                        >
                                            {isLive ? '● LIVE NOW' : session.status.toUpperCase()}
                                        </Chip>
                                        <Chip size="lg" variant="flat" className="bg-white/10 backdrop-blur-md text-white border border-white/10">
                                            {session.session_type === 'video' ? <Video size={16} className="mr-2" /> : <Monitor size={16} className="mr-2" />}
                                            {session.session_type} Session
                                        </Chip>
                                    </div>
                                    <h1 className="text-6xl font-black tracking-tight text-white mb-4 shadow-sm">{session.title}</h1>
                                    <div className="flex items-center gap-6 text-white/60">
                                        <div className="flex items-center gap-2"><Users size={18} /> {session.attendance?.length || 0} Attending</div>
                                        <div className="flex items-center gap-2"><Calendar size={18} /> {formatDateTime(session.scheduled_at)}</div>
                                        <div className="flex items-center gap-2"><Clock size={18} /> {session.duration_minutes}m Duration</div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="bg-[#121215]/50 border-white/5 p-8 rounded-[32px] backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-amber-400" size={20} />
                                    Briefing
                                </h3>
                                <p className="text-gray-400 leading-relaxed text-lg">
                                    {session.description || "No description provided for this session."}
                                </p>
                            </Card>

                            {/* Curriculum Link Card */}
                            {session.linked_path_node_details && (
                                <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border-indigo-500/20 p-8 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/40 transition-colors cursor-default">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <Target size={120} className="text-indigo-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Curriculum Goal</div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{session.linked_path_node_details.title}</h3>
                                        <p className="text-indigo-200/60 line-clamp-3">
                                            {session.linked_path_node_details.objectives?.[0] || "Master this topic to advance in your learning path."}
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Quick Actions Grid for Students */}
                        {!isTeacher && (
                            <div className="grid grid-cols-3 gap-4">
                                {session.meeting_url && (
                                    <Button className="h-24 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 text-white flex flex-col gap-2">
                                        <ExternalLink size={24} className="text-blue-400" />
                                        <span>Meeting Link</span>
                                    </Button>
                                )}
                                {/* Add more student actions here */}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Console & Controls (Sticky) */}
                    <div className="col-span-4 flex flex-col gap-6 h-full min-h-0">
                        {/* Attendance Roster */}
                        <Card className="bg-[#121215] border-white/5 flex-1 flex flex-col rounded-[32px] overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-bold text-lg">Roster</h3>
                                <Chip size="sm" variant="flat">{session.attendance?.length} Students</Chip>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {session.attendance?.length > 0 ? session.attendance.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Avatar size="md" src={`https://i.pravatar.cc/150?u=${a.student}`} />
                                            <div>
                                                <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{a.student_name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    {a.status === 'attended' ? <span className="text-green-500">Present</span> : 'Absent'} • {a.join_time || 'Just now'}
                                                </div>
                                            </div>
                                        </div>
                                        {a.status === 'attended' && <CheckCircle size={18} className="text-green-500" />}
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50">
                                        <Users size={40} strokeWidth={1} />
                                        <p>No students yet</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Teacher Control Dock */}
                        {isTeacher && (
                            <div className="bg-[#121215] border border-white/5 p-6 rounded-[32px] space-y-4 shadow-2xl shadow-black/50">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Mission Control</div>
                                <div className="grid grid-cols-1 gap-3">
                                    {isLive ? (
                                        <>
                                            <Button
                                                size="lg"
                                                className="w-full h-16 bg-indigo-600 font-bold text-white text-lg rounded-2xl shadow-lg shadow-indigo-500/20"
                                                startContent={<Video size={24} />}
                                                onPress={handleJoin}
                                                isLoading={joiningVideo}
                                            >
                                                Enter Studio
                                            </Button>
                                            <Button
                                                size="lg"
                                                className="w-full bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 hover:bg-red-500/20"
                                                onPress={handleEnd}
                                                startContent={<Square size={20} />}
                                            >
                                                End Transmission
                                            </Button>
                                        </>
                                    ) : !isCompleted ? (
                                        <Button
                                            size="lg"
                                            className="w-full h-16 bg-green-500 hover:bg-green-400 font-black text-black text-lg rounded-2xl shadow-lg shadow-green-500/20"
                                            startContent={<Play size={24} />}
                                            onPress={handleStart}
                                        >
                                            GO LIVE
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            className="w-full h-16 bg-amber-500 hover:bg-amber-400 font-black text-black text-lg rounded-2xl shadow-lg shadow-amber-500/20"
                                            startContent={<Award size={24} />}
                                            onPress={() => setShowEvaluation(true)}
                                        >
                                            WRAP UP & EVALUATE
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Student Join Button (Desktop) */}
                        {!isTeacher && !isCompleted && (
                            <Button
                                size="lg"
                                className="w-full h-16 bg-indigo-600 font-bold text-white text-lg rounded-[32px] shadow-xl"
                                startContent={<LogIn size={24} />}
                                onPress={handleJoin}
                                isDisabled={!isLive}
                            >
                                {isLive ? 'Join Session Now' : 'Waiting for Teacher...'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Evaluation Modal (Desktop Optimized) */}
            <AnimatePresence>
                {showEvaluation && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#18181b] w-full max-w-4xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl relative grid grid-cols-2 h-[600px]"
                        >
                            {/* Left: Summary */}
                            <div className="bg-gradient-to-br from-[#18181b] to-black p-10 flex flex-col justify-between relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                                        <Award size={24} />
                                        <span className="font-bold uppercase tracking-widest">Session Complete</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-white mb-6">Evaluation<br />Phase</h2>
                                    <p className="text-gray-400 text-lg leading-relaxed">
                                        Rate your students' mastery of <span className="text-white font-bold">{session.linked_path_node_details?.title || "today's topic"}</span>.
                                        This will update their Learning Path progress automatically.
                                    </p>
                                </div>
                                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />

                                <Button
                                    className="bg-amber-500 text-black font-black text-lg h-14 rounded-2xl"
                                    onPress={async () => {
                                        setSubmittingEval(true);
                                        try {
                                            await evaluateSession(id, { scores: evalScores });
                                            loadSession();
                                            setShowEvaluation(false);
                                        } catch (e) { console.error(e); } finally { setSubmittingEval(false); }
                                    }}
                                    isLoading={submittingEval}
                                >
                                    Confirm All Grades
                                </Button>
                            </div>

                            {/* Right: Scoring List */}
                            <div className="p-8 bg-[#121215] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-xl">Student List</h3>
                                    <button onClick={() => setShowEvaluation(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                                </div>
                                <div className="space-y-4">
                                    {session.attendance?.map((a) => (
                                        <div key={a.id} className="bg-black/40 p-5 rounded-3xl border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={`https://i.pravatar.cc/150?u=${a.student}`} />
                                                    <span className="font-bold text-lg">{a.student_name}</span>
                                                </div>
                                                <div className={`font-black text-xl ${(evalScores[a.student] || 100) >= 100 ? 'text-green-500' : (evalScores[a.student] || 100) >= 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {evalScores[a.student] || 100}%
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { val: 50, label: 'Retry', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
                                                    { val: 75, label: 'Pass', color: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' },
                                                    { val: 100, label: 'Mastered', color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setEvalScores({ ...evalScores, [a.student]: opt.val })}
                                                        className={`py-3 rounded-xl text-sm font-bold transition-all border border-transparent ${(evalScores[a.student] || 100) === opt.val
                                                                ? `${opt.color.split(' ')[0]} border-${opt.color.split(' ')[1].replace('text-', '')}/50 scale-[1.02] shadow-lg`
                                                                : opt.color
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SessionDetail;
