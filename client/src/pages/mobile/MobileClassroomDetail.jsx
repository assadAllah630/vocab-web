import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Users, Copy, Share2, MoreVertical,
    Check, X, Pause, Play, Trash2, CheckCircle2,
    BookOpen, Plus, FileText, Map,
    Video, Calendar, Clock, Lock, Unlock, Sparkles, Gamepad2,
    TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button, Tabs, Tab, Card, Chip, Avatar, AvatarGroup, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Progress } from '@heroui/react';
import {
    getClassroom,
    getClassroomStudents,
    getClassroomAssignments,
    getShareLink,
    regenerateInviteCode,
    approveStudent,
    rejectStudent,
    removeStudent,
    pauseStudent,
    reactivateStudent,
    toggleClassroomActive,
    getSessions,
    getClassroomPathStats,
    getClassPathProgress,
    updateStepProgress,
    getStudentRemediations,
    createGameSession
} from '../../api';

const MobileClassroomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [inviteLink, setInviteLink] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, curriculum, people, work
    const [pathStats, setPathStats] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [copied, setCopied] = useState(false);

    // New Class Progress State
    const [classProgress, setClassProgress] = useState(null);
    const [remediations, setRemediations] = useState([]);
    const [updatingStep, setUpdatingStep] = useState(null);

    useEffect(() => {
        loadClassroomData();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'curriculum' && !pathStats) {
            loadPathStats();
        }
    }, [activeTab]);

    const loadPathStats = async () => {
        try {
            // Fetch aggregate stats, class progress, and remediations
            const [statsRes, progressRes, remRes] = await Promise.all([
                getClassroomPathStats(id),
                getClassPathProgress(id),
                getStudentRemediations(id)
            ]);
            setPathStats(statsRes.data);
            setClassProgress(progressRes.data);
            setRemediations(remRes.data);
        } catch (err) {
            console.error("Failed to load path stats", err);
        }
    };

    const loadClassroomData = async () => {
        try {
            const [classRes, studentsRes, assignRes, sessionsRes] = await Promise.all([
                getClassroom(id),
                getClassroomStudents(id),
                getClassroomAssignments(id),
                getSessions({ classroom_id: id })
            ]);

            setClassroom(classRes.data);
            setAssignments(assignRes.data);
            setSessions(sessionsRes.data);

            const allStudents = studentsRes.data.students || [];
            if (classRes.data.pending_requests) {
                // If API returns structured lists
                setPendingRequests(classRes.data.pending_requests);
                setStudents(classRes.data.students);
            } else {
                setStudents(allStudents.filter(s => s.status === 'active' || s.status === 'paused'));
                setPendingRequests(allStudents.filter(s => s.status === 'pending'));
            }
        } catch (err) {
            console.error('Failed to load classroom:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyInvite = async () => {
        if (classroom?.invite_code) {
            await navigator.clipboard.writeText(classroom.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAction = async (action, itemId) => {
        setActionLoading(itemId);
        try {
            if (action === 'approve') await approveStudent(id, itemId);
            if (action === 'reject') await rejectStudent(id, itemId);
            if (action === 'remove') { if (window.confirm('Remove student?')) await removeStudent(id, itemId); }
            if (action === 'pause') await pauseStudent(id, itemId);
            if (action === 'activate') await reactivateStudent(id, itemId);
            await loadClassroomData();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleStepUpdate = async (nodeId, percent) => {
        setUpdatingStep(nodeId);
        try {
            await updateStepProgress(id, nodeId, { completion_percent: percent });
            // Refresh logic - update local state to avoid full reload flickers
            if (classProgress) {
                const updated = { ...classProgress };
                updated.progress = updated.progress.map(p =>
                    p.node === nodeId ? { ...p, completion_percent: percent, status: percent >= 100 ? 'completed' : percent > 0 ? 'in_progress' : 'pending' } : p
                );
                setClassProgress(updated);
            }
            await loadPathStats(); // Full refresh in background
        } catch (e) {
            console.error("Failed to update step", e);
        } finally {
            setUpdatingStep(null);
        }
    };

    const handleLaunchGame = async (gameId) => {
        try {
            // Logic to launch game
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!classroom) return <div className="p-10 text-center text-white">Classroom not found</div>;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-4 border-b-2 transition-all ${activeTab === id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
        >
            <Icon size={20} className={activeTab === id ? 'text-indigo-400' : ''} />
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 pb-24 relative overflow-hidden">
            {/* Header Image */}
            <div className="absolute top-0 left-0 right-0 h-[40vh] z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/80 to-[#09090b]" />
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-50" />
            </div>

            {/* Navbar */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 backdrop-blur-sm bg-black/20">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors">
                        <Share2 size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 px-6 pt-10 pb-6">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <Chip size="sm" classNames={{ base: "bg-indigo-500/20 border border-indigo-500/30 mb-4", content: "text-indigo-300 font-bold uppercase text-[10px] tracking-widest" }}>
                        {classroom.language_name || 'Classroom'}
                    </Chip>
                    <h1 className="text-4xl font-black text-white leading-tight mb-2 tracking-tight">
                        {classroom.name}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-400 text-sm font-medium">
                        <div className="flex items-center gap-1">
                            <Users size={14} />
                            {classroom.student_count || students.length} Students
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-600" />
                        <div
                            className="bg-white/10 px-2 py-1 rounded-lg flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
                            onClick={handleCopyInvite}
                        >
                            <span className="font-mono text-white">{classroom.invite_code}</span>
                            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="relative z-10 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-[72px]">
                <div className="flex px-2">
                    <TabButton id="overview" label="Overview" icon={Sparkles} />
                    <TabButton id="curriculum" label="Curriculum" icon={Map} />
                    <TabButton id="people" label="People" icon={Users} />
                    <TabButton id="work" label="Classwork" icon={BookOpen} />
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 px-4 py-6 min-h-[50vh]">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Create Session Card */}
                            <Card
                                isPressable
                                onPress={() => navigate(`/m/classroom/${id}/schedule`)}
                                className="w-full bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-6 flex flex-row items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <Video size={24} className="text-indigo-400" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">Start Live Session</div>
                                        <div className="text-xs text-gray-400">Launch a video class now</div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                                    <Plus size={16} />
                                </div>
                            </Card>

                            {/* Sessions List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Recent Sessions</h3>
                                {sessions
                                    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))
                                    .slice(0, 5)
                                    .map(s => (
                                        <div key={s.id} onClick={() => navigate(`/m/session/${s.id}`)} className="bg-[#18181b] border border-white/5 p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${s.status === 'live' ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-gray-500'}`}>
                                                {new Date(s.scheduled_at).getDate()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white line-clamp-1">{s.title}</div>
                                                <div className={`text-xs font-bold uppercase tracking-wider ${s.status === 'live' ? 'text-red-500' : 'text-gray-500'}`}>
                                                    {s.status === 'live' ? 'Live Now' : `${s.duration_minutes} min`}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-600" />
                                        </div>
                                    ))}
                                {sessions.length === 0 && <div className="text-gray-500 text-sm italic p-4 text-center">No sessions yet.</div>}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'curriculum' && (
                        <motion.div
                            key="curriculum"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            {!pathStats ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent" /></div>
                            ) : !pathStats.has_path ? (
                                <div className="text-center p-8 text-gray-500 bg-[#18181b] rounded-2xl border border-dashed border-gray-700">
                                    <Map size={32} className="mx-auto mb-3 text-gray-600" />
                                    <div>No learning path assigned</div>
                                    <div className="text-xs mt-1">This classroom doesn't have a linked curriculum yet.</div>
                                </div>
                            ) : (
                                <>
                                    {/* Class Pacing Control (NEW) */}
                                    {classProgress && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                                    <TrendingUp size={14} />
                                                    Class Pacing
                                                </h3>
                                                <div className="text-[10px] text-gray-500">Update step completion</div>
                                            </div>

                                            <div className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                                                {classProgress.progress.map(node => (
                                                    <div key={node.node} className="p-4 hover:bg-white/5 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className={`w-2 h-2 rounded-full ${node.status === 'completed' ? 'bg-green-500' : node.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-600'}`} />
                                                                    <span className="font-bold text-sm text-white">{node.node_title}</span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold">{node.node_type} • {node.status.replace('_', ' ')}</div>
                                                            </div>
                                                            <div className="font-mono text-xs font-bold text-indigo-400">
                                                                {node.completion_percent}%
                                                            </div>
                                                        </div>

                                                        {/* Slider / Controls */}
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="range"
                                                                min="0" max="100" step="10"
                                                                value={node.completion_percent}
                                                                onChange={(e) => handleStepUpdate(node.node, parseInt(e.target.value))}
                                                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                                disabled={updatingStep === node.node}
                                                            />
                                                            {updatingStep === node.node && <RefreshCw size={14} className="animate-spin text-gray-500" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Remediation Watchlist (NEW) */}
                                    {remediations && remediations.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                                <AlertCircle size={14} />
                                                Remediation Watchlist
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {remediations.filter(r => !r.completed).map(rem => (
                                                    <div key={rem.id} className="bg-red-900/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs ring-1 ring-red-500/30">
                                                            !
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-white text-xs truncate">{rem.student_name}</div>
                                                            <div className="text-[10px] text-red-300 truncate">{rem.node_title}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Student List (Existing) */}
                                    <div className="space-y-3 pt-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Overall Student Progress</h3>
                                        {pathStats.students.length === 0 && <div className="text-gray-500 text-sm italic p-4">No active students.</div>}
                                        {pathStats.students.sort((a, b) => b.progress_percent - a.progress_percent).map(s => (
                                            <div key={s.student_id} className="bg-[#18181b] border border-white/5 p-4 rounded-2xl">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={s.avatar} size="sm" isBordered className="ring-2 ring-emerald-500/20" />
                                                        <div className="font-bold text-white text-sm">{s.name}</div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${s.progress_percent === 100 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                        {s.progress_percent}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-3">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${s.progress_percent === 100 ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                                                        style={{ width: `${s.progress_percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium uppercase tracking-wider bg-black/20 p-2 rounded-lg">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                                        {s.current_sublevel || 'Start'}
                                                    </div>
                                                    <span className="truncate max-w-[150px] text-gray-400 normal-case tracking-normal font-sans">
                                                        {s.current_node}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'people' && (
                        <motion.div
                            key="people"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            {/* Pending Requests */}
                            {pendingRequests.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        Pending Approval
                                    </h3>
                                    {pendingRequests.map(s => (
                                        <div key={s.id} className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={s.avatar} size="sm" />
                                                <div className="font-bold">{s.student_name || s.username}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" isIconOnly className="bg-green-500/20 text-green-500" onPress={() => handleAction('approve', s.membership_id)} isLoading={actionLoading === s.membership_id}>
                                                    <Check size={16} />
                                                </Button>
                                                <Button size="sm" isIconOnly className="bg-red-500/20 text-red-500" onPress={() => handleAction('reject', s.membership_id)} isLoading={actionLoading === s.membership_id}>
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Active Students */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Students ({students.length})</h3>
                                {students.map(s => (
                                    <div key={s.id} className="bg-[#18181b] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar src={s.avatar} />
                                                {s.status === 'paused' && <div className="absolute -bottom-1 -right-1 bg-yellow-500 w-3 h-3 rounded-full border-2 border-black" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{s.student_name || s.username}</div>
                                                <div className="text-xs text-gray-500">Joined {new Date(s.joined_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <Dropdown className="dark">
                                            <DropdownTrigger>
                                                <Button isIconOnly variant="light" size="sm" className="text-gray-500"><MoreVertical size={16} /></Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Student Actions">
                                                <DropdownItem startContent={<Pause size={14} />} onPress={() => handleAction('pause', s.membership_id)}>Pause Access</DropdownItem>
                                                <DropdownItem startContent={<Trash2 size={14} />} className="text-danger" color="danger" onPress={() => handleAction('remove', s.student_id)}>Remove</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'work' && (
                        <motion.div
                            key="work"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <Button
                                className="w-full bg-[#18181b] border border-dashed border-white/20 h-16 rounded-2xl text-gray-400 font-bold"
                                onPress={() => navigate(`/m/classroom/${id}/assign`)}
                                startContent={<Plus size={20} />}
                            >
                                Create New Assignment
                            </Button>

                            <div className="space-y-3">
                                {assignments.map(a => (
                                    <div key={a.id} className="bg-[#18181b] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.metadata?.game_mode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {a.metadata?.game_mode ? <Gamepad2 size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-white">{a.title}</div>
                                                {a.metadata?.game_mode && <Chip size="sm" color="secondary" variant="dot" className="border-none">LIVE</Chip>}
                                            </div>
                                            <div className="text-xs text-gray-500">Due {new Date(a.due_date).toLocaleDateString()}</div>
                                        </div>

                                        {a.metadata?.game_mode ? (
                                            <Button
                                                size="sm"
                                                className="bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20"
                                                onPress={() => handleLaunchGame(a.id)}
                                            >
                                                Launch
                                            </Button>
                                        ) : (
                                            <Chip size="sm" variant="flat" color="warning">In Progress</Chip>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileClassroomDetail;
