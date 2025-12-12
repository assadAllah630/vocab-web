import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTranslation } from '../../hooks/useTranslation';

// Card component that supports both Lottie animations and static images
const GeneratorCard = ({ title, description, lottieSrc, imageSrc, color, onClick, delay }) => (
    <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="w-full text-left relative overflow-hidden group"
    >
        <div className="absolute inset-0 bg-[#18181B] rounded-3xl border border-white/5" />
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-15 group-active:opacity-20 transition-opacity duration-300 bg-gradient-to-br ${color}`} />

        <div className="relative p-5 flex items-center gap-4">
            <div className="w-24 h-24 flex-shrink-0 self-start">
                {lottieSrc ? (
                    <DotLottieReact
                        src={lottieSrc}
                        loop
                        autoplay
                        style={{ width: 96, height: 96 }}
                    />
                ) : (
                    <img
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-contain"
                    />
                )}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{description}</p>
            </div>
            <motion.div
                className="self-center"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 4L13 10L7 16" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.div>
        </div>
    </motion.button>
);

const MobileAIGenerator = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const generators = [
        {
            id: 'story',
            title: t('generatorStoryTitle'),
            description: t('generatorStoryDesc'),
            lottieSrc: '/lottie/story_icon.lottie',
            color: 'from-[#8B5CF6] to-[#6366F1]',
            path: '/m/ai/story'
        },
        {
            id: 'dialogue',
            title: t('generatorDialogueTitle'),
            description: t('generatorDialogueDesc'),
            lottieSrc: '/lottie/arty chat.lottie',
            color: 'from-[#EC4899] to-[#F43F5E]',
            path: '/m/ai/dialogue'
        },
        {
            id: 'article',
            title: t('generatorArticleTitle'),
            description: t('generatorArticleDesc'),
            lottieSrc: '/lottie/university.lottie',
            color: 'from-[#10B981] to-[#059669]',
            path: '/m/ai/article'
        }
    ];

    return (
        <div className="min-h-screen bg-[#09090B] text-white pb-safe">
            {/* Header */}
            <div className="px-6 pt-12 pb-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/m')}
                        className="p-2 -ml-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-[#A1A1AA]" />
                    </button>
                    <button
                        onClick={() => navigate('/m/ai/library')}
                        className="px-4 py-2 bg-[#18181B] border border-[#27272A] rounded-full flex items-center gap-2 hover:bg-[#27272A] transition-colors"
                    >
                        <span className="text-sm font-medium text-white">📚 {t('library')}</span>
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-6 h-6 text-[#6366F1]" />
                        <span className="text-[#6366F1] font-bold tracking-wider text-sm uppercase">{t('aiStudio')}</span>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">{t('createAndLearn')}</h1>
                    <p className="text-[#A1A1AA] text-lg">{t('generatePrompt')}</p>
                </motion.div>
            </div>

            {/* Grid */}
            <div className="px-4 flex flex-col gap-4">
                {generators.map((gen, index) => (
                    <GeneratorCard
                        key={gen.id}
                        {...gen}
                        delay={index * 0.1}
                        onClick={() => navigate(gen.path)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MobileAIGenerator;

