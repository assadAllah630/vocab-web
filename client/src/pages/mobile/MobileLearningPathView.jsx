import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Star, Lock, Play,
    BookOpen, Trophy, CheckCircle,
    MapPin, Zap, Flag, AlertCircle, Clock
} from 'lucide-react';
import {
    Button, CircularProgress, Card,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    useDisclosure, Select, SelectItem
} from '@heroui/react';
import api, {
    getPathDetail, getMyPathProgress,
    enrollInPath, startPathNode, getMyClassrooms, createAssignment,
    getEnrolledClassrooms, getClassPathProgress, getStudentRemediations
} from '../../api';
import confetti from 'canvas-confetti';

const MobileLearningPathView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [path, setPath] = useState(null);
    const [sublevels, setSublevels] = useState([]);
    const [progress, setProgress] = useState(null);
    const [nodeStatuses, setNodeStatuses] = useState({});
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isTeacher, setIsTeacher] = useState(false);
    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroom, setSelectedClassroom] = useState("");
    const [assigning, setAssigning] = useState(false);

    // Class Mode State
    const [linkedClassroom, setLinkedClassroom] = useState(null);
    const [studentRemediations, setStudentRemediations] = useState([]);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Structure (Path + Sublevels + Nodes)
            let structureData;
            try {
                const res = await api.get(`/paths/${id}/structure/`);
                structureData = res.data;
            } catch (e) {
                console.warn("Structure endpoint failed, falling back to legacy", e);
                const [pRes, nRes] = await Promise.all([
                    getPathDetail(id),
                    api.get(`/path-nodes/?path=${id}`)
                ]);
                structureData = {
                    ...pRes.data,
                    sublevels: [{ id: 'default', title: 'Curriculum', nodes: nRes.data.sort((a, b) => a.order - b.order) }]
                };
            }

            setPath(structureData);
            setSublevels(structureData.sublevels || []);

            // 2. Check if Student is in a Classroom linked to this Path
            let foundClassroom = null;
            if (!user.is_teacher && !user.is_staff) {
                try {
                    const { data: myClassrooms } = await getEnrolledClassrooms();
                    foundClassroom = myClassrooms.find(c => c.linked_path === parseInt(id));
                    if (foundClassroom) {
                        setLinkedClassroom(foundClassroom);
                    }
                } catch (err) {
                    console.error("Failed to check classrooms", err);
                }
            }

            // 3. Fetch Progress (Class-Level or Individual)
            try {
                let progData = null;
                const statusMap = {};

                if (foundClassroom) {
                    // Fetch Class Progress
                    console.log("Using Class Progress for Classroom:", foundClassroom.name);
                    const [cpRes, remRes] = await Promise.all([
                        getClassPathProgress(foundClassroom.id),
                        getStudentRemediations(foundClassroom.id)
                    ]);

                    progData = cpRes.data; // Has .progress list
                    setStudentRemediations(remRes.data || []);
                    console.log("Remediations:", remRes.data);

                    // Map class progress
                    if (progData.progress) {
                        progData.progress.forEach(p => {
                            statusMap[p.node] = p.status;
                        });

                        // Calculate Class Progress %
                        const completedCount = progData.progress.filter(p => p.status === 'completed').length;
                        const totalCount = progData.total_nodes || 1;
                        progData.progress_percent = (completedCount / totalCount) * 100;
                    }

                } else {
                    // Individual Progress (Legacy)
                    const res = await getMyPathProgress(id);
                    progData = res.data;

                    if (progData.progress) {
                        progData.progress.forEach(np => {
                            statusMap[np.node] = np.status;
                        });

                        // Calculate individual percent
                        let totalNodes = 0;
                        if (structureData.sublevels) {
                            structureData.sublevels.forEach(sl => totalNodes += (sl.nodes?.length || 0));
                        }
                        const completed = progData.progress.filter(p => p.status === 'completed').length;
                        const finalTotal = Math.max(totalNodes, progData.progress.length);
                        const pct = finalTotal > 0 ? (completed / finalTotal) * 100 : 0;
                        progData.progress_percent = pct;
                    }
                }

                setProgress(progData);
                setNodeStatuses(statusMap);

            } catch (err) {
                // Not enrolled or error
                console.log("No progress found or error fetching progress", err);
                setProgress(null);
            }

            // Teacher Setup
            if (user.is_teacher || user.is_staff) {
                setIsTeacher(true);
                const classRes = await getMyClassrooms();
                setClassrooms(classRes.data);
            }

        } catch (error) {
            console.error('Failed to load path data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            setEnrolling(true);
            await enrollInPath(id);
            await loadData();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (error) {
            console.error('Failed to enroll:', error);
        } finally {
            setEnrolling(false);
        }
    };

    const handleNodeClick = async (node) => {
        // Teacher always has access
        const isTeacherOwner = path?.teacher === parseInt(user.id);
        if (isTeacher || isTeacherOwner) {
            // Teacher logic (preview/assign)
            if (node.content_type === 'story' && node.content_id) {
                navigate(`/m/ai/story/${node.content_id}`);
            } else {
                navigate(`/m/path/${id}/node/${node.id}`);
            }
            return;
        }

        // Student Logic
        if (!progress) return;

        const status = nodeStatuses[node.id] || 'locked';

        // 1. Check Remediation
        const remediation = studentRemediations.find(r => r.node === node.id && !r.completed);
        if (remediation) {
            // Force remediation flow
            console.log("Remediation required:", remediation);
            if (remediation.remediation_type === 'watch_recording' && remediation.content_id) {
                // Navigate to session detail to watch recording
                navigate(`/m/sessions/${remediation.content_id}`);
                return;
            } else if (remediation.remediation_type === 'take_test') {
                alert("You need to pass the makeup test to continue.");
            } else {
                alert("Please complete the required remediation activity.");
            }
            // If strictly blocking:
            // return;
            // For now, we allow them to proceed but they see the badge.
            // But if we navigate above, we returned.
        }

        if (status === 'locked') {
            const el = document.getElementById(`node-${node.id}`);
            if (el) {
                el.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-5px)' },
                    { transform: 'translateX(5px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
            }
            return;
        }

        if (status === 'available' || status === 'in_progress') {
            try {
                await startPathNode(node.id);
            } catch (e) { console.error(e); }
        }

        // Navigate based on type
        if (node.content_type === 'story' && node.content_id) {
            navigate(`/m/ai/story/${node.content_id}`);
        } else if (node.content_type === 'exam' && node.content_id) {
            navigate(`/m/exam/take/${node.content_id}`);
        } else if (node.content_type === 'game' && node.content_id) {
            try {
                const { createGameSession } = await import('../../api');
                const btn = document.getElementById(`node-btn-${node.id}`);
                if (btn) btn.classList.add('animate-spin');

                const res = await createGameSession({
                    config_id: node.content_id,
                    is_active: true,
                    mode: 'solo'
                });

                if (res.data && res.data.id) {
                    navigate(`/m/game/arena/${res.data.id}`);
                }
            } catch (err) {
                console.error("Failed to start game session", err);
                alert("Could not start game session. Please try again.");
            }
        } else {
            navigate(`/m/path/${id}/node/${node.id}`);
        }
    };

    const getIcon = (type, status) => {
        if (status === 'completed') return <CheckCircle size={24} className="text-white" />;
        if (status === 'locked') return <Lock size={18} className="text-gray-500" />;

        switch (type) {
            case 'lesson': return <BookOpen size={20} className="text-white" />;
            case 'exam': return <Trophy size={20} className="text-white" />;
            case 'game': return <Zap size={20} className="text-white" />;
            case 'checkpoint': return <Flag size={20} className="text-white" />;
            default: return <Star size={20} className="text-white" />;
        }
    };

    const getNodeColor = (status, hasRemediation) => {
        if (hasRemediation) return 'bg-red-900/50 border-red-500 animate-pulse';
        if (status === 'completed') return 'bg-yellow-500 border-yellow-400';
        if (status === 'available' || status === 'in_progress') return 'bg-indigo-600 border-indigo-400 animate-pulse-slow shadow-[0_0_15px_rgba(79,70,229,0.5)]';
        return 'bg-[#27272A] border-gray-700';
    };

    if (loading) return (
        <div className="min-h-screen bg-[#141416] flex items-center justify-center">
            <CircularProgress color="primary" />
        </div>
    );

    if (!path) return <div className="text-white p-8">Path not found</div>;

    return (
        <div className="min-h-screen bg-[#141416] pb-20 relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-900/40 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-4 pt-6 space-y-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                    {path.speaking_language} → {path.target_language}
                                </p>
                                <h1 className="text-xl font-black leading-tight">{path.title}</h1>
                            </div>
                            {linkedClassroom && (
                                <div className="bg-indigo-600/30 border border-indigo-500/50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                                    {linkedClassroom.name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!progress ? (
                    <Card className="p-6 bg-[#1C1C1F]/90 backdrop-blur-md border border-indigo-500/30">
                        <h2 className="text-lg font-bold mb-2">
                            {isTeacher ? 'Manage this Path' : 'Start this Journey'}
                        </h2>
                        <p className="text-gray-400 text-sm mb-4">
                            {path.description || "Master a new language with this structured learning path."}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-500 mb-6">
                            <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{path.estimated_hours} Hours</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Trophy size={16} />
                                <span>{path.sublevels?.reduce((acc, level) => acc + (level.nodes?.length || 0), 0)} Steps</span>
                            </div>
                        </div>
                        {!isTeacher && (
                            <Button
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 font-bold"
                                size="lg"
                                onPress={handleEnroll}
                                isLoading={enrolling}
                            >
                                Start Learning
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="bg-[#1C1C1F]/50 backdrop-blur-md rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-bold text-white text-sm">
                                    {linkedClassroom ? "Class Progress" : "Your Progress"}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {Math.round(progress.progress_percent || 0)}% Completed
                                </p>
                            </div>
                            <Trophy size={20} className="text-yellow-500" />
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.progress_percent || 0}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Path Nodes */}
            <div className="relative z-10 px-4 pb-10">
                {sublevels.map((level, levelIndex) => (
                    <div key={level.id} className="mb-8">
                        {level.title && (
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-indigo-500 rounded-lg" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{level.title}</h2>
                            </div>
                        )}

                        <div className="relative space-y-8 pl-4">
                            {/* Connection Line */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-[#27272A] -z-10" />

                            {level.nodes.map((node, index) => {
                                const status = nodeStatuses[node.id] || 'locked';
                                const isLocked = status === 'locked';
                                const isActive = status === 'available' || status === 'in_progress';
                                const isCompleted = status === 'completed';

                                // Check for remediation
                                const remediation = studentRemediations.find(r => r.node === node.id && !r.completed);

                                return (
                                    <motion.div
                                        key={node.id}
                                        id={`node-${node.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative flex items-center gap-4 group"
                                        onClick={() => handleNodeClick(node)}
                                    >
                                        {/* Node Circle */}
                                        <div
                                            id={`node-btn-${node.id}`}
                                            className={`
                                                relative w-14 h-14 rounded-2xl flex items-center justify-center 
                                                border-2 transition-all duration-300 z-10
                                                ${getNodeColor(status, !!remediation)}
                                                ${isLocked ? 'opacity-60 grayscale' : 'cursor-pointer hover:scale-110 active:scale-95'}
                                            `}
                                        >
                                            {getIcon(node.node_type, status)}

                                            {/* Ripple effect for active node */}
                                            {isActive && !isLocked && (
                                                <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-indigo-500" />
                                            )}

                                            {/* Remediation Badge */}
                                            {remediation && (
                                                <div className="absolute -top-3 -right-3 bg-red-600 text-white p-1 rounded-full shadow-lg border border-red-400 animate-bounce z-20">
                                                    <AlertCircle size={14} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Info */}
                                        <div className={`flex-1 p-4 rounded-xl border transition-all ${isActive ? 'bg-[#1C1C1F] border-indigo-500/50' :
                                            isLocked ? 'bg-[#141416] border-white/5 opacity-50' :
                                                'bg-[#1C1C1F] border-green-500/30' // Completed
                                            }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    {node.node_type} • {node.duration_minutes} MIN
                                                </span>
                                                {remediation && (
                                                    <span className="text-[10px] font-bold text-red-500 ml-2 animate-pulse">
                                                        CATCH UP NEEDED
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-white text-sm mb-1">{node.title}</h3>
                                            <p className="text-xs text-gray-400 line-clamp-2">
                                                {node.description || "Complete this step to verify mastery."}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Teacher Actions (Optional) */}
            {isTeacher && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#111] border-t border-white/10 z-50">
                    <Button
                        className="w-full bg-white text-black font-bold"
                        onPress={onOpen}
                    >
                        Manage Path & Assignments
                    </Button>
                </div>
            )}

            {/* Teacher Modal - Placeholder for assignment creation */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg" className="dark text-white bg-zinc-900">
                <ModalContent>
                    <ModalHeader>Assign Content</ModalHeader>
                    <ModalBody>
                        <p>Select a node to create an assignment for your class.</p>
                        {/* Dropdown logic would go here */}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default MobileLearningPathView;
