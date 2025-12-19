import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { useExam } from '../../context/ExamContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
    ChevronLeft,
    Sparkles,
    Brain,
    BookOpen,
    CheckCircle,
    Loader2,
    FileText,
    ListChecks,
    GraduationCap,
    PenTool,
    Search,
    ClipboardList,
    Star,
    Zap
} from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function MobileExamCreate() {
    const navigate = useNavigate();
    const { startExam } = useExam();
    const { t } = useTranslation();

    const QUESTION_TYPES = [
        { id: 'cloze', label: t('typeCloze'), icon: PenTool },
        { id: 'multiple_choice', label: t('typeMultipleChoice'), icon: ListChecks },
        { id: 'matching', label: t('typeMatching'), icon: GraduationCap },
        { id: 'reading', label: t('typeReading'), icon: BookOpen },
    ];

    const STEPS = [
        { id: 'analyzer', label: t('stepAnalyzing'), icon: Search },
        { id: 'planner', label: t('stepPlanning'), icon: ClipboardList },
        { id: 'generator', label: t('stepDrafting'), icon: PenTool },
        { id: 'critic', label: t('stepReviewing'), icon: Star },
        { id: 'refiner', label: t('stepRefining'), icon: Zap },
    ];

    // Form state
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('B1');
    const [selectedTypes, setSelectedTypes] = useState(['cloze', 'multiple_choice']);
    const [vocabFocus, setVocabFocus] = useState('');
    const [grammarFocus, setGrammarFocus] = useState('');
    const [notes, setNotes] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Generation state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [generationSuccess, setGenerationSuccess] = useState(false);
    const [generatedExamId, setGeneratedExamId] = useState(null); // Track ID for polling

    // Polling Effect
    React.useEffect(() => {
        let pollInterval;

        if (generationSuccess && generatedExamId) {
            pollInterval = setInterval(async () => {
                try {
                    const res = await api.get(`exams/${generatedExamId}/`);
                    // Check if questions are populated (exam done)
                    if (res.data.questions && res.data.questions.length > 0) {
                        clearInterval(pollInterval);
                        // Brief success delay then redirect
                        setTimeout(() => {
                            const totalQuestions = calculateTotalQuestions(res.data);
                            startExam(res.data, totalQuestions * 20);
                            navigate('/m/exam/play');
                        }, 1500);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                    // Don't error out UI, just keep trying or let user navigate away manually
                }
            }, 3000); // Poll every 3 seconds
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [generationSuccess, generatedExamId, navigate, startExam]);

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            if (prev.includes(typeId)) {
                return prev.filter(t => t !== typeId);
            } else {
                return [...prev, typeId];
            }
        });
    };

    const calculateTotalQuestions = (examData) => {
        let count = 0;
        if (examData.questions) {
            examData.questions.forEach(qGroup => {
                if (qGroup.items) count += qGroup.items.length;
            });
        }
        return count || 10; // Default fallback
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError(t('enterTopicError'));
            return;
        }
        if (selectedTypes.length === 0) {
            setError(t('selectTypeError'));
            return;
        }

        setLoading(true);
        setError('');
        setActiveStep(0);

        // Simulate steps for UI effect (initial loading phase)
        const stepInterval = setInterval(() => {
            setActiveStep(prev => {
                if (prev < STEPS.length - 1) return prev + 1;
                return prev;
            });
        }, 1500);

        try {
            const res = await api.post('ai/generate-exam/', {
                topic,
                level,
                question_types: selectedTypes,
                vocab_focus: vocabFocus,
                grammar_focus: grammarFocus,
                additional_notes: notes
            });

            clearInterval(stepInterval);
            setActiveStep(STEPS.length);

            if (res.status === 202) {
                // Async generation started
                setGeneratedExamId(res.data.id); // Save ID for polling
                setGenerationSuccess(true);
                return;
            }

            // Fallback for immediate response (if backend changes)
            const totalQuestions = calculateTotalQuestions(res.data);
            startExam(res.data, totalQuestions * 20);
            navigate('/m/exam/play');

        } catch (err) {
            clearInterval(stepInterval);
            console.error("Generation failed:", err);

            if (err.response?.data?.code === 'NO_API_KEYS') {
                setError('Please add your API keys first');
                setTimeout(() => navigate('/m/settings'), 1500);
                return;
            }

            setError(err.response?.data?.error || t('error'));
        } finally {
            setLoading(false);
        }
    };

    // Success / Waiting View
    if (generationSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: '#09090B' }}>
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                    }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative"
                >
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <Zap size={40} className="text-indigo-400" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-3" style={{ color: '#FAFAFA' }}>
                    Generating Exam...
                </h2>

                <p className="text-lg mb-8 leading-relaxed max-w-sm mx-auto" style={{ color: '#A1A1AA' }}>
                    Our AI is crafting your <span className="text-white font-medium">{topic}</span> exam.
                    <br />
                    <span className="text-sm mt-2 block opacity-70">Estimated time: ~2 minutes</span>
                </p>

                <div className="w-full max-w-sm space-y-4">
                    {/* Info Box */}
                    <div className="p-4 rounded-xl text-left flex gap-3" style={{ backgroundColor: '#1C1C1F', border: '1px solid #27272A' }}>
                        <div className="mt-1">
                            <CheckCircle size={18} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white mb-1">You can leave this page</p>
                            <p className="text-xs text-gray-400">
                                The exam will continue generating in the background. We'll verify it works and send you a notification when ready!
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-indigo-400 font-medium tracking-wide uppercase mb-2"
                        >
                            Auto-redirecting when ready...
                        </motion.div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/m/exam')}
                            className="w-full py-4 rounded-xl font-bold text-base transition-all border border-zinc-800"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#A1A1AA',
                            }}
                        >
                            Go to Exam List
                        </motion.button>

                        <button
                            onClick={() => navigate('/m')}
                            className="text-sm text-zinc-500 py-2"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 px-5 pt-4 pb-3" style={{ backgroundColor: '#09090B' }}>
                <div className="flex items-center justify-between">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/exam')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>
                    <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>{t('createExam')}</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-5 mb-4 p-4 rounded-xl"
                        style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="px-5 space-y-6">
                {/* Topic Input */}
                <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2" style={{ color: '#A1A1AA' }}>
                        <Brain size={16} style={{ color: '#6366F1' }} />
                        {t('topicLabel')}
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder={t('topicPlaceholder')}
                        className="w-full px-4 py-4 rounded-xl text-base outline-none transition-all"
                        style={{
                            backgroundColor: '#141416',
                            border: '1px solid #27272A',
                            color: '#FAFAFA'
                        }}
                        disabled={loading}
                    />
                </div>

                {/* Level Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2" style={{ color: '#A1A1AA' }}>
                        <GraduationCap size={16} style={{ color: '#6366F1' }} />
                        {t('levelLabel')}
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                        {LEVELS.map(l => (
                            <motion.button
                                key={l}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => !loading && setLevel(l)}
                                className="py-3 rounded-xl text-sm font-bold transition-all"
                                style={{
                                    backgroundColor: level === l ? '#6366F1' : '#1C1C1F',
                                    color: level === l ? '#FFFFFF' : '#71717A',
                                    border: `1px solid ${level === l ? '#6366F1' : '#27272A'}`
                                }}
                                disabled={loading}
                            >
                                {l}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Question Types */}
                <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2" style={{ color: '#A1A1AA' }}>
                        <ListChecks size={16} style={{ color: '#6366F1' }} />
                        {t('questionTypesLabel')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {QUESTION_TYPES.map(type => {
                            const Icon = type.icon;
                            const isSelected = selectedTypes.includes(type.id);
                            return (
                                <motion.button
                                    key={type.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => !loading && handleTypeToggle(type.id)}
                                    className="p-4 rounded-xl flex items-center gap-3 transition-all"
                                    style={{
                                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#141416',
                                        border: `1px solid ${isSelected ? '#6366F1' : '#27272A'}`
                                    }}
                                    disabled={loading}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{
                                            backgroundColor: isSelected ? '#6366F1' : '#27272A'
                                        }}
                                    >
                                        <Icon size={18} color={isSelected ? '#FFFFFF' : '#71717A'} />
                                    </div>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: isSelected ? '#FAFAFA' : '#71717A' }}
                                    >
                                        {type.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Advanced Options Toggle */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: '#1C1C1F',
                        border: '1px solid #27272A'
                    }}
                    disabled={loading}
                >
                    <Sparkles size={16} color="#6366F1" />
                    <span className="text-sm font-medium" style={{ color: '#A1A1AA' }}>
                        {showAdvanced ? t('hideAdvanced') : t('showAdvanced')}
                    </span>
                </motion.button>

                {/* Advanced Options */}
                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-bold" style={{ color: '#71717A' }}>
                                    {t('vocabFocusLabel')}
                                </label>
                                <textarea
                                    value={vocabFocus}
                                    onChange={e => setVocabFocus(e.target.value)}
                                    placeholder={t('vocabFocusPlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none h-20"
                                    style={{
                                        backgroundColor: '#141416',
                                        border: '1px solid #27272A',
                                        color: '#FAFAFA'
                                    }}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold" style={{ color: '#71717A' }}>
                                    {t('grammarFocusLabel')}
                                </label>
                                <textarea
                                    value={grammarFocus}
                                    onChange={e => setGrammarFocus(e.target.value)}
                                    placeholder={t('grammarFocusPlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none h-20"
                                    style={{
                                        backgroundColor: '#141416',
                                        border: '1px solid #27272A',
                                        color: '#FAFAFA'
                                    }}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold" style={{ color: '#71717A' }}>
                                    {t('notesLabel')}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={t('notesPlaceholder')}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none h-20"
                                    style={{
                                        backgroundColor: '#141416',
                                        border: '1px solid #27272A',
                                        color: '#FAFAFA'
                                    }}
                                    disabled={loading}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Generation Progress */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="p-5 rounded-2xl space-y-4"
                            style={{
                                backgroundColor: '#141416',
                                border: '1px solid #27272A'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Loader2 size={20} color="#6366F1" />
                                </motion.div>
                                <span className="text-sm font-bold" style={{ color: '#FAFAFA' }}>
                                    {t('aiWorking')}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {STEPS.map((step, index) => {
                                    const Icon = step.icon;
                                    const isActive = activeStep === index;
                                    const isCompleted = activeStep > index;
                                    const isPending = activeStep < index;

                                    return (
                                        <motion.div
                                            key={step.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center gap-3"
                                            style={{ opacity: isPending ? 0.4 : 1 }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{
                                                    backgroundColor: isCompleted ? '#22C55E' : isActive ? '#6366F1' : '#27272A'
                                                }}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle size={16} color="#FFFFFF" />
                                                ) : (
                                                    <Icon size={14} color={isActive ? '#FFFFFF' : '#71717A'} />
                                                )}
                                            </div>
                                            <span
                                                className="text-sm font-medium"
                                                style={{
                                                    color: isCompleted ? '#22C55E' : isActive ? '#FAFAFA' : '#71717A'
                                                }}
                                            >
                                                {step.label}
                                            </span>
                                            {isActive && (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="text-xs"
                                                    style={{ color: '#6366F1' }}
                                                >
                                                    {t('processing')}
                                                </motion.span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Generate Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all"
                    style={{
                        background: loading ? '#27272A' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: loading ? '#71717A' : '#FFFFFF',
                        boxShadow: loading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            {t('generate')}...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            {t('generateExam')}
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}

export default MobileExamCreate;
