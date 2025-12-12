import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDownIcon,
    SpeakerWaveIcon,
    StopIcon,
    LanguageIcon,
    AdjustmentsHorizontalIcon,
    BookmarkIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslationStyle } from '../../utils/bidi';

/**
 * Enhanced story display component with reader tools
 */
const MobileStoryDisplay = ({
    content,
    title,
    level,
    topic
}) => {
    // Get native language for RTL support
    const { nativeLanguage, isNativeRTL } = useLanguage();

    // Support both 'events' and 'chapters' field names
    const events = content?.events || content?.chapters || [];
    const [expandedEvent, setExpandedEvent] = useState(0);
    const [showTranslation, setShowTranslation] = useState({});
    const [fontSize, setFontSize] = useState(16);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingEvent, setSpeakingEvent] = useState(null);
    const [showTools, setShowTools] = useState(false);
    const [bookmarkedEvents, setBookmarkedEvents] = useState({});

    // Render styled text with proper vocabulary highlights
    const renderStyledText = (text) => {
        if (!text) return null;
        const parts = text.split(/\*\*(.+?)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <span
                        key={index}
                        className="bg-gradient-to-r from-[#8B5CF6]/30 to-[#7C3AED]/30 text-[#A78BFA] font-semibold px-1 py-0.5 rounded border-b border-[#8B5CF6]/50"
                    >
                        {part}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    // Text-to-speech
    const speakEvent = (eventIndex, text) => {
        if ('speechSynthesis' in window) {
            if (isSpeaking && speakingEvent === eventIndex) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setSpeakingEvent(null);
                return;
            }

            window.speechSynthesis.cancel();
            const cleanText = text.replace(/\*\*/g, '');

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'de-DE';
            utterance.rate = 0.85;
            utterance.onend = () => {
                setIsSpeaking(false);
                setSpeakingEvent(null);
            };

            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
            setSpeakingEvent(eventIndex);
        }
    };

    const toggleBookmark = (index) => {
        setBookmarkedEvents(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const toggleTranslation = (index) => {
        setShowTranslation(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const adjustFontSize = (delta) => {
        setFontSize(prev => Math.min(22, Math.max(14, prev + delta)));
    };

    return (
        <div className="min-h-screen bg-[#09090B]">
            {/* Compact Header */}
            <div className="px-4 py-3 border-b border-[#27272A] bg-gradient-to-r from-[#8B5CF6]/10 to-transparent">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-white leading-tight line-clamp-2">
                            {title || content?.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-[#8B5CF6]/20 rounded-full text-[10px] font-bold text-[#A78BFA]">
                                {level}
                            </span>
                            <span className="text-[11px] text-[#71717A]">
                                {events.length} chapters
                            </span>
                        </div>
                    </div>

                    {/* Tools Toggle */}
                    <button
                        onClick={() => setShowTools(!showTools)}
                        className={`p-2 rounded-lg transition-colors ${showTools ? 'bg-[#8B5CF6] text-white' : 'bg-[#27272A] text-[#A1A1AA]'}`}
                    >
                        <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Reader Tools Panel */}
                <AnimatePresence>
                    {showTools && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-2 pt-3 pb-1">
                                {/* Font Size */}
                                <div className="flex items-center gap-1 bg-[#18181B] rounded-lg px-2 py-1.5">
                                    <button
                                        onClick={() => adjustFontSize(-1)}
                                        className="w-7 h-7 rounded bg-[#27272A] text-white font-bold text-sm"
                                    >
                                        A-
                                    </button>
                                    <span className="text-xs text-[#71717A] w-8 text-center">{fontSize}</span>
                                    <button
                                        onClick={() => adjustFontSize(1)}
                                        className="w-7 h-7 rounded bg-[#27272A] text-white font-bold text-sm"
                                    >
                                        A+
                                    </button>
                                </div>

                                {/* Translation Toggle All */}
                                <button
                                    onClick={() => {
                                        const allShown = events.every((_, i) => showTranslation[i]);
                                        const newState = {};
                                        events.forEach((_, i) => newState[i] = !allShown);
                                        setShowTranslation(newState);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-white transition-colors"
                                >
                                    <LanguageIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium">Translate</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Story Events - Full Width */}
            <div className="pb-32">
                {events.map((event, index) => (
                    <div key={index} className="border-b border-[#1F1F23]">
                        {/* Event Header */}
                        <button
                            onClick={() => setExpandedEvent(expandedEvent === index ? -1 : index)}
                            className="w-full px-4 py-4 flex items-center justify-between bg-[#0D0D0F] hover:bg-[#111113] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <span className="font-semibold text-white text-left text-[15px]">
                                    {event.title || event.heading || `Chapter ${index + 1}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {bookmarkedEvents[index] && (
                                    <BookmarkSolidIcon className="w-4 h-4 text-[#F59E0B]" />
                                )}
                                <motion.div
                                    animate={{ rotate: expandedEvent === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDownIcon className="w-5 h-5 text-[#52525B]" />
                                </motion.div>
                            </div>
                        </button>

                        {/* Event Content */}
                        <AnimatePresence>
                            {expandedEvent === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 pt-2 bg-[#0A0A0C]">
                                        {/* Quick Actions Bar */}
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1F23]">
                                            {/* Read Aloud */}
                                            <button
                                                onClick={() => speakEvent(index, event.content)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSpeaking && speakingEvent === index
                                                    ? 'bg-[#EF4444] text-white'
                                                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-white'
                                                    }`}
                                            >
                                                {isSpeaking && speakingEvent === index ? (
                                                    <>
                                                        <StopIcon className="w-4 h-4" />
                                                        Stop
                                                    </>
                                                ) : (
                                                    <>
                                                        <SpeakerWaveIcon className="w-4 h-4" />
                                                        Listen
                                                    </>
                                                )}
                                            </button>

                                            {/* Translation Toggle */}
                                            <button
                                                onClick={() => toggleTranslation(index)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranslation[index]
                                                    ? 'bg-[#6366F1] text-white'
                                                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-white'
                                                    }`}
                                            >
                                                <LanguageIcon className="w-4 h-4" />
                                                {showTranslation[index] ? 'Original' : 'Translate'}
                                            </button>

                                            {/* Bookmark */}
                                            <button
                                                onClick={() => toggleBookmark(index)}
                                                className={`p-1.5 rounded-lg transition-colors ${bookmarkedEvents[index]
                                                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-white'
                                                    }`}
                                            >
                                                {bookmarkedEvents[index] ? (
                                                    <BookmarkSolidIcon className="w-4 h-4" />
                                                ) : (
                                                    <BookmarkIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Event Image */}
                                        {event.image_status && (
                                            <div className="mb-4 rounded-lg overflow-hidden">
                                                {event.image_status === 'completed' && event.image_base64 ? (
                                                    <img
                                                        src={`data:image/png;base64,${event.image_base64}`}
                                                        alt={event.title || `Chapter ${index + 1}`}
                                                        className="w-full h-48 object-cover rounded-lg"
                                                    />
                                                ) : event.image_status === 'generating' ? (
                                                    <div className="w-full h-48 bg-gradient-to-r from-[#27272A] to-[#1F1F23] rounded-lg flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                            <p className="text-xs text-[#71717A]">Generating image...</p>
                                                        </div>
                                                    </div>
                                                ) : event.image_status === 'pending' ? (
                                                    <div className="w-full h-48 bg-gradient-to-r from-[#27272A] to-[#1F1F23] rounded-lg flex items-center justify-center">
                                                        <p className="text-xs text-[#71717A]">🖼️ Image pending...</p>
                                                    </div>
                                                ) : event.image_status === 'failed' ? (
                                                    <div className="w-full h-32 bg-[#1F1F23] rounded-lg flex items-center justify-center">
                                                        <p className="text-xs text-[#EF4444]">⚠️ Image failed to generate</p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}

                                        {/* Content Text */}
                                        <div
                                            className="text-[#E4E4E7] leading-[1.85] tracking-wide"
                                            style={{ fontSize: `${fontSize}px` }}
                                        >
                                            {showTranslation[index] ? (
                                                <p
                                                    className="italic"
                                                    style={{
                                                        ...getTranslationStyle(nativeLanguage),
                                                        color: '#A1A1AA',
                                                    }}
                                                >
                                                    {event.translation || 'Translation not available'}
                                                </p>
                                            ) : (
                                                renderStyledText(event.content)
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Vocabulary Footer */}
            {content?.vocabulary?.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-[#18181B]/95 backdrop-blur border-t border-[#27272A]">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <SparklesIcon className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                        {content.vocabulary.map((word, i) => (
                            <span
                                key={i}
                                className="px-2.5 py-1 bg-[#27272A] rounded-full text-xs text-[#A78BFA] font-medium whitespace-nowrap"
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileStoryDisplay;
