import React from 'react';
import { motion } from 'framer-motion';

// ==========================================
// ANIMATED ICONS FOR AI GENERATORS
// Premium, unique icons with smooth animations
// ==========================================

// Story Weaver Icon - Animated book with sparkles
export const StoryIcon = ({ size = 32, className = '' }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={className}
    >
        {/* Book pages */}
        <motion.path
            d="M8 12C8 10.9 8.9 10 10 10H22V38H10C8.9 38 8 37.1 8 36V12Z"
            fill="url(#storyGrad1)"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
            d="M26 10H38C39.1 10 40 10.9 40 12V36C40 37.1 39.1 38 38 38H26V10Z"
            fill="url(#storyGrad2)"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Sparkles */}
        <motion.circle
            cx="18" cy="6" r="2"
            fill="#FBBF24"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
            cx="32" cy="8" r="1.5"
            fill="#F472B6"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.circle
            cx="24" cy="4" r="1"
            fill="#60A5FA"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <defs>
            <linearGradient id="storyGrad1" x1="8" y1="10" x2="22" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="storyGrad2" x1="26" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
        </defs>
    </motion.svg>
);

// Dialogue Icon - Animated chat bubbles
export const DialogueIcon = ({ size = 32, className = '' }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={className}
    >
        {/* First bubble */}
        <motion.path
            d="M8 14C8 11.8 9.8 10 12 10H28C30.2 10 32 11.8 32 14V22C32 24.2 30.2 26 28 26H16L10 32V26H12C9.8 26 8 24.2 8 22V14Z"
            fill="url(#chatGrad1)"
            initial={{ x: 0 }}
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Second bubble */}
        <motion.path
            d="M16 22C16 19.8 17.8 18 20 18H36C38.2 18 40 19.8 40 22V30C40 32.2 38.2 34 36 34H32L38 40V34H36C38.2 34 40 32.2 40 30V22Z"
            fill="url(#chatGrad2)"
            initial={{ x: 0 }}
            animate={{ x: [2, -2, 2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Typing dots */}
        <motion.circle cx="14" cy="18" r="1.5" fill="#fff"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.circle cx="18" cy="18" r="1.5" fill="#fff"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        />
        <motion.circle cx="22" cy="18" r="1.5" fill="#fff"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
        <defs>
            <linearGradient id="chatGrad1" x1="8" y1="10" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EC4899" />
                <stop offset="1" stopColor="#F43F5E" />
            </linearGradient>
            <linearGradient id="chatGrad2" x1="16" y1="18" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
    </motion.svg>
);

// Article Icon - Animated document with flowing text
export const ArticleIcon = ({ size = 32, className = '' }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={className}
    >
        {/* Document */}
        <motion.rect
            x="10" y="6" width="28" height="36" rx="4"
            fill="url(#articleGrad)"
            initial={{ y: 0 }}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Text lines animating */}
        <motion.rect x="16" y="14" width="16" height="3" rx="1.5" fill="#fff"
            animate={{ width: [16, 12, 16] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.rect x="16" y="20" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"
            animate={{ width: [12, 16, 12] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.rect x="16" y="25" width="14" height="2" rx="1" fill="rgba(255,255,255,0.6)"
            animate={{ width: [14, 10, 14] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
        <motion.rect x="16" y="30" width="10" height="2" rx="1" fill="rgba(255,255,255,0.6)"
            animate={{ width: [10, 14, 10] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        {/* Pen */}
        <motion.g
            animate={{ rotate: [-5, 5, -5], x: [0, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
            <path d="M38 8L42 4L44 6L40 10L38 8Z" fill="#FBBF24" />
            <path d="M36 10L38 8L40 10L38 12L36 10Z" fill="#F59E0B" />
        </motion.g>
        <defs>
            <linearGradient id="articleGrad" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#059669" />
            </linearGradient>
        </defs>
    </motion.svg>
);

// Genre Icons with animations
export const GenreIcons = {
    'Daily Life': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🏠</motion.div>
    ),
    'Adventure': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [0, 10, -10, 0], y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🗺️</motion.div>
    ),
    'Sci-Fi': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >🚀</motion.div>
    ),
    'Fantasy': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="text-2xl"
        >🐉</motion.div>
    ),
    'Mystery': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >🔍</motion.div>
    ),
    'Romance': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.2, 1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-2xl"
        >💕</motion.div>
    ),
    'Horror': ({ size = 24 }) => (
        <motion.div
            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >👻</motion.div>
    ),
    'Comedy': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-2xl"
        >😂</motion.div>
    ),
    'Drama': ({ size = 24 }) => (
        <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-2xl"
        >🎭</motion.div>
    ),
    'Historical': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🏛️</motion.div>
    ),
    'Thriller': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.1, 1], x: [-1, 1, -1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-2xl"
        >😰</motion.div>
    ),
    'Fairy Tale': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -4, 0], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🧚</motion.div>
    ),
};

