import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, BookOpen, GraduationCap, FileText, Mic, List, CheckCircle,
    Search, Clock, Save, ChevronRight, Calendar, AlertCircle, Trophy,
    Gamepad2, Sparkles, Target
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Textarea, Switch, Chip, Slider } from '@heroui/react';
import { createAssignment, generateVocabList } from '../../api';
import { createExam } from '../../examApi';
import MobileExamEditor from './MobileExamEditor';
import MobileContentLibrary from './MobileContentLibrary'; // We need to update this to support 'select' mode

const AssignmentTypeCard = ({ id, icon: Icon, label, description, selected, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${selected
            ? 'bg-indigo-600/20 border-indigo-500'
            : 'bg-[#18181b] border-white/5 hover:border-white/10'
            }`}
    >
        {selected && <div className="absolute inset-0 bg-indigo-500/10 blur-xl" />}
        <div className="relative z-10 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                <Icon size={24} />
            </div>
            <div>
                <div className={`font-bold text-lg ${selected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{label}</div>
                <div className="text-xs text-gray-500 font-medium">{description}</div>
            </div>
            {selected && (
                <motion.div layoutId="check" className="ml-auto w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={14} className="text-white" />
                </motion.div>
            )}
        </div>
    </motion.button>
);

const MobileAssignmentCreate = () => {
    const { id: classroomId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Steps: 1=Type, 2=Content, 3=Details, 4=Logistics
    const [step, setStep] = useState(1);

    // Data State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_type: '', // exam, story, etc.
        content_id: null,
        due_date: '',
        max_attempts: 1,
        is_required: true,
        classroom: classroomId,

        // Game Mode Specifics
        is_game_mode: false,
        game_settings: {
            time_per_question: 30,
            show_leaderboard: true
        }
    });

    // Content Editor State
    const [examQuestions, setExamQuestions] = useState([]);
    const [selectedContentItem, setSelectedContentItem] = useState(null); // For Story/Article

    const types = [
        { id: 'exam', icon: GraduationCap, label: 'Exam / Quiz', description: 'Test knowledge with questions' },
        { id: 'story', icon: BookOpen, label: 'Story', description: 'Reading comprehension task' },
        { id: 'article', icon: FileText, label: 'Article', description: 'Read and discuss articles' },
        // { id: 'grammar', icon: List, label: 'Grammar', description: 'Grammar exercises' },
        { id: 'vocab_list', icon: CheckCircle, label: 'Vocab List', description: 'Learn a set of new words' },
    ];

    // Magic Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [genTopic, setGenTopic] = useState('');
    const [generatedVocab, setGeneratedVocab] = useState(null);

    const handleMagicGenerate = async () => {
        if (!genTopic) return;
        setIsGenerating(true);
        try {
            if (formData.content_type === 'vocab_list') {
                const res = await generateVocabList({ topic: genTopic, count: 12 });
                setGeneratedVocab(res.data);
            }
        } catch (e) {
            console.error(e);
            alert('Generation failed. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let finalContentId = formData.content_id;

            // 1. If Exam, we need to create it first
            if (formData.content_type === 'exam') {
                // Determine difficulty automatically or simple default
                const examRes = await createExam({
                    topic: formData.title,
                    questions: examQuestions,
                    is_template: false, // It's for this assignment specifically
                    classroom_id: classroomId
                });
                finalContentId = examRes.data.id;
            } else if (selectedContentItem) {
                finalContentId = selectedContentItem.id;
            }

            // 2. Create Assignment
            await createAssignment({
                ...formData,
                content_id: finalContentId,
                metadata: {
                    game_mode: formData.is_game_mode,
                    game_settings: formData.game_settings
                }
            });

            navigate(-1);
        } catch (error) {
            console.error('Failed to create:', error);
            // Alert user
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        // Validation logic
        if (step === 1 && !formData.content_type) return;
        if (step === 2) {
            // If exam, need questions
            if (formData.content_type === 'exam' && examQuestions.length === 0) return;
            // If library content, need selection
            if (['story', 'article'].includes(formData.content_type) && !selectedContentItem) return;
        }
        setStep(step + 1);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 pb-40 relative">

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-[#18181b] z-50">
                <motion.div
                    className="h-full bg-indigo-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <ArrowLeft size={20} className="text-gray-300" />
                </button>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Step {step} of 4
                </div>
                <div className="w-10" />
            </div>

            <div className="px-6 pt-8 pb-32">
                <AnimatePresence mode="wait">

                    {/* STEP 1: TYPE SELECTION */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-white">Choose Type</h1>
                                <p className="text-gray-400">What kind of assignment is this?</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {types.map(type => (
                                    <AssignmentTypeCard
                                        key={type.id}
                                        {...type}
                                        selected={formData.content_type === type.id}
                                        onClick={() => setFormData({ ...formData, content_type: type.id })}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: CONTENT CREATION / SELECTION */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2 mb-6">
                                <h1 className="text-3xl font-black text-white">
                                    {formData.content_type === 'exam' ? 'Build Exam' : 'Select Content'}
                                </h1>
                                <p className="text-gray-400">
                                    {formData.content_type === 'exam'
                                        ? 'Add questions for your students.'
                                        : 'Choose text from your AI Library.'}
                                </p>
                            </div>

                            {formData.content_type === 'exam' ? (
                                <MobileExamEditor
                                    value={examQuestions}
                                    onChange={setExamQuestions}
                                />
                            ) : (
                                <>
                                    {formData.content_type === 'vocab_list' && (
                                        <div className="space-y-6">
                                            <div className="bg-[#18181b] p-6 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Sparkles className="text-amber-400" />
                                                    <h3 className="font-bold text-lg">Magic Generate</h3>
                                                </div>
                                                <Input
                                                    label="Topic (e.g. 'Airport', 'Business Meeting')"
                                                    variant="bordered"
                                                    className="dark"
                                                    value={genTopic}
                                                    onChange={(e) => setGenTopic(e.target.value)}
                                                />
                                                <Button
                                                    className="w-full font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black"
                                                    isLoading={isGenerating}
                                                    onPress={handleMagicGenerate}
                                                >
                                                    Generate List
                                                </Button>
                                            </div>

                                            {generatedVocab && (
                                                <div className="space-y-3">
                                                    <h3 className="font-bold text-gray-400">Preview ({generatedVocab.length} words)</h3>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {generatedVocab.map((w, i) => (
                                                            <div key={i} className="p-3 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                                                                <div>
                                                                    <div className="font-bold">{w.word}</div>
                                                                    <div className="text-xs text-gray-400">{w.translation}</div>
                                                                </div>
                                                                <div className="text-xs px-2 py-1 bg-white/10 rounded-md">{w.definition?.slice(0, 20)}...</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {['story', 'article'].includes(formData.content_type) && (
                                        <div className="border border-white/10 rounded-3xl overflow-hidden bg-[#18181b] min-h-[50vh]">
                                            <MobileContentLibrary
                                                selectionMode={true}
                                                onSelect={(item) => setSelectedContentItem(item)}
                                                selectedId={selectedContentItem?.id}
                                                filterType={formData.content_type} // 'story' or 'article'
                                            />
                                            {/* Fallback if no content found - Suggest generation */}
                                            {!selectedContentItem && (
                                                <div className="p-4 text-center border-t border-white/10">
                                                    <p className="text-gray-500 text-sm mb-2">Can't find what you need?</p>
                                                    <Button
                                                        size="sm"
                                                        className="bg-indigo-600/20 text-indigo-400 font-bold"
                                                        onPress={() => navigate('/m/ai/create')}
                                                    >
                                                        Generate New AI Content
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: DETAILS & GAME MODE */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-white">Details & Settings</h1>
                                <p className="text-gray-400">Configure how students experience this.</p>
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Assignment Title"
                                    variant="underlined"
                                    className="dark"
                                    classNames={{ input: "text-2xl font-bold", label: "text-lg text-indigo-400" }}
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />

                                <Textarea
                                    label="Description / Instructions"
                                    variant="faded"
                                    className="dark"
                                    minRows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* GAME MODE CARD */}
                            {formData.content_type === 'exam' && (
                                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden transition-all duration-500 hover:border-indigo-500/50">
                                    <div className="absolute top-0 right-0 p-12 bg-indigo-500/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />

                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                                <Gamepad2 size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">Live Game Mode</h3>
                                                <p className="text-indigo-200/60 text-xs">Students race in the Arena</p>
                                            </div>
                                        </div>
                                        <Switch
                                            isSelected={formData.is_game_mode}
                                            onValueChange={(val) => setFormData({ ...formData, is_game_mode: val })}
                                            classNames={{ wrapper: "group-data-[selected=true]:bg-indigo-500" }}
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {formData.is_game_mode && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-4 pt-4 border-t border-white/10"
                                            >
                                                <div>
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-gray-300">Time per Question</span>
                                                        <span className="font-bold text-indigo-400">{formData.game_settings.time_per_question}s</span>
                                                    </div>
                                                    <div className="px-2">
                                                        <Slider
                                                            size="sm"
                                                            step={5}
                                                            minValue={10}
                                                            maxValue={120}
                                                            color="secondary"
                                                            value={formData.game_settings.time_per_question}
                                                            onChange={(v) => setFormData({
                                                                ...formData,
                                                                game_settings: { ...formData.game_settings, time_per_question: v }
                                                            })}
                                                            className="max-w-md"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <Trophy size={16} className="text-yellow-500" />
                                                        <span className="text-sm text-gray-300">Show Leaderboard</span>
                                                    </div>
                                                    <Switch
                                                        size="sm"
                                                        color="warning"
                                                        isSelected={formData.game_settings.show_leaderboard}
                                                        onValueChange={(v) => setFormData({
                                                            ...formData,
                                                            game_settings: { ...formData.game_settings, show_leaderboard: v }
                                                        })}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                                                    <Sparkles size={14} />
                                                    <span>Power-ups (Freeze, Bomb) will be enabled automatically.</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 4: LOGISTICS (Original Step 3) */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-white">Final Details</h1>
                                <p className="text-gray-400">Set deadlines and constraints.</p>
                            </div>

                            <div className="bg-[#18181b] rounded-3xl p-6 border border-white/5 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                        <Calendar size={16} className="text-indigo-500" />
                                        Due Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full bg-[#09090b] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                                    />
                                </div>
                                <div className="h-px bg-white/5" />
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-pink-500" />
                                        Max Attempts
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[1, 2, 3, 5, 100].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setFormData({ ...formData, max_attempts: num })}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${formData.max_attempts === num
                                                    ? 'bg-pink-500 text-white border-pink-500'
                                                    : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'
                                                    }`}
                                            >
                                                {num === 100 ? 'Unlimited' : num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 left-6 right-6 z-50">
                {step < 4 ? (
                    <Button
                        size="lg"
                        radius="full"
                        className="w-full font-bold bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        endContent={<ChevronRight />}
                        onPress={nextStep}
                        // Disable logic
                        isDisabled={
                            (step === 1 && !formData.content_type) ||
                            (step === 2 && formData.content_type === 'exam' && examQuestions.length === 0) ||
                            (step === 2 && ['story', 'article'].includes(formData.content_type) && !selectedContentItem)
                        }
                    >
                        Continue
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        radius="full"
                        className="w-full font-bold bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                        startContent={loading ? null : <Save size={20} />}
                        isLoading={loading}
                        onPress={handleSubmit}
                    >
                        Publish Assignment
                    </Button>
                )}
            </div>
        </div>
    );
};

export default MobileAssignmentCreate;
