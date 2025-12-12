import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Animated icon wrapper with pulsing effect
 * Accepts either children or an icon component
 */
export const AnimatedIcon = ({ children, icon: Icon, size = 20, color, animation = 'pulse', className = '' }) => {
    const animations = {
        pulse: { scale: [1, 1.1, 1] },
        bounce: { y: [0, -3, 0] },
        rotate: { rotate: [0, 10, -10, 0] }
    };

    return (
        <motion.div
            animate={animations[animation] || animations.pulse}
            transition={{ duration: 2, repeat: Infinity }}
            className={className}
        >
            {Icon ? <Icon size={size} color={color} /> : children}
        </motion.div>
    );
};

/**
 * Glowing zap effect
 */
export const GlowingZap = ({ className = '' }) => (
    <motion.div
        animate={{
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.1, 1]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`text-yellow-400 ${className}`}
    >
        ⚡
    </motion.div>
);

/**
 * Bouncing flame effect
 */
export const BouncingFlame = ({ className = '' }) => (
    <motion.div
        animate={{
            y: [0, -3, 0],
            scale: [1, 1.05, 1]
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className={`text-orange-500 ${className}`}
    >
        🔥
    </motion.div>
);

/**
 * Animated volume icon with wave effect
 */
export const AnimatedVolume = ({ className = '' }) => (
    <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className={className}
    >
        🔊
    </motion.div>
);

/**
 * Animated trophy with shine effect
 */
export const AnimatedTrophy = ({ className = '' }) => (
    <motion.div
        animate={{
            rotate: [-5, 5, -5],
            scale: [1, 1.1, 1]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={className}
    >
        🏆
    </motion.div>
);

/**
 * Animated sparkles
 */
export const AnimatedSparkles = ({ className = '' }) => (
    <motion.div
        animate={{
            opacity: [0.7, 1, 0.7],
            rotate: [0, 10, -10, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={className}
    >
        ✨
    </motion.div>
);

/**
 * Rating faces component for feedback
 */
export const RatingFaces = ({ rating, onRate, className = '' }) => {
    const faces = [
        { emoji: '😞', label: 'Poor', value: 1 },
        { emoji: '😐', label: 'Okay', value: 2 },
        { emoji: '🙂', label: 'Good', value: 3 },
        { emoji: '😄', label: 'Great', value: 4 },
        { emoji: '🤩', label: 'Perfect', value: 5 }
    ];

    return (
        <div className={`flex gap-2 justify-center ${className}`}>
            {faces.map((face) => (
                <motion.button
                    key={face.value}
                    onClick={() => onRate?.(face.value)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`text-2xl p-2 rounded-lg transition-all ${rating === face.value
                        ? 'bg-[#6366F1]/30 ring-2 ring-[#6366F1]'
                        : 'hover:bg-[#27272A]'
                        }`}
                >
                    {face.emoji}
                </motion.button>
            ))}
        </div>
    );
};

// Sub-components for individual usage (e.g. Flashcards)
const RatedButton = ({ onClick, className, emoji, labelKey, colorClass }) => {
    // Import hook inside the component so valid hook call
    const { t } = useTranslation();
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`w-full aspect-square rounded-2xl bg-[#27272A] flex flex-col items-center justify-center gap-2 border border-[#3F3F46] ${className}`}
        >
            <span className="text-4xl">{emoji}</span>
            <span className={`text-xs font-bold ${colorClass}`}>{t(labelKey)}</span>
        </motion.button>
    );
};

RatingFaces.Sad = ({ onClick, className = '' }) => (
    <RatedButton onClick={onClick} className={className} emoji="😞" labelKey="rateAgain" colorClass="text-[#EF4444]" />
);

RatingFaces.Worried = ({ onClick, className = '' }) => (
    <RatedButton onClick={onClick} className={className} emoji="😐" labelKey="rateHard" colorClass="text-[#F59E0B]" />
);

RatingFaces.Happy = ({ onClick, className = '' }) => (
    <RatedButton onClick={onClick} className={className} emoji="🙂" labelKey="rateGood" colorClass="text-[#3B82F6]" />
);

RatingFaces.Excited = ({ onClick, className = '' }) => (
    <RatedButton onClick={onClick} className={className} emoji="🤩" labelKey="rateEasy" colorClass="text-[#22C55E]" />
);

export default AnimatedIcon;
