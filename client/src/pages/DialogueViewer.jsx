import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftIcon,
    UserCircleIcon,
    ChatBubbleLeftRightIcon,
    PlayIcon,
    ArrowPathIcon,
    LanguageIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';
import { getTranslationStyle } from '../utils/bidi';

function DialogueViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { nativeLanguage } = useLanguage();
    const [dialogue, setDialogue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [revealedTranslations, setRevealedTranslations] = useState(new Set());

    const toggleTranslation = (idx) => {
        setRevealedTranslations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(idx)) {
                newSet.delete(idx);
            } else {
                newSet.add(idx);
            }
            return newSet;
        });
    };

    const [visibleMessages, setVisibleMessages] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchDialogue = async () => {
            try {
                const res = await api.get(`ai/generated-content/${id}/`);
                setDialogue(res.data);
                // Start with first message visible
                setVisibleMessages(1);
            } catch (err) {
                console.error('Failed to fetch dialogue', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDialogue();
    }, [id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [visibleMessages]);

    const showNextMessage = () => {
        if (dialogue && visibleMessages < dialogue.content_data.messages.length) {
            setVisibleMessages(prev => prev + 1);
        }
    };

    const resetDialogue = () => {
        setVisibleMessages(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!dialogue) return null;

    const messages = dialogue.content_data.messages;
    const characters = dialogue.content_data.characters;
    const isComplete = visibleMessages === messages.length;

    // Helper to get character info
    const getCharacter = (name) => characters.find(c => c.name === name) || { name, role: 'Speaker' };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/advanced-text-generator')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>

                    <div className="flex-1">
                        <h1 className="font-bold text-slate-900 truncate">{dialogue.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{dialogue.level}</span>
                            <span>•</span>
                            <span>{characters.map(c => c.name).join(' & ')}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={resetDialogue}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Restart"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.slice(0, visibleMessages).map((msg, idx) => {
                        const isFirstChar = msg.speaker === characters[0].name;
                        const charInfo = getCharacter(msg.speaker);
                        const isTranslated = revealedTranslations.has(idx);

                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`flex gap-3 ${isFirstChar ? 'justify-start' : 'justify-end'}`}
                            >
                                {isFirstChar && (
                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                                            {msg.speaker[0]}
                                        </div>
                                    </div>
                                )}

                                <div className={`max-w-[80%] space-y-1 ${isFirstChar ? 'items-start' : 'items-end flex flex-col'}`}>
                                    <div className="flex items-baseline gap-2 px-1">
                                        <span className="text-xs font-medium text-slate-500">{msg.speaker}</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{charInfo.role}</span>
                                    </div>

                                    <div className={`group relative rounded-2xl px-5 py-3 shadow-sm transition-all ${isFirstChar
                                        ? 'bg-white text-slate-800 rounded-tl-none'
                                        : 'bg-indigo-600 text-white rounded-tr-none'
                                        }`}>
                                        <div className={`prose prose-sm max-w-none ${isFirstChar ? 'prose-indigo' : 'prose-invert'}`}>
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p className="m-0" {...props} />,
                                                    strong: ({ node, ...props }) => (
                                                        <span className={`font-bold px-1 rounded ${isFirstChar
                                                            ? 'bg-indigo-50 text-indigo-700'
                                                            : 'bg-white/20 text-white'
                                                            }`} {...props} />
                                                    )
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Translation Button */}
                                        {msg.translation && (
                                            <button
                                                onClick={() => toggleTranslation(idx)}
                                                className={`absolute -bottom-6 ${isFirstChar ? 'left-0' : 'right-0'} p-1 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isTranslated ? 'text-indigo-600 opacity-100' : 'text-slate-400'
                                                    }`}
                                            >
                                                <LanguageIcon className="h-3 w-3" />
                                                {isTranslated ? 'Hide' : 'Translate'}
                                            </button>
                                        )}

                                        {/* Translation Text */}
                                        <AnimatePresence>
                                            {isTranslated && msg.translation && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={`mt-2 pt-2 border-t text-sm ${isFirstChar ? 'border-slate-100 text-slate-600' : 'border-indigo-500 text-indigo-100'
                                                        }`}
                                                    style={getTranslationStyle(nativeLanguage)}
                                                >
                                                    {msg.translation}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {!isFirstChar && (
                                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border-2 border-white shadow-sm">
                                            {msg.speaker[0]}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Controls */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${(visibleMessages / messages.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-500 w-12 text-right">
                        {visibleMessages}/{messages.length}
                    </span>

                    {!isComplete ? (
                        <button
                            onClick={showNextMessage}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                        >
                            <span>Next</span>
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </button>
                    ) : (
                        <button
                            onClick={resetDialogue}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            <span>Replay</span>
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}

export default DialogueViewer;
