import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useExam } from '../context/ExamContext';
import { ClozeQuestion, MultipleChoiceQuestion, MatchingQuestion, ReadingQuestion } from '../components/ExamQuestions';
import {
    BeakerIcon,
    BookOpenIcon,
    AcademicCapIcon,
    PencilSquareIcon,
    CheckBadgeIcon,
    SparklesIcon,
    DocumentTextIcon,
    LanguageIcon,
    ChatBubbleBottomCenterTextIcon,
    CpuChipIcon,
    ArrowPathIcon,
    PlayIcon,
    TrashIcon,
    UserGroupIcon,
    GlobeAltIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const QUESTION_TYPES = [
    { id: 'cloze', label: 'Fill in the Blanks', icon: PencilSquareIcon },
    { id: 'multiple_choice', label: 'Multiple Choice', icon: CheckBadgeIcon },
    { id: 'matching', label: 'Matching', icon: AcademicCapIcon },
    { id: 'reading', label: 'Reading Comprehension', icon: BookOpenIcon },
];

const STEPS = [
    { id: 'analyzer', label: 'Analyzing Topic', icon: BeakerIcon, match: 'Topic analyzed' },
    { id: 'planner', label: 'Planning Blueprint', icon: DocumentTextIcon, match: 'Blueprint created' },
    { id: 'generator', label: 'Drafting Questions', icon: PencilSquareIcon, match: 'Draft generated' },
    { id: 'critic', label: 'Quality Review', icon: CheckBadgeIcon, match: 'Critique:' },
    { id: 'refiner', label: 'Refining Exam', icon: SparklesIcon, match: 'Exam refined' },
];

function ExamPage() {
    const {
        activeExam: exam,
        examAnswers: answers,
        timeLeft,
        isExamActive: isTimerActive,
        showExamResults: showResults,
        startExam,
        updateAnswer,
        endExam,
        clearExam,
        formatTime,
        setExamAnswers,
        setShowExamResults
    } = useExam();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Local state removed in favor of context
    const [showResultModal, setShowResultModal] = useState(false);
    const [logs, setLogs] = useState([]);
    const [activeStep, setActiveStep] = useState(0);

    const [activeTab, setActiveTab] = useState('new'); // 'new', 'history', 'community'
    const [communityExams, setCommunityExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [expandedExams, setExpandedExams] = useState(new Set());

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        } else if (activeTab === 'community') {
            fetchCommunityExams();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('exams/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setHistory([]);
        }
    };

    const fetchCommunityExams = async () => {
        try {
            const res = await api.get('exams/community/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setCommunityExams(data);
        } catch (err) {
            console.error("Failed to fetch community exams:", err);
            setCommunityExams([]);
        }
    };

    const toggleExamVisibility = async (examId, currentStatus) => {
        try {
            await api.patch(`exams/${examId}/`, { is_public: !currentStatus });
            // Update local state
            setHistory(history.map(exam =>
                exam.id === examId ? { ...exam, is_public: !currentStatus } : exam
            ));
        } catch (err) {
            console.error("Failed to update exam visibility:", err);
        }
    };

    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('B1');
    const [selectedTypes, setSelectedTypes] = useState(['cloze', 'multiple_choice']);
    const [vocabList, setVocabList] = useState('');
    const [grammarList, setGrammarList] = useState('');
    const [notes, setNotes] = useState('');

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev =>
            prev.includes(typeId)
                ? prev.filter(t => t !== typeId)
                : [...prev, typeId]
        );
    };

    const calculateTotalQuestions = (examData) => {
        let total = 0;
        const sections = examData.sections || examData.questions || [];
        sections.forEach(section => {
            if (section.questions) total += section.questions.length;
            else if (section.blanks) total += section.blanks.length;
            else if (section.pairs) total += section.pairs.length;
        });
        return total;
    };

    // Timer logic moved to ExamContext

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setLogs([]);
        setActiveStep(0);

        // Simulate steps for UI effect
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
                vocab_focus: vocabList,
                grammar_focus: grammarList,
                additional_notes: notes
            });

            clearInterval(stepInterval);
            setActiveStep(STEPS.length);

            console.log('Exam data received:', res.data); // Debug log
            console.log('Exam sections:', res.data.sections); // Debug log

            // Initialize Timer (20 seconds per question)
            const totalQuestions = calculateTotalQuestions(res.data);
            startExam(res.data, totalQuestions * 20);
        } catch (err) {
            clearInterval(stepInterval);
            console.error("Generation failed:", err);
            setError("Failed to generate exam. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = () => {
        // Simplified scoring logic
        let total = 0;
        let correct = 0;

        exam.sections.forEach(section => {
            if (section.questions) {
                section.questions.forEach(q => {
                    total++;
                    const correctVal = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_index;
                    const correctText = typeof correctVal === 'number' ? q.options[correctVal] : correctVal;
                    if (answers[q.id] !== undefined && answers[q.id] === correctText) correct++;
                });
            } else if (section.blanks) {
                section.blanks.forEach(b => {
                    total++;
                    if (answers[b.id] && answers[b.id].toLowerCase() === b.answer.toLowerCase()) correct++;
                });
            } else if (section.pairs) {
                section.pairs.forEach((p, i) => {
                    total++;
                    const qId = p.id || `match-${i}`;
                    if (answers[qId] && answers[qId] === p.right) correct++;
                });
            }
        });

        return total === 0 ? 0 : Math.round((correct / total) * 100);
    };

    const handleSubmitExam = async () => {
        endExam();
        const score = calculateScore();

        try {
            await api.post('exams/', {
                topic: exam.topic || topic,
                difficulty: level,
                questions: exam.sections,
                user_answers: answers,
                score: score,
                feedback: {},
                language: 'de'
            });
            setShowResultModal(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error("Failed to save exam results:", err);
            setError("Failed to save your results. Please try again.");
        }
    };

    const renderSection = (section, index) => {
        console.log('Rendering section:', section); // Debug log

        const QuestionComponent = {
            cloze: ClozeQuestion,
            multiple_choice: MultipleChoiceQuestion,
            matching: MatchingQuestion,
            reading: ReadingQuestion
        }[section.type];

        if (!QuestionComponent) {
            console.warn('Unknown section type:', section.type, section);
            // Fallback: render section as plain text
            return (
                <div key={index} className="mb-8 p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Section {index + 1}: {section.type || 'Unknown Type'}
                    </h3>
                    <p className="text-yellow-700 mb-4">{section.instruction || 'No instruction provided'}</p>
                    <pre className="text-xs bg-yellow-100 p-4 rounded overflow-auto">
                        {JSON.stringify(section, null, 2)}
                    </pre>
                </div>
            );
        }

        const handleAnswer = (questionId, value) => {
            updateAnswer(questionId, value);
        };

        return (
            <div key={index} className="mb-8">
                <QuestionComponent
                    section={section}
                    onAnswer={handleAnswer}
                    answers={answers}
                    showResults={showResults}
                />
            </div>
        );
    };

    const handleReview = (exam, attemptId = null) => {
        // Find the specific attempt or use latest
        const attempt = attemptId
            ? exam.attempts?.find(a => a.id === attemptId)
            : exam.latest_attempt;

        if (!attempt) {
            console.error('No attempt found');
            return;
        }

        startExam({
            ...exam,
            title: exam.topic,
            description: `Review of ${exam.topic} (${exam.difficulty})`,
            sections: exam.questions
        }, 0); // 0 time for review
        setExamAnswers(attempt.user_answers || {});
        endExam(); // Immediately end to show results
        setActiveTab('new');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRetake = (historyExam) => {
        // Calculate total questions for timer
        const totalQuestions = calculateTotalQuestions(historyExam);

        startExam({
            ...historyExam,
            title: historyExam.topic,
            description: `Retake of ${historyExam.topic} (${historyExam.difficulty})`,
            sections: historyExam.questions || historyExam.sections
        }, totalQuestions * 20);

        setActiveTab('new');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleExamHistory = (examId) => {
        setExpandedExams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(examId)) {
                newSet.delete(examId);
            } else {
                newSet.add(examId);
            }
            return newSet;
        });
    };

    const handleDelete = async (examId) => {
        if (!window.confirm('Are you sure you want to delete this exam?')) {
            return;
        }

        try {
            await api.delete(`exams/${examId}/`);
            setHistory(prev => prev.filter(e => e.id !== examId));
        } catch (err) {
            console.error("Failed to delete exam:", err);
            alert("Failed to delete exam. Please try again.");
        }
    };

    const renderCommunity = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communityExams.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserGroupIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Community Exams Yet</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Follow other users to see their shared exams here. Go to the "Search" page to find people.
                    </p>
                </div>
            ) : (
                communityExams.map(exam => (
                    <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                                    {exam.user_details?.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{exam.topic}</h3>
                                    <p className="text-xs text-slate-500">by {exam.user_details?.username || 'Unknown'}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${exam.difficulty === 'A1' || exam.difficulty === 'A2' ? 'bg-green-100 text-green-700' :
                                exam.difficulty === 'B1' || exam.difficulty === 'B2' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {exam.difficulty}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                            <div className="text-sm text-slate-500">
                                {exam.questions.length} Questions
                            </div>
                            <button
                                onClick={() => handleRetake(exam)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                            >
                                <PlayIcon className="w-4 h-4" />
                                Take Exam
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
            {history.map(exam => {
                const isExpanded = expandedExams.has(exam.id);
                const bestScore = exam.best_score || 0;

                return (
                    <div key={exam.id} className="break-inside-avoid bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${bestScore >= 80 ? 'bg-green-100 text-green-700' :
                                        bestScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        BEST: {bestScore}%
                                    </span>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {exam.attempt_count} attempts
                                    </span>
                                    {/* Public Toggle */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExamVisibility(exam.id, exam.is_public);
                                        }}
                                        className={`ml-2 p-1 rounded-full transition-colors ${exam.is_public ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                        title={exam.is_public ? "Public: Visible to followers" : "Private: Only visible to you"}
                                    >
                                        {exam.is_public ? <GlobeAltIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{exam.topic}</h3>
                                <p className="text-sm text-slate-500">{new Date(exam.updated_at || exam.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {exam.difficulty}
                            </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => handleReview(exam)}
                                className="flex-1 py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <BookOpenIcon className="w-4 h-4" />
                                Review Latest
                            </button>
                            <button
                                onClick={() => handleRetake(exam)}
                                className="flex-1 py-2 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                                Retake
                            </button>
                            {exam.attempt_count > 1 && (
                                <button
                                    onClick={() => toggleExamHistory(exam.id)}
                                    className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                                    title="View all attempts"
                                >
                                    {isExpanded ? '▼' : '▶'}
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(exam.id)}
                                className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                                title="Delete exam"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Attempt History */}
                        {isExpanded && exam.attempts && exam.attempts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Attempt History</h4>
                                <div className="space-y-2">
                                    {exam.attempts.map((attempt, idx) => (
                                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-500">#{exam.attempts.length - idx}</span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${attempt.score >= 80 ? 'bg-green-100 text-green-700' :
                                                    attempt.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {attempt.score}%
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(attempt.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleReview(exam, attempt.id)}
                                                className="text-xs font-bold text-primary-600 hover:text-primary-700"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            {history.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                    No past exams found.
                </div>
            )}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-surface-50 font-sans selection:bg-primary-200 selection:text-primary-900">
            <div className="flex-1 max-w-6xl mx-auto w-full p-6 lg:p-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-soft mb-6 border border-slate-100">
                        <AcademicCapIcon className="w-10 h-10 text-primary-600" />
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        AI Exam <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Generator</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Design professional-grade language assessments in seconds using our advanced agentic AI.
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'new'
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            New Exam
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history'
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('community')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'community'
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Community
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'new' ? (
                        <motion.div
                            key="new"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50 text-red-700 p-4 rounded-xl mb-8 border border-red-200 flex items-center gap-3 shadow-sm"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </motion.div>
                            )}

                            {!exam && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="lg:col-span-8"
                                    >
                                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 p-8 lg:p-10 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />

                                            <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-primary-500" />
                                                            TOPIC
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={topic}
                                                            onChange={e => setTopic(e.target.value)}
                                                            placeholder="e.g., Business German, Travel in Japan"
                                                            className="w-full px-5 py-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all bg-slate-50/50 focus:bg-white text-lg font-medium"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                            <AcademicCapIcon className="w-4 h-4 text-primary-500" />
                                                            LEVEL
                                                        </label>
                                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                                                                <button
                                                                    key={l}
                                                                    type="button"
                                                                    onClick={() => setLevel(l)}
                                                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${level === l
                                                                        ? 'bg-white text-primary-700 shadow-md transform scale-100 ring-1 ring-black/5'
                                                                        : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                                                                        }`}
                                                                >
                                                                    {l}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-sm font-bold text-slate-700">QUESTION TYPES</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {QUESTION_TYPES.map(type => {
                                                            const Icon = type.icon;
                                                            const isSelected = selectedTypes.includes(type.id);
                                                            return (
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    key={type.id}
                                                                    type="button"
                                                                    onClick={() => handleTypeToggle(type.id)}
                                                                    className={`flex items-center px-5 py-4 rounded-xl border text-sm font-bold transition-all ${isSelected
                                                                        ? 'border-primary-500 bg-primary-50/50 text-primary-800 shadow-sm ring-1 ring-primary-500'
                                                                        : 'border-slate-200 hover:border-primary-200 text-slate-600 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    <div className={`w-10 h-10 rounded-lg mr-4 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-400'
                                                                        }`}>
                                                                        <Icon className="w-5 h-5" />
                                                                    </div>
                                                                    {type.label}
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold tracking-wider uppercase">
                                                        <SparklesIcon className="w-4 h-4" /> Context & Customization
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-500 uppercase">Vocabulary Focus</label>
                                                            <textarea
                                                                value={vocabList}
                                                                onChange={e => setVocabList(e.target.value)}
                                                                placeholder="List specific words to include..."
                                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24 resize-none bg-slate-50/50 focus:bg-white text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-500 uppercase">Grammar Focus</label>
                                                            <textarea
                                                                value={grammarList}
                                                                onChange={e => setGrammarList(e.target.value)}
                                                                placeholder="List specific rules to test..."
                                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24 resize-none bg-slate-50/50 focus:bg-white text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-500 uppercase">Instructor Notes</label>
                                                        <textarea
                                                            value={notes}
                                                            onChange={e => setNotes(e.target.value)}
                                                            placeholder="Any extra instructions for the AI agent..."
                                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all h-20 resize-none bg-slate-50/50 focus:bg-white text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-3"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <ArrowPathIcon className="w-6 h-6 animate-spin" />
                                                            Initializing Agent...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayIcon className="w-6 h-6" />
                                                            Generate Exam
                                                        </>
                                                    )}
                                                </motion.button>
                                            </form>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="lg:col-span-4"
                                    >
                                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 p-6 sticky top-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                                <CpuChipIcon className="w-6 h-6 text-primary-500" />
                                                Agent Status
                                            </h3>

                                            <div className="space-y-6 relative pl-2">
                                                <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-slate-100" />

                                                {STEPS.map((step, index) => {
                                                    const isActive = loading && activeStep === index;
                                                    const isCompleted = activeStep > index;
                                                    const isPending = activeStep < index;
                                                    const StepIcon = step.icon;

                                                    return (
                                                        <div key={step.id} className={`relative flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-40 blur-[0.5px]' : 'opacity-100'}`}>
                                                            <motion.div
                                                                animate={isActive ? { scale: [1, 1.1, 1], boxShadow: "0 0 0 4px rgba(139, 92, 246, 0.2)" } : {}}
                                                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive
                                                                    ? 'bg-white border-primary-500 text-primary-600 shadow-lg'
                                                                    : isCompleted
                                                                        ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                                                    }`}>
                                                                {isCompleted ? (
                                                                    <CheckBadgeIcon className="w-6 h-6" />
                                                                ) : (
                                                                    <StepIcon className="w-5 h-5" />
                                                                )}
                                                            </motion.div>
                                                            <div className="flex-1">
                                                                <p className={`text-sm font-bold ${isActive ? 'text-primary-700' : 'text-slate-700'}`}>
                                                                    {step.label}
                                                                </p>
                                                                <AnimatePresence>
                                                                    {isActive && (
                                                                        <motion.p
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            className="text-xs text-primary-500 font-medium mt-1"
                                                                        >
                                                                            Processing...
                                                                        </motion.p>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <AnimatePresence>
                                                {loading && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-green-400 font-mono shadow-inner"
                                                    >
                                                        <p className="mb-2 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Live Terminal Logs</p>
                                                        <div className="h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                                                            {logs.map((log, i) => (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    key={i}
                                                                    className="truncate flex gap-2"
                                                                >
                                                                    <span className="text-slate-600">➜</span>
                                                                    <span className="opacity-90">{log}</span>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                </div >
                            )
                            }

                            {
                                exam && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="max-w-4xl mx-auto"
                                    >
                                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 mb-12">
                                            <div className="bg-slate-900 text-white p-10 relative overflow-hidden rounded-t-3xl">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />

                                                <div className="flex justify-between items-start relative z-10">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <span className="px-3 py-1 bg-primary-500/20 border border-primary-500/30 text-primary-200 text-xs font-bold rounded-full backdrop-blur-md">
                                                                {level} LEVEL
                                                            </span>
                                                            <span className="px-3 py-1 bg-white/10 border border-white/10 text-white text-xs font-bold rounded-full backdrop-blur-md">
                                                                {exam.sections.length} SECTIONS
                                                            </span>
                                                        </div>
                                                        <h2 className="text-4xl font-extrabold mb-3 tracking-tight">{exam.title}</h2>
                                                        <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">{exam.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => clearExam()}
                                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors backdrop-blur-md border border-white/10"
                                                    >
                                                        New Exam
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sticky Timer Bar */}
                                            {!showResults && (
                                                <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-10 py-4 shadow-sm flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                        Exam in Progress
                                                    </div>
                                                    <div className={`font-mono text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                                                        {formatTime(timeLeft)}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-10 bg-slate-50/50 rounded-b-3xl">
                                                <div className="space-y-8">
                                                    {exam.sections.map((section, index) => renderSection(section, index))}
                                                </div>

                                                <div className="mt-12 flex justify-end border-t border-slate-200 pt-10">
                                                    {!showResults ? (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleSubmitExam}
                                                            className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-600 shadow-lg shadow-green-500/30 transition-all"
                                                        >
                                                            Submit Answers
                                                        </motion.button>
                                                    ) : (
                                                        <div className="w-full text-center py-4 text-slate-500 italic">
                                                            Review your results above.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            }
                        </motion.div >
                    ) : activeTab === 'history' ? (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {renderHistory()}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="community"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {renderCommunity()}
                        </motion.div>
                    )}
                </AnimatePresence >

                <AnimatePresence>
                    {showResultModal && (
                        <ResultModal
                            score={calculateScore()}
                            onClose={() => setShowResultModal(false)}
                            onRetake={() => {
                                setShowResultModal(false);
                                setExamAnswers({});
                                setShowExamResults(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            onNew={() => {
                                setShowResultModal(false);
                                clearExam();
                            }}
                        />
                    )}
                </AnimatePresence>
            </div >
        </div >
    );
}

const ResultModal = ({ score, onClose, onRetake, onNew }) => {
    let emoji = '🎉';
    let message = 'Excellent!';
    let color = 'text-green-600';
    let bg = 'bg-green-100';

    if (score < 60) {
        emoji = '💪';
        message = 'Keep practicing!';
        color = 'text-red-600';
        bg = 'bg-red-100';
    } else if (score < 80) {
        emoji = '👍';
        message = 'Good job!';
        color = 'text-yellow-600';
        bg = 'bg-yellow-100';
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 ${bg} ${color}`}>
                    {emoji}
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{score}%</h2>
                <h3 className={`text-xl font-bold mb-8 ${color}`}>{message}</h3>

                <div className="space-y-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Review Answers
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onRetake}
                            className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Retake
                        </button>
                        <button
                            onClick={onNew}
                            className="py-3 bg-primary-50 text-primary-700 rounded-xl font-bold hover:bg-primary-100 transition-colors"
                        >
                            New Exam
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ExamPage;
