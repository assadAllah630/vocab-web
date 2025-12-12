import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { useExam } from '../../context/ExamContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
    MobileClozeQuestion,
    MobileMultipleChoiceQuestion,
    MobileMatchingQuestion,
    MobileReadingQuestion
} from '../../components/mobile/MobileExamQuestions';
import {
    ChevronLeft,
    Clock,
    Send,
    Trophy,
    RotateCcw,
    Plus,
    X,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';

function MobileExamPlay() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { t } = useTranslation();

    const {
        activeExam: exam,
        examAnswers: answers,
        timeLeft,
        isExamActive,
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
    const [showResultModal, setShowResultModal] = useState(false);
    const [score, setScore] = useState(0);

    // Determine mode from path
    const isReviewMode = location.pathname.includes('/review/');
    const isRetakeMode = location.pathname.includes('/retake/');
    const isTakeMode = location.pathname.includes('/take/');

    // Load exam if coming from history/community
    useEffect(() => {
        if (id && (isReviewMode || isRetakeMode || isTakeMode)) {
            loadExam();
        }
    }, [id]);

    const loadExam = async () => {
        setLoading(true);
        try {
            const res = await api.get(`exams/${id}/`);
            const examData = res.data;

            if (isReviewMode) {
                // Review mode - show answers immediately
                startExam({
                    ...examData,
                    title: examData.topic,
                    description: `Review of ${examData.topic} (${examData.difficulty})`,
                    sections: examData.questions
                }, 0);
                setExamAnswers(examData.latest_attempt?.user_answers || {});
                endExam(); // Immediately show results
            } else {
                // Retake or Take mode - fresh attempt
                const totalQuestions = calculateTotalQuestions(examData);
                startExam({
                    ...examData,
                    title: examData.topic,
                    description: `${isTakeMode ? 'Taking' : 'Retaking'} ${examData.topic} (${examData.difficulty})`,
                    sections: examData.questions
                }, totalQuestions * 20);
            }
        } catch (err) {
            console.error("Failed to load exam:", err);
            navigate('/m/exam');
        } finally {
            setLoading(false);
        }
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

    const calculateScore = () => {
        if (!exam?.sections) return 0;

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
        const finalScore = calculateScore();
        setScore(finalScore);

        try {
            await api.post('exams/', {
                topic: exam.topic || exam.title,
                difficulty: exam.difficulty || 'B1',
                questions: exam.sections,
                user_answers: answers,
                score: finalScore,
                feedback: {},
                language: 'de'
            });
            setShowResultModal(true);
        } catch (err) {
            console.error("Failed to save exam results:", err);
            setShowResultModal(true); // Still show results even if save fails
        }
    };

    const handleRetake = () => {
        setShowResultModal(false);
        setExamAnswers({});
        setShowExamResults(false);
        setScore(0);
        // Reload to reset timer and state
        loadExam();
    };

    const handleNewExam = () => {
        setShowResultModal(false);
        clearExam();
        navigate('/m/exam/create');
    };

    const handleCloseResults = () => {
        setShowResultModal(false);
    };

    const renderSection = (section, index) => {
        const QuestionComponent = {
            cloze: MobileClozeQuestion,
            multiple_choice: MobileMultipleChoiceQuestion,
            matching: MobileMatchingQuestion,
            reading: MobileReadingQuestion
        }[section.type];

        if (!QuestionComponent) {
            return (
                <div key={index} className="p-4 rounded-xl" style={{ backgroundColor: '#1C1C1F' }}>
                    <p className="text-sm" style={{ color: '#71717A' }}>
                        Unknown section type: {section.type}
                    </p>
                </div>
            );
        }

        return (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-2xl"
                style={{
                    backgroundColor: '#141416',
                    border: '1px solid #27272A'
                }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                            backgroundColor: '#6366F1',
                            color: '#FFFFFF'
                        }}
                    >
                        Section {index + 1}
                    </span>
                    <span
                        className="text-xs font-medium px-2 py-1 rounded-full capitalize"
                        style={{
                            backgroundColor: '#27272A',
                            color: '#A1A1AA'
                        }}
                    >
                        {section.type?.replace('_', ' ')}
                    </span>
                </div>

                <QuestionComponent
                    section={section}
                    onAnswer={updateAnswer}
                    answers={answers}
                    showResults={showResults}
                />
            </motion.div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // No exam state
    if (!exam) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#09090B' }}>
                <AlertTriangle size={48} color="#71717A" className="mb-4" />
                <h2 className="text-xl font-bold mb-2" style={{ color: '#FAFAFA' }}>{t('noActiveExam')}</h2>
                <p className="text-center mb-6" style={{ color: '#71717A' }}>
                    {t('noExamDesc')}
                </p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/m/exam')}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                        backgroundColor: '#6366F1',
                        color: '#FFFFFF'
                    }}
                >
                    {t('goToExams')}
                </motion.button>
            </div>
        );
    }

    const isLowTime = timeLeft <= 60 && timeLeft > 0;

    return (
        <div className="min-h-screen pb-32" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 px-5 pt-4 pb-3" style={{ backgroundColor: '#09090B' }}>
                <div className="flex items-center justify-between mb-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            if (isExamActive && !window.confirm(t('leaveConfirm'))) return;
                            clearExam();
                            navigate('/m/exam');
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>
                    <h1 className="text-lg font-bold truncate max-w-[200px]" style={{ color: '#FAFAFA' }}>
                        {exam.title || exam.topic}
                    </h1>
                    <div className="w-10" />
                </div>

                {/* Exam Info Bar */}
                <div className="flex items-center gap-3 mb-3">
                    <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
                    >
                        {exam.difficulty || exam.level}
                    </span>
                    <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                    >
                        {exam.sections?.length || 0} Sections
                    </span>
                </div>

                {/* Timer Bar */}
                {!showResults && isExamActive && (
                    <motion.div
                        animate={isLowTime ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{
                            backgroundColor: isLowTime ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            border: `1px solid ${isLowTime ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={16} color={isLowTime ? '#EF4444' : '#6366F1'} />
                            <span
                                className="text-xs font-bold"
                                style={{ color: isLowTime ? '#EF4444' : '#6366F1' }}
                            >
                                {isLowTime ? t('timeRunningOut') : t('timeRemaining')}
                            </span>
                        </div>
                        <span
                            className="font-mono text-lg font-bold"
                            style={{ color: isLowTime ? '#EF4444' : '#FAFAFA' }}
                        >
                            {formatTime(timeLeft)}
                        </span>
                    </motion.div>
                )}

                {/* Results Banner */}
                {showResults && (
                    <div
                        className="flex items-center justify-center gap-2 p-3 rounded-xl"
                        style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        <CheckCircle size={16} color="#22C55E" />
                        <span className="text-sm font-bold" style={{ color: '#22C55E' }}>
                            {t('reviewMode')}
                        </span>
                    </div>
                )}
            </div>

            {/* Question Sections */}
            <div className="px-5 space-y-4">
                {exam.sections?.map((section, index) => renderSection(section, index))}
            </div>

            {/* Bottom Action Bar - Static (End of Exam) */}
            <div
                className="p-5 mt-6"
                style={{
                    backgroundColor: 'transparent'
                }}
            >
                {!showResults ? (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitExam}
                        className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3"
                        style={{
                            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        <Send size={20} />
                        {t('submitAnswers')}
                    </motion.button>
                ) : (
                    <div className="flex gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRetake}
                            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: '#27272A',
                                color: '#FAFAFA'
                            }}
                        >
                            <RotateCcw size={18} />
                            {t('retake')}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNewExam}
                            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: '#6366F1',
                                color: '#FFFFFF'
                            }}
                        >
                            <Plus size={18} />
                            {t('newExam')}
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Result Modal */}
            <AnimatePresence>
                {showResultModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                        onClick={handleCloseResults}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md rounded-3xl p-6 pb-10"
                            style={{ backgroundColor: '#141416' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCloseResults}
                                className="absolute top-4 right-4 p-2 rounded-full"
                                style={{ backgroundColor: '#27272A' }}
                            >
                                <X size={18} color="#A1A1AA" />
                            </button>

                            {/* Score Display */}
                            <div className="text-center mb-6">
                                <div
                                    className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-4"
                                    style={{
                                        backgroundColor: score >= 80 ? 'rgba(34, 197, 94, 0.2)' :
                                            score >= 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                                    }}
                                >
                                    {score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪'}
                                </div>
                                <h2
                                    className="text-4xl font-extrabold mb-2"
                                    style={{
                                        color: score >= 80 ? '#22C55E' :
                                            score >= 60 ? '#F59E0B' : '#EF4444'
                                    }}
                                >
                                    {score}%
                                </h2>
                                <p
                                    className="text-lg font-bold"
                                    style={{
                                        color: score >= 80 ? '#22C55E' :
                                            score >= 60 ? '#F59E0B' : '#EF4444'
                                    }}
                                >
                                    {score >= 80 ? t('excellent') : score >= 60 ? t('goodJob') : t('keepPracticing')}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCloseResults}
                                    className="w-full py-4 rounded-xl font-bold"
                                    style={{
                                        backgroundColor: '#FAFAFA',
                                        color: '#09090B'
                                    }}
                                >
                                    {t('reviewAnswers')}
                                </motion.button>
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleRetake}
                                        className="py-4 rounded-xl font-bold"
                                        style={{
                                            backgroundColor: '#27272A',
                                            color: '#FAFAFA'
                                        }}
                                    >
                                        {t('retake')}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleNewExam}
                                        className="py-4 rounded-xl font-bold"
                                        style={{
                                            backgroundColor: '#6366F1',
                                            color: '#FFFFFF'
                                        }}
                                    >
                                        {t('newExam')}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MobileExamPlay;
