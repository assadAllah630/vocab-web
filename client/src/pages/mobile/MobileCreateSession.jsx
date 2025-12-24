import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Video, Mic, Users, MapPin, Calendar, Clock, ChevronRight, Sparkles, BookOpen, Target, ArrowRight, Check } from 'lucide-react';
import { Button, Input, Textarea, Select, SelectItem, Card, Chip, Switch } from '@heroui/react';
import { createSession, getLearningPaths, getPathNodes } from '../../api';

const MobileCreateSession = () => {
    const { id: classroomId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Curriculum State
    const [paths, setPaths] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [selectedPath, setSelectedPath] = useState(null);

    // Wizard Stage: 0=Context, 1=Details, 2=Time
    const [stage, setStage] = useState(0);

    const [form, setForm] = useState({
        title: '',
        description: '',
        scheduled_at: new Date().toISOString().slice(0, 16),
        duration_minutes: 60,
        session_type: 'video',
        linked_path_node: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    useEffect(() => {
        loadPaths();
    }, []);

    const loadPaths = async () => {
        try {
            const res = await getLearningPaths({ classroom_id: classroomId });
            setPaths(res.data);
        } catch (err) {
            console.error("Failed to load paths", err);
        }
    };

    const handlePathSelect = async (pathId) => {
        setSelectedPath(pathId);
        try {
            const res = await getPathNodes(pathId);
            setNodes(res.data);
        } catch (err) {
            console.error("Failed to load nodes", err);
        }
    };

    const handleNodeSelect = (nodeId) => {
        setForm(prev => ({ ...prev, linked_path_node: nodeId }));
        // Auto-fill title/description from node if they are empty
        const node = nodes.find(n => n.id === parseInt(nodeId));
        if (node) {
            setForm(prev => ({
                ...prev,
                title: prev.title || node.title,
                description: prev.description || node.objectives?.join('\n') || node.description
            }));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await createSession({
                ...form,
                classroom: classroomId
            });
            navigate(-1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sessionTypes = [
        { key: 'video', label: 'Video Call', description: 'LiveKit Room', icon: <Video size={20} /> },
        { key: 'audio', label: 'Audio Only', description: 'Voice Chat', icon: <Mic size={20} /> },
        { key: 'in_person', label: 'In Person', description: 'Physical Loc', icon: <MapPin size={20} /> },
    ];

    const nextStage = () => setStage(s => Math.min(s + 1, 2));
    const prevStage = () => setStage(s => Math.max(s - 1, 0));

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans overflow-hidden relative selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between p-6 pt-8">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <ChevronLeft size={22} className="text-gray-300" />
                </button>
                <div className="flex gap-1">
                    {[0, 1, 2].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s <= stage ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10'}`} />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 px-6 pb-32">
                <AnimatePresence mode="wait">
                    {stage === 0 && (
                        <motion.div
                            key="stage-0"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                    Set the Stage
                                </h1>
                                <p className="text-gray-400">Link this session to a curriculum goal.</p>
                            </div>

                            <Card className="bg-[#121215] border-white/5 p-6 rounded-3xl overflow-visible relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm ml-1 flex items-center gap-2">
                                        <BookOpen size={16} className="text-indigo-400" />
                                        Select Curriculum
                                    </label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all appearance-none font-bold text-lg"
                                        value={selectedPath || ""}
                                        onChange={(e) => handlePathSelect(e.target.value)}
                                    >
                                        <option value="" disabled>Choose learning path...</option>
                                        {paths.map((p) => <option key={p.id} value={p.id} className="text-black">{p.title}</option>)}
                                    </select>
                                </div>

                                <div className="h-4" />

                                {selectedPath && (
                                    <div className="space-y-2">
                                        <label className="text-gray-400 text-sm ml-1 flex items-center gap-2">
                                            <Target size={16} className="text-pink-400" />
                                            Select Node (Objective)
                                        </label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:bg-white/10 transition-all appearance-none font-bold text-base"
                                            value={form.linked_path_node || ""}
                                            onChange={(e) => handleNodeSelect(e.target.value)}
                                        >
                                            <option value="" disabled>Pick a step...</option>
                                            {nodes.map((n) => <option key={n.id} value={n.id} className="text-black">{n.title}</option>)}
                                        </select>
                                    </div>
                                )}
                            </Card>

                            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={nextStage}>
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-white">Skip Linking</div>
                                    <div className="text-xs text-gray-400">Create a standalone session</div>
                                </div>
                                <ChevronRight className="text-gray-500" />
                            </div>
                        </motion.div>
                    )}

                    {stage === 1 && (
                        <motion.div
                            key="stage-1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                    The Agenda
                                </h1>
                                <p className="text-gray-400">What are you teaching today?</p>
                            </div>

                            <div className="space-y-6">
                                {/* Custom Title Input to avoid label overlap */}
                                <div className="space-y-1">
                                    <label className="text-lg text-gray-400">Session Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter title..."
                                        className="w-full bg-transparent border-b border-white/20 py-2 text-2xl font-bold text-white placeholder:text-white/20 outline-none focus:border-indigo-500 transition-colors"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>


                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-400 text-sm ml-1">Description</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500 focus:bg-white/10 transition-all min-h-[120px]"
                                        placeholder="Briefing details..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="h-4"></div>

                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                {sessionTypes.map(type => (
                                    <div
                                        key={type.key}
                                        onClick={() => setForm({ ...form, session_type: type.key })}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${form.session_type === type.key
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/40'
                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className={form.session_type === type.key ? "text-white" : "text-gray-400"}>{type.icon}</div>
                                        <div className={`mt-2 font-bold text-sm ${form.session_type === type.key ? "text-white" : "text-gray-300"}`}>{type.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {stage === 2 && (
                        <motion.div
                            key="stage-2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                    Final Polish
                                </h1>
                                <p className="text-gray-400">When is this happening?</p>
                            </div>

                            <div className="bg-[#121215] border border-white/5 rounded-3xl divide-y divide-white/5">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div className="text-sm font-medium">Start Time</div>
                                    </div>
                                    <div className="flex gap-2 flex-1">
                                        {/* Custom Date Input Mask */}
                                        <div className="relative flex-1 group">
                                            <div className="absolute inset-0 opacity-0 z-10 w-full h-full">
                                                <input
                                                    type="date"
                                                    className="w-full h-full opacity-0 cursor-pointer"
                                                    style={{ appearance: 'none' }}
                                                    value={form.scheduled_at ? form.scheduled_at.split('T')[0] : ''}
                                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                    onChange={(e) => {
                                                        const date = e.target.value;
                                                        const time = form.scheduled_at ? form.scheduled_at.split('T')[1] : '12:00';
                                                        setForm({ ...form, scheduled_at: `${date}T${time}` });
                                                    }}
                                                />
                                            </div>
                                            <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center font-bold text-sm transition-colors group-active:bg-white/10 ${form.scheduled_at ? 'text-white' : 'text-gray-500'}`}>
                                                {form.scheduled_at ? new Date(form.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date'}
                                            </div>
                                        </div>

                                        {/* Custom Time Input Mask */}
                                        <div className="relative flex-1 group">
                                            <div className="absolute inset-0 opacity-0 z-10 w-full h-full">
                                                <input
                                                    type="time"
                                                    className="w-full h-full opacity-0 cursor-pointer"
                                                    style={{ appearance: 'none' }}
                                                    value={form.scheduled_at ? form.scheduled_at.split('T')[1]?.slice(0, 5) : ''}
                                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                                    onChange={(e) => {
                                                        const time = e.target.value;
                                                        const date = form.scheduled_at ? form.scheduled_at.split('T')[0] : new Date().toISOString().split('T')[0];
                                                        setForm({ ...form, scheduled_at: `${date}T${time}` });
                                                    }}
                                                />
                                            </div>
                                            <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center font-bold text-sm transition-colors group-active:bg-white/10 ${form.scheduled_at ? 'text-white' : 'text-gray-500'}`}>
                                                {form.scheduled_at ? new Date(`2000-01-01T${form.scheduled_at.split('T')[1]}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Time'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Clock size={20} />
                                        </div>
                                        <div className="text-sm font-medium">Duration</div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[30, 60, 90].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setForm({ ...form, duration_minutes: m })}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${form.duration_minutes === m ? 'bg-white text-black' : 'bg-white/5 text-gray-400'
                                                    }`}
                                            >
                                                {m}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {form.linked_path_node && (
                                <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                        <Target size={24} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest">Linked Mission</div>
                                        <div className="font-bold text-white text-sm line-clamp-1">{nodes.find(n => n.id === parseInt(form.linked_path_node))?.title}</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Actions - Lifted to clean Bottom Nav */}
            <div className="fixed bottom-24 left-0 right-0 p-6 z-[100] flex gap-3 pointer-events-auto">
                {stage > 0 && (
                    <Button
                        size="lg"
                        variant="flat"
                        className="bg-white/10 text-white font-bold rounded-2xl h-14 w-1/3 shadow-lg backdrop-blur-md"
                        onPress={prevStage}
                    >
                        Back
                    </Button>
                )}
                {stage < 2 ? (
                    <Button
                        size="lg"
                        className="bg-white text-black font-bold rounded-2xl h-14 shadow-lg shadow-white/10 flex-1"
                        onPress={nextStage}
                        endContent={<ChevronRight size={20} />}
                        isDisabled={stage === 1 && !form.title} // Basic validation
                    >
                        Next Step
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="bg-indigo-600 text-white font-bold rounded-2xl h-14 shadow-xl shadow-indigo-900/40 flex-1"
                        onPress={handleSubmit}
                        isLoading={loading}
                        startContent={<Check size={20} />}
                    >
                        Launch Session
                    </Button>
                )}
            </div>
        </div >
    );
};

export default MobileCreateSession;
