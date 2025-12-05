import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExam } from '../context/ExamContext';
import { ClockIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const FloatingExamTimer = () => {
    const { activeExam, timeLeft, isExamActive, formatTime, clearExam } = useExam();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show if no exam is active, if on exam page, or if on mobile routes (mobile has its own timer)
    const isMobilePath = location.pathname.startsWith('/m');
    if (!activeExam || location.pathname === '/exams' || isMobilePath) return null;

    const handleReturn = () => {
        navigate('/exams');
    };

    const handleClose = () => {
        if (window.confirm('Are you sure you want to close this exam? All progress will be lost.')) {
            clearExam();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-28 z-50"
            >
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-sm">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary-100 text-primary-600'}`}>
                        <ClockIcon className="w-6 h-6" />
                    </div>

                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Exam in Progress</div>
                        <div className={`font-mono text-xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-600' : 'text-slate-900'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-slate-200 ml-2">
                        <button
                            onClick={handleReturn}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/30"
                            title="Return to Exam"
                        >
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                            title="Cancel Exam"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingExamTimer;
