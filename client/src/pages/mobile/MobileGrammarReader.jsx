import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import MobileMarkdownRenderer from '../../components/mobile/MobileMarkdownRenderer';
import {
    ChevronLeft,
    Type,
    Maximize2,
    Minimize2,
    MoreVertical,
    Edit2,
    Trash2,
    Loader2,
    ChevronRight,
    BookOpen
} from 'lucide-react';

import { useTranslation } from '../../hooks/useTranslation';

function MobileGrammarReader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fontSize, setFontSize] = useState(16);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        fetchTopic();
    }, [id]);

    const fetchTopic = async () => {
        setLoading(true);
        try {
            const res = await api.get(`grammar/${id}/`);
            setTopic(res.data);
        } catch (err) {
            console.error('Failed to fetch topic:', err);
            navigate('/m/grammar');
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(progress);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this topic?')) return;
        try {
            await api.delete(`grammar/${id}/`);
            // Navigate back to grammar list
            navigate('/m/grammar', { replace: true });
        } catch (err) {
            console.error('Failed to delete topic:', err);
            alert('Failed to delete topic. Please try again.');
        }
    };

    const handleEdit = () => {
        // Navigate to generator with the current topic for editing
        navigate('/m/grammar/generate', {
            state: {
                editTopic: {
                    id: topic.id,
                    title: topic.title,
                    level: topic.level,
                    content: topic.content,
                    category: topic.category,
                    examples: topic.examples
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
                <Loader2 size={32} color="#6366F1" className="animate-spin" />
            </div>
        );
    }

    if (!topic) return null;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#09090B' }}>
            {/* Progress Bar */}
            <div className="h-1 w-full bg-[#27272A] fixed top-0 z-50">
                <div
                    className="h-full bg-[#6366F1] transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Header (Hidden in Full Screen) */}
            <AnimatePresence>
                {!isFullScreen && (
                    <motion.div
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        className="sticky top-0 z-40 px-4 py-3 border-b border-[#27272A] flex items-center justify-between"
                        style={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(10px)' }}
                    >
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/m/grammar')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                        >
                            <ChevronLeft size={22} color="#A1A1AA" />
                        </motion.button>

                        <div className="flex items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowSettings(!showSettings)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showSettings ? 'bg-[#27272A]' : ''}`}
                            >
                                <Type size={20} color={showSettings ? '#FAFAFA' : '#A1A1AA'} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsFullScreen(true)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                            >
                                <Maximize2 size={20} color="#A1A1AA" />
                            </motion.button>
                            <div className="relative">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowMenu(!showMenu)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showMenu ? 'bg-[#27272A]' : ''}`}
                                >
                                    <MoreVertical size={20} color={showMenu ? '#FAFAFA' : '#A1A1AA'} />
                                </motion.button>

                                <AnimatePresence>
                                    {showMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute ltr:right-0 rtl:left-0 top-12 w-48 rounded-xl overflow-hidden shadow-2xl border border-[#27272A] z-50 bg-[#1C1C1F]"
                                            style={{ backgroundColor: '#1C1C1F' }}
                                        >
                                            <button
                                                onClick={handleEdit}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
                                            >
                                                <Edit2 size={16} /> <span>{t('edit')}</span>
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-sm font-medium text-[#EF4444] hover:bg-[#27272A] transition-colors"
                                            >
                                                <Trash2 size={16} /> <span>{t('delete')}</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Font Settings Panel */}
            <AnimatePresence>
                {showSettings && !isFullScreen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-[#27272A]"
                        style={{ backgroundColor: '#141416' }}
                    >
                        <div className="p-4 flex items-center justify-center gap-6">
                            <button
                                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#27272A] hover:bg-[#27272A] transition-colors"
                            >
                                <span className="text-xs font-bold text-[#FAFAFA]">A-</span>
                            </button>
                            <span className="text-sm font-medium text-[#A1A1AA] w-16 text-center">
                                {fontSize}px
                            </span>
                            <button
                                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#27272A] hover:bg-[#27272A] transition-colors"
                            >
                                <span className="text-lg font-bold text-[#FAFAFA]">A+</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Screen Exit Button */}
            {isFullScreen && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setIsFullScreen(false)}
                    className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#27272A]/80 backdrop-blur-md flex items-center justify-center z-50 border border-[#3F3F46]"
                >
                    <Minimize2 size={20} color="#FAFAFA" />
                </motion.button>
            )}

            {/* Content Area */}
            <div
                ref={contentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-5 py-6"
            >
                <div className="max-w-2xl mx-auto pb-20">
                    {/* Title Block */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">
                                {topic.level}
                            </span>
                            <span className="text-xs font-medium text-[#71717A] flex items-center gap-1">
                                <ChevronRight size={12} />
                                {topic.category}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-[#FAFAFA] leading-tight">
                            {topic.title}
                        </h1>
                    </div>

                    {/* Markdown Content */}
                    <MobileMarkdownRenderer content={topic.content} fontSize={fontSize} />

                    {/* Examples Section */}
                    {topic.examples && topic.examples.length > 0 && (
                        <div className="mt-10 pt-8 border-t border-[#27272A]">
                            <h3 className="text-lg font-bold text-[#FAFAFA] mb-6 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#6366F1]/20 flex items-center justify-center">
                                    <BookOpen size={16} color="#6366F1" />
                                </div>
                                Examples
                            </h3>
                            <div className="space-y-3">
                                {topic.examples.map((example, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-xl border border-[#27272A] bg-[#141416]"
                                    >
                                        <div className="mb-1">
                                            <MobileMarkdownRenderer content={example.german} fontSize={18} />
                                        </div>
                                        {example.english && (
                                            <div className="text-[#A1A1AA] text-sm">
                                                <MobileMarkdownRenderer content={example.english} fontSize={14} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MobileGrammarReader;
