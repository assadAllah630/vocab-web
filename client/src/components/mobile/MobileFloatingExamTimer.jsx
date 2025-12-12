import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExam } from '../../context/ExamContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Clock, Play, X, AlertTriangle } from 'lucide-react';

function MobileFloatingExamTimer() {
    const { activeExam, timeLeft, isExamActive, formatTime, clearExam } = useExam();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Don't show on exam pages or if no active exam
    const isExamPage = location.pathname.includes('/m/exam');
    if (!activeExam || !isExamActive || isExamPage) return null;

    const handleReturn = (e) => {
        e.stopPropagation();
        navigate('/m/exam/play');
    };

    const handleClose = (e) => {
        e.stopPropagation();
        if (window.confirm(t('cancelExamConfirm'))) {
            clearExam();
        }
    };

    const isLowTime = timeLeft <= 60;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                className="fixed bottom-24 left-5 right-5 z-[60]"
                onClick={handleReturn}
            >
                <motion.div
                    animate={isLowTime ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
                    className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
                    style={{
                        backgroundColor: isLowTime ? 'rgba(239, 68, 68, 0.95)' : 'rgba(99, 102, 241, 0.95)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: isLowTime
                            ? '0 8px 32px rgba(239, 68, 68, 0.4)'
                            : '0 8px 32px rgba(99, 102, 241, 0.4)'
                    }}
                >
                    {/* Timer Icon */}
                    <motion.div
                        animate={isLowTime ? { rotate: [0, -10, 10, 0] } : {}}
                        transition={{ duration: 0.3, repeat: isLowTime ? Infinity : 0 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    >
                        {isLowTime ? (
                            <AlertTriangle size={24} color="#FFFFFF" />
                        ) : (
                            <Clock size={24} color="#FFFFFF" />
                        )}
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1">
                        <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                            {isLowTime ? t('timeRunningOut') : t('examInProgress')}
                        </p>
                        <p className="text-xl font-mono font-bold text-white">
                            {formatTime(timeLeft)}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleReturn}
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                        >
                            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                        >
                            <X size={18} color="#FFFFFF" />
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default MobileFloatingExamTimer;
