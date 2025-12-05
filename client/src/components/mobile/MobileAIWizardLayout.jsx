import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const MobileAIWizardLayout = ({
    title,
    subtitle,
    currentStep,
    totalSteps,
    onBack,
    onNext,
    isNextDisabled,
    nextLabel = 'Next',
    loading,
    loadingMessage = 'Generating...',
    children
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-white flex flex-col pb-safe">
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#09090B]/80 backdrop-blur-md border-b border-white/5">
                <button
                    onClick={handleBack}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-[#A1A1AA]" />
                </button>

                <div className="flex flex-col items-center">
                    <h1 className="text-base font-bold text-white">{title}</h1>
                    <div className="flex gap-1 mt-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i + 1 === currentStep
                                    ? 'w-6 bg-[#6366F1]'
                                    : i + 1 < currentStep
                                        ? 'w-2 bg-[#6366F1]/50'
                                        : 'w-2 bg-[#27272A]'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="w-10" /> {/* Spacer for balance */}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-4 py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="text-2xl font-black text-white mb-2">{subtitle}</h2>
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Action - extra padding for navbar */}
            <div className="p-4 bg-[#09090B] border-t border-white/5 pb-24">
                <button
                    onClick={onNext}
                    disabled={isNextDisabled || loading}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isNextDisabled
                        ? 'bg-[#27272A] text-[#71717A] cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/25 active:scale-[0.98]'
                        }`}
                >
                    {loading ? (
                        <>
                            <SparklesIcon className="w-6 h-6 animate-spin" />
                            {loadingMessage}
                        </>
                    ) : (
                        nextLabel
                    )}
                </button>
            </div>
        </div>
    );
};

export default MobileAIWizardLayout;
