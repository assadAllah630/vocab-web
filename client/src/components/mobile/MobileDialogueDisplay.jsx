import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, ChatBubbleLeftRightIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/outline';

/**
 * Shared dialogue display component used by both:
 * - MobileGenDialogue (after generation)
 * - MobileDialogueViewer (viewing saved content)
 */
const MobileDialogueDisplay = ({
    content,        // The generated content object
    title,          // Dialogue title
    level,          // Language level (A1, B2, etc)
    tone,           // Conversation tone
    showSequential = false, // Whether to reveal messages one by one
    initialVisibleCount = null // For sequential mode
}) => {
    const messages = content?.messages || [];
    const totalMessages = messages.length;

    // State for sequential reveal (only used when showSequential is true)
    const [visibleCount, setVisibleCount] = useState(
        showSequential ? (initialVisibleCount || 1) : totalMessages
    );
    const [showTranslation, setShowTranslation] = useState({});
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMsg, setSpeakingMsg] = useState(null);

    // Text-to-speech
    const speakMessage = (index, text) => {
        if ('speechSynthesis' in window) {
            if (isSpeaking && speakingMsg === index) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setSpeakingMsg(null);
                return;
            }
            window.speechSynthesis.cancel();
            const cleanText = text.replace(/\*\*/g, '');
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'de-DE';
            utterance.rate = 0.85;
            utterance.onend = () => { setIsSpeaking(false); setSpeakingMsg(null); };
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
            setSpeakingMsg(index);
        }
    };

    // Avatar colors for speakers
    const avatarColors = [
        'bg-gradient-to-br from-[#6366F1] to-[#4F46E5]',
        'bg-gradient-to-br from-[#14B8A6] to-[#0D9488]',
        'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]',
        'bg-gradient-to-br from-[#06B6D4] to-[#0891B2]',
    ];

    // Get speaker index for consistent coloring
    const getSpeakerIndex = (speaker) => {
        const speakers = messages.map(m => m.speaker);
        const uniqueSpeakers = [...new Set(speakers)];
        return uniqueSpeakers.indexOf(speaker);
    };

    // Render styled text with vocabulary highlights
    const renderStyledText = (text, isColored) => {
        if (!text) return null;
        const parts = text.split(/\*\*(.+?)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <span
                        key={index}
                        className={`font-bold px-1 py-0.5 rounded ${isColored
                            ? 'bg-black/20 text-white underline decoration-white/50'
                            : 'bg-[#6366F1]/20 text-[#A5B4FC] underline decoration-[#6366F1]/50'
                            }`}
                    >
                        {part}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    // Message bubble component
    const MessageBubble = ({ msg, index, isNew }) => {
        const speakerIdx = getSpeakerIndex(msg.speaker);
        const isMe = speakerIdx % 2 !== 0;
        const avatarColor = avatarColors[speakerIdx % avatarColors.length];
        const initial = msg.speaker?.charAt(0).toUpperCase() || '?';
        const shouldAnimate = showSequential && isNew;

        return (
            <motion.div
                initial={shouldAnimate ? { opacity: 0, x: isMe ? 30 : -30, scale: 0.9 } : false}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
                className={`flex items-start gap-2.5 mb-5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
                {/* Avatar */}
                <motion.div
                    initial={shouldAnimate ? { scale: 0, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: shouldAnimate ? 0.1 : 0 }}
                    className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                    <span className="text-white text-sm font-bold">{initial}</span>
                </motion.div>

                {/* Message content */}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <motion.div
                        initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20, delay: shouldAnimate ? 0.15 : 0 }}
                        className={`px-4 py-3 ${isMe
                            ? `${avatarColor} rounded-2xl rounded-br-sm`
                            : 'bg-[#262626] rounded-2xl rounded-bl-sm'
                            }`}
                    >
                        <p className="text-[15px] leading-[1.55] text-white">
                            {renderStyledText(msg.text, isMe)}
                        </p>
                    </motion.div>

                    {/* Translation section */}
                    <div className={`${isMe ? 'items-end' : 'items-start'} flex flex-col w-full`}>
                        {/* Action buttons row */}
                        <div className={`flex gap-2 mt-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Listen button */}
                            <button
                                onClick={() => speakMessage(index, msg.text)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${isSpeaking && speakingMsg === index
                                    ? 'bg-[#EF4444]/20 text-[#EF4444]'
                                    : 'text-[#71717A] hover:text-[#A1A1AA]'
                                    }`}
                            >
                                {isSpeaking && speakingMsg === index ? (
                                    <><StopIcon className="w-3 h-3" /> Stop</>
                                ) : (
                                    <><SpeakerWaveIcon className="w-3 h-3" /> Listen</>
                                )}
                            </button>

                            {/* Translation toggle */}
                            {msg.translation && (
                                <button
                                    onClick={() => setShowTranslation(prev => ({
                                        ...prev,
                                        [index]: !prev[index]
                                    }))}
                                    className="text-[11px] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
                                >
                                    {showTranslation[index] ? '▼ Hide' : '▶ Translate'}
                                </button>
                            )}
                        </div>

                        {msg.translation && (
                            <AnimatePresence>
                                {showTranslation[index] && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full overflow-hidden"
                                    >
                                        <div className={`mt-1 px-4 py-2.5 bg-[#1A1A1C] border-l-2 ${isMe ? 'border-[#6366F1]/50' : 'border-[#52525B]'} rounded-r-xl rounded-l-sm`}>
                                            <p className="text-[13px] text-[#A1A1AA] leading-[1.5]">
                                                {msg.translation}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    // Handle tap to continue (for sequential mode)
    const handleChatTap = () => {
        if (showSequential && visibleCount < totalMessages) {
            setVisibleCount(prev => Math.min(prev + 1, totalMessages));
        }
    };

    // Typing indicator for sequential mode
    const TypingIndicator = () => {
        if (!showSequential || visibleCount >= totalMessages) return null;

        const nextMsg = messages[visibleCount];
        const nextSpeakerIdx = getSpeakerIndex(nextMsg?.speaker);
        const isNextMe = nextSpeakerIdx % 2 !== 0;
        const nextAvatarColor = avatarColors[nextSpeakerIdx % avatarColors.length];
        const nextInitial = nextMsg?.speaker?.charAt(0).toUpperCase() || '?';

        return (
            <motion.div
                key={`typing-${visibleCount}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2.5 mb-4 ${isNextMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
                <div className={`w-8 h-8 rounded-full ${nextAvatarColor} flex items-center justify-center flex-shrink-0 opacity-60`}>
                    <span className="text-white text-xs font-bold">{nextInitial}</span>
                </div>
                <div className={`px-4 py-3 bg-[#262626] ${isNextMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}>
                    <div className="flex gap-1">
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-[#52525B] rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 bg-[#52525B] rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 bg-[#52525B] rounded-full" />
                    </div>
                </div>
            </motion.div>
        );
    };

    const displayedMessages = showSequential ? messages.slice(0, visibleCount) : messages;

    return (
        <div className="space-y-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#27272A] bg-[#0D0D0F]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">{title || content?.title}</h2>
                        <p className="text-xs text-[#71717A]">{tone} • {level}</p>
                    </div>
                    {showSequential && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#27272A] rounded-full">
                            <span className="text-xs font-medium text-[#A1A1AA]">{visibleCount}/{totalMessages}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Container */}
            <div
                className="bg-[#0D0D0F] min-h-[50vh] px-3 py-4"
                onClick={handleChatTap}
            >
                {displayedMessages.map((msg, i) => (
                    <MessageBubble
                        key={i}
                        msg={msg}
                        index={i}
                        isNew={showSequential && i === visibleCount - 1}
                    />
                ))}

                <TypingIndicator />

                {/* End indicator */}
                {(!showSequential || visibleCount >= totalMessages) && totalMessages > 0 && (
                    <div className="flex justify-center pt-6">
                        <span className="text-xs text-[#52525B]">— End of conversation —</span>
                    </div>
                )}
            </div>

            {/* Key Phrases */}
            {content?.key_phrases?.length > 0 && (
                <div className="px-4 py-3 bg-[#18181B] border-t border-[#27272A]">
                    <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-sm font-bold text-white">Key Phrases</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {content.key_phrases.map((phrase, i) => (
                            <span key={i} className="px-2 py-1 bg-[#27272A] rounded-md text-xs text-[#D4D4D8]">
                                {phrase}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileDialogueDisplay;
