import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Video, Mic, Users, MapPin, Calendar, Clock, ChevronRight, Sparkles, BookOpen, Target, ArrowRight, Check } from 'lucide-react';
import { Button, Input, Textarea, Select, SelectItem, Card, Chip, Switch } from '@heroui/react';
import { createSession, getLearningPaths, getPathNodes } from '../api';

const CreateSession = () => {
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
        scheduled_at: '',
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
        { key: 'in_person', label: 'In Person', description: 'Physical Location', icon: <MapPin size={20} /> },
    ];

    const nextStage = () => setStage(s => Math.min(s + 1, 2));
    const prevStage = () => setStage(s => Math.max(s - 1, 0));

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative flex">
            {/* Left Column: Visual Context (40%) */}
            <div className="w-[40%] relative hidden lg:block border-r border-white/5 bg-[#09090b]">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-black z-10" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-20"></div>

                {/* Dynamic content based on stage */}
                <div className="relative z-30 h-full flex flex-col justify-between p-12">
                    <div>
                        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors mb-8">
                            <ChevronLeft size={24} className="text-gray-300" />
                        </button>
                        <h1 className="text-5xl font-black tracking-tight mb-4">Create<br />Session</h1>
                        <p className="text-xl text-gray-400">Design a new learning experience for your classroom.</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { id: 0, title: 'Overview', desc: 'Link to Curriculum' },
                            { id: 1, title: 'Context', desc: 'Define Content' },
                            { id: 2, title: 'Logistics', desc: 'Time & Format' }
                        ].map((s) => (
                            <div key={s.id} className={`flex items-center gap-4 transition-opacity duration-500 ${stage === s.id ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg ${stage === s.id ? 'border-indigo-500 text-indigo-500' : 'border-white/20 text-white/50'}`}>
                                    {s.id + 1}
                                </div>
                                <div>
                                    <div className={`font-bold ${stage === s.id ? 'text-white' : 'text-gray-500'}`}>{s.title}</div>
                                    <div className="text-sm text-gray-500">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Interactive Form (60%) */}
            <div className="flex-1 overflow-y-auto bg-[#09090b] relative">
                <div className="max-w-3xl mx-auto p-12 pt-24 h-full flex flex-col">
                    <AnimatePresence mode="wait">
                        {stage === 0 && (
                            <motion.div
                                key="stage-0"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="space-y-8 flex-1"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">What's the mission?</h2>
                                    <p className="text-gray-400">Connect this session to your curriculum to track progress automatically.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <Card className="bg-[#121215] border-white/5 p-8 rounded-3xl group hover:border-indigo-500/30 transition-colors cursor-pointer border-2 border-transparent relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors" />
                                        <Select
                                            label="Select Curriculum"
                                            placeholder="Choose a learning path..."
                                            variant="underlined"
                                            classNames={{ trigger: "border-white/10", value: "text-white text-lg font-bold" }}
                                            selectedKeys={selectedPath ? [selectedPath.toString()] : []}
                                            onSelectionChange={(k) => handlePathSelect(Array.from(k)[0])}
                                            startContent={<BookOpen size={24} className="text-indigo-400" />}
                                        >
                                            {paths.map((p) => <SelectItem key={p.id} value={p.id} textValue={p.title}>{p.title}</SelectItem>)}
                                        </Select>

                                        <div className="h-8" />

                                        <Select
                                            label="Select Node (Objective)"
                                            placeholder="Pick a specific step..."
                                            variant="underlined"
                                            isDisabled={!selectedPath}
                                            classNames={{ trigger: "border-white/10", value: "text-white text-lg font-bold" }}
                                            selectedKeys={form.linked_path_node ? [form.linked_path_node.toString()] : []}
                                            onSelectionChange={(k) => handleNodeSelect(Array.from(k)[0])}
                                            startContent={<Target size={24} className="text-pink-400" />}
                                        >
                                            {nodes.map((n) => <SelectItem key={n.id} value={n.id} textValue={n.title}>{n.title}</SelectItem>)}
                                        </Select>
                                    </Card>

                                    <div
                                        onClick={nextStage}
                                        className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <Sparkles size={32} className="text-gray-400" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-white text-lg">Skip Linking</div>
                                            <div className="text-gray-500">Just a standalone session</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {stage === 1 && (
                            <motion.div
                                key="stage-1"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="space-y-10 flex-1"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">Define the Agenda</h2>
                                    <p className="text-gray-400">Set clear expectations for your students.</p>
                                </div>

                                <div className="space-y-8 max-w-2xl">
                                    <Input
                                        label="Session Title"
                                        placeholder="e.g., Advanced Grammar Review"
                                        variant="underlined"
                                        classNames={{ input: "text-4xl font-black py-4", label: "text-lg text-indigo-400 font-bold uppercase tracking-widest" }}
                                        value={form.title}
                                        onValueChange={(v) => setForm({ ...form, title: v })}
                                    />
                                    <Textarea
                                        label="Description & Notes"
                                        placeholder="Add mission briefing, required materials, etc."
                                        variant="faded"
                                        minRows={4}
                                        classNames={{ inputWrapper: "bg-white/5 p-6 rounded-2xl", input: "text-lg leading-relaxed" }}
                                        value={form.description}
                                        onValueChange={(v) => setForm({ ...form, description: v })}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4 max-w-2xl">
                                    {sessionTypes.map(type => (
                                        <div
                                            key={type.key}
                                            onClick={() => setForm({ ...form, session_type: type.key })}
                                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${form.session_type === type.key
                                                    ? 'bg-indigo-600/10 border-indigo-500'
                                                    : 'bg-white/5 border-transparent hover:border-white/10'
                                                }`}
                                        >
                                            <div className={form.session_type === type.key ? "text-indigo-400" : "text-gray-400"}>{type.icon}</div>
                                            <div className={`font-bold ${form.session_type === type.key ? "text-white" : "text-gray-400"}`}>{type.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {stage === 2 && (
                            <motion.div
                                key="stage-2"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="space-y-10 flex-1"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">Final Polish</h2>
                                    <p className="text-gray-400">Lock in the time and format.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Start Time</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-[#121215] border border-white/10 rounded-2xl p-6 text-2xl font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                                            value={form.scheduled_at}
                                            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Duration</label>
                                        <div className="flex gap-3">
                                            {[30, 45, 60, 90, 120].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setForm({ ...form, duration_minutes: m })}
                                                    className={`h-20 flex-1 rounded-2xl font-bold text-lg transition-all border-2 ${form.duration_minutes === m
                                                            ? 'bg-white text-black border-white'
                                                            : 'bg-[#121215] text-gray-400 border-white/5 hover:border-white/10'
                                                        }`}
                                                >
                                                    {m}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {form.linked_path_node && (
                                    <div className="p-8 rounded-[32px] bg-amber-500/5 border border-amber-500/20 flex gap-6 mt-8">
                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                            <Target size={32} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Linked Mission</div>
                                            <div className="font-bold text-white text-2xl">{nodes.find(n => n.id === parseInt(form.linked_path_node))?.title}</div>
                                            <div className="text-amber-200/50 mt-2">Completing this session advances student progress automatically.</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="pt-8 border-t border-white/5 flex justify-between items-center mt-auto">
                        {stage > 0 ? (
                            <Button
                                size="lg"
                                variant="light"
                                className="text-gray-400 font-bold"
                                onPress={prevStage}
                            >
                                Back
                            </Button>
                        ) : <div />}

                        {stage < 2 ? (
                            <Button
                                size="lg"
                                className="bg-white text-black font-bold h-14 px-8 rounded-2xl text-lg shadow-lg shadow-white/10"
                                onPress={nextStage}
                                endContent={<ChevronRight size={20} />}
                                isDisabled={stage === 1 && !form.title}
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold h-14 px-10 rounded-2xl text-lg shadow-xl shadow-indigo-500/30"
                                onPress={handleSubmit}
                                isLoading={loading}
                                startContent={<Check size={24} />}
                            >
                                Launch Session
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSession;
