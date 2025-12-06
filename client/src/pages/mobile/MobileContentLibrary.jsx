import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpenIcon,
    NewspaperIcon,
    ChatBubbleLeftRightIcon,
    TrashIcon,
    PlusIcon,
    SparklesIcon,
    ChevronRightIcon,
    WifiIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon } from '@heroicons/react/24/solid';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import api from '../../api';
import { generatedContentStorage, useOnlineStatus, cacheImages } from '../../utils/offlineStorage';

const FILTER_TABS = [
    { id: 'all', label: 'All', emoji: '✨' },
    { id: 'story', label: 'Stories', emoji: '📖' },
    { id: 'article', label: 'Articles', emoji: '📰' },
    { id: 'dialogue', label: 'Dialogues', emoji: '💬' }
];

const getTypeColor = (type) => {
    switch (type) {
        case 'story': return 'from-[#8B5CF6] to-[#6366F1]';
        case 'article': return 'from-[#10B981] to-[#059669]';
        case 'dialogue': return 'from-[#EC4899] to-[#F43F5E]';
        default: return 'from-[#6366F1] to-[#8B5CF6]';
    }
};

const getTypeIcon = (type) => {
    switch (type) {
        case 'story': return <BookOpenIcon className="w-5 h-5" />;
        case 'article': return <NewspaperIcon className="w-5 h-5" />;
        case 'dialogue': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
        default: return <BookOpenIcon className="w-5 h-5" />;
    }
};

const ContentCard = ({ item, onDelete, onFavorite, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden active:bg-[#27272A]/50 transition-colors"
    >
        <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColor(item.content_type)} flex items-center justify-center text-white`}>
                    {getTypeIcon(item.content_type)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-[#71717A] capitalize">{item.content_type}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onFavorite(item.id); }}
                    className="p-2 -m-2"
                >
                    <HeartIcon className={`w-5 h-5 ${item.is_favorite ? 'text-[#F43F5E]' : 'text-[#3F3F46]'}`} />
                </button>
            </div>

            {/* Topic/Description */}
            <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">
                {item.topic || 'No description'}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 bg-[#27272A] rounded-lg text-xs font-medium text-[#D4D4D8]">
                    📚 {item.level}
                </span>
                <span className="px-2 py-1 bg-[#27272A] rounded-lg text-xs font-medium text-[#D4D4D8]">
                    📝 {item.total_words || 0} words
                </span>
                <span className="text-xs text-[#52525B] ml-auto">
                    {new Date(item.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#27272A] bg-[#0D0D0F]">
            <span className="text-xs text-[#6366F1] font-medium">Tap to read</span>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-2 text-[#52525B] hover:text-red-500 transition-colors"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
                <ChevronRightIcon className="w-4 h-4 text-[#52525B]" />
            </div>
        </div>
    </motion.div>
);

const MobileContentLibrary = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const isOnline = useOnlineStatus();

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setLoading(true);
        try {
            // Try cache first
            const cached = await generatedContentStorage.getAll();
            if (cached.length > 0) {
                setContent(cached);
                setLoading(false);
            }

            // If online, fetch fresh data
            if (navigator.onLine) {
                const res = await api.get('ai/generated-content/');
                setContent(res.data);
                await generatedContentStorage.saveAll(res.data);

                // Cache images for offline
                const imageUrls = res.data
                    .filter(item => item.image_url)
                    .map(item => item.image_url);
                if (imageUrls.length > 0) {
                    cacheImages(imageUrls);
                }
            }
        } catch (err) {
            console.error('Failed to fetch content', err);
            // Fall back to cache
            const cached = await generatedContentStorage.getAll();
            if (cached.length > 0) {
                setContent(cached);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this content?')) {
            try {
                await api.delete(`ai/generated-content/${id}/delete/`);
                setContent(prev => prev.filter(item => item.id !== id));
            } catch (err) {
                console.error('Failed to delete', err);
            }
        }
    };

    const toggleFavorite = async (id) => {
        try {
            const res = await api.post(`ai/generated-content/${id}/favorite/`);
            setContent(prev => prev.map(item =>
                item.id === id ? { ...item, is_favorite: res.data.is_favorite } : item
            ));
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const handleCardClick = (item) => {
        // Navigate to viewer page (we'll create simple mobile viewers later)
        navigate(`/m/ai/${item.content_type}/${item.id}`);
    };

    const filteredContent = content.filter(item => {
        if (filter === 'all') return true;
        return item.content_type === filter;
    });

    // Count by type
    const counts = {
        all: content.length,
        story: content.filter(c => c.content_type === 'story').length,
        article: content.filter(c => c.content_type === 'article').length,
        dialogue: content.filter(c => c.content_type === 'dialogue').length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
                <div className="text-center">
                    <SparklesIcon className="w-12 h-12 text-[#6366F1] mx-auto animate-pulse" />
                    <p className="text-[#A1A1AA] mt-4">Loading your library...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090B] pb-24">
            {/* Header */}
            <div className="px-4 pt-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-[#6366F1]" />
                        <span className="text-[#6366F1] font-bold text-sm uppercase tracking-wider">Library</span>
                    </div>
                    <button
                        onClick={() => navigate('/m/ai')}
                        className="p-2 bg-[#6366F1] rounded-xl"
                    >
                        <PlusIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
                <h1 className="text-3xl font-black text-white">My Content</h1>
                <p className="text-[#71717A] mt-1">Saved stories, articles & dialogues</p>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${filter === tab.id
                                ? 'bg-[#6366F1] text-white'
                                : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A]'
                                }`}
                        >
                            <span>{tab.emoji}</span>
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-xs ${filter === tab.id ? 'bg-white/20' : 'bg-[#27272A]'
                                }`}>
                                {counts[tab.id]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <div className="px-4 space-y-3">
                <AnimatePresence>
                    {filteredContent.length > 0 ? (
                        filteredContent.map(item => (
                            <ContentCard
                                key={item.id}
                                item={item}
                                onDelete={handleDelete}
                                onFavorite={toggleFavorite}
                                onClick={() => handleCardClick(item)}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 mx-auto mb-4 bg-[#18181B] rounded-full flex items-center justify-center">
                                <BookOpenIcon className="w-10 h-10 text-[#3F3F46]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No content yet</h3>
                            <p className="text-[#71717A] mb-6">Start creating amazing AI-generated content!</p>
                            <button
                                onClick={() => navigate('/m/ai')}
                                className="px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold rounded-xl"
                            >
                                Create Content
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileContentLibrary;