// Tone Icons with animations
export const ToneIcons = {
    'Neutral': ({ size = 24 }) => (
        <motion.div className="text-2xl">😐</motion.div>
    ),
    'Formal': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >👔</motion.div>
    ),
    'Casual': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-2xl"
        >😎</motion.div>
    ),
    'Humorous': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="text-2xl"
        >😂</motion.div>
    ),
    'Argumentative': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-2xl"
        >🔥</motion.div>
    ),
    'Romantic': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.3, 1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-2xl"
        >💕</motion.div>
    ),
    'Professional': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >💼</motion.div>
    ),
    'Supportive': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >🤗</motion.div>
    ),
    'Mysterious': ({ size = 24 }) => (
        <motion.div
            animate={{ opacity: [1, 0.6, 1], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🔮</motion.div>
    ),
};

// Article Style Icons
export const StyleIcons = {
    'Informative': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >📰</motion.div>
    ),
    'Blog': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-2xl"
        >✍️</motion.div>
    ),
    'Academic': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🎓</motion.div>
    ),
    'Opinion': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-2xl"
        >💭</motion.div>
    ),
    'Educational': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >💡</motion.div>
    ),
    'Technical': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="text-2xl"
        >⚙️</motion.div>
    ),
};

// Scenario Preset Icons
export const ScenarioIcons = {
    'cafe': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >☕</motion.div>
    ),
    'shopping': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-2xl"
        >🛍️</motion.div>
    ),
    'airport': ({ size = 24 }) => (
        <motion.div
            animate={{ x: [-2, 10, -2], y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >✈️</motion.div>
    ),
    'doctor': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >🏥</motion.div>
    ),
    'interview': ({ size = 24 }) => (
        <motion.div
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >💼</motion.div>
    ),
    'restaurant': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
        >🍽️</motion.div>
    ),
    'hotel': ({ size = 24 }) => (
        <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
        >🏨</motion.div>
    ),
    'phone': ({ size = 24 }) => (
        <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-2xl"
        >📞</motion.div>
    ),
};

// Magic Wand Icon for Generate button
export const MagicWandIcon = ({ size = 24, className = '' }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
    >
        <motion.path
            d="M15 4L20 9L9 20L4 15L15 4Z"
            fill="url(#wandGrad)"
        />
        <motion.circle cx="18" cy="3" r="1.5" fill="#FBBF24"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.circle cx="21" cy="6" r="1" fill="#F472B6"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
        />
        <motion.circle cx="20" cy="1" r="0.8" fill="#60A5FA"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
        />
        <defs>
            <linearGradient id="wandGrad" x1="4" y1="15" x2="20" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
        </defs>
    </motion.svg>
);

// Sparkle Loader for generating state
export const SparkleLoader = ({ size = 48, className = '' }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <motion.circle
                key={angle}
                cx={24 + 16 * Math.cos((angle * Math.PI) / 180)}
                cy={24 + 16 * Math.sin((angle * Math.PI) / 180)}
                r={3}
                fill={`hsl(${angle}, 70%, 60%)`}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
            />
        ))}
    </motion.svg>
);

export default {
    StoryIcon,
    DialogueIcon,
    ArticleIcon,
    GenreIcons,
    ToneIcons,
    StyleIcons,
    ScenarioIcons,
    MagicWandIcon,
    SparkleLoader
};
