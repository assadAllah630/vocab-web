import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import {
    ChevronLeft,
    Search,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Plus,
    Sparkles,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const LEVELS = ['A1', 'A2', 'B1'];

const CATEGORIES = {
    'articles': 'Articles',
    'plurals': 'Plurals',
    'verbs': 'Verb Conjugation',
    'separable_verbs': 'Separable Verbs',
    'modal_verbs': 'Modal Verbs',
    'cases': 'Cases',
    'prepositions': 'Prepositions',
    'sentence_structure': 'Sentence Structure',
    'word_order': 'Word Order',
    'time_expressions': 'Time Expressions',
    'adjective_endings': 'Adjective Endings',
    'comparatives': 'Comparatives & Superlatives',
};

function MobileGrammar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [selectedLevel, setSelectedLevel] = useState('A1');
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        fetchTopics();
    }, []);

    // Refresh when location changes (e.g., navigating back from generate page)
    useEffect(() => {
        if (location.pathname === '/m/grammar') {
            fetchTopics();
        }
    }, [location]);

    const fetchTopics = async () => {
        try {
            const res = await api.get('grammar/');
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            console.log('Fetched grammar topics:', data);
            setTopics(data);

            // Auto-expand categories that have topics
            const initialExpanded = {};
            Object.keys(CATEGORIES).forEach(cat => {
                initialExpanded[cat] = true;
            });
            setExpandedCategories(initialExpanded);
        } catch (err) {
            console.error('Failed to fetch grammar topics:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const filteredTopics = topics.filter(topic => {
        const matchesLevel = topic.level === selectedLevel;
        const matchesSearch = searchQuery === '' ||
            topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLevel && matchesSearch;
    });

    const topicsByCategory = {};
    filteredTopics.forEach(topic => {
        // Use category only if it exists in our predefined CATEGORIES list
        // Otherwise use 'uncategorized'
        const category = (topic.category && CATEGORIES[topic.category])
            ? topic.category
            : 'uncategorized';

        if (!topicsByCategory[category]) {
            topicsByCategory[category] = [];
        }
        topicsByCategory[category].push(topic);
    });

    const hasTopics = filteredTopics.length > 0;

    // Build categories list - only show categories that have topics
    const allCategories = {};

    // First add standard categories that have topics
    Object.keys(CATEGORIES).forEach(key => {
        if (topicsByCategory[key]) {
            allCategories[key] = CATEGORIES[key];
        }
    });

    // Then add uncategorized at the end if it has topics
    if (topicsByCategory['uncategorized']) {
        allCategories['uncategorized'] = 'Uncategorized';
    }

    // Debug logging
    console.log('Filtered topics count:', filteredTopics.length);
    console.log('Topics by category:', topicsByCategory);
    console.log('Categories to display:', Object.keys(allCategories));

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 px-5 py-4" style={{ backgroundColor: '#09090B' }}>
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/practice')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>
                    <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>{t('grammar')}</h1>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/grammar/generate')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <Plus size={22} color="#6366F1" />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" size={18} />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none"
                        style={{
                            backgroundColor: '#1C1C1F',
                            border: '1px solid #27272A',
                            color: '#FAFAFA'
                        }}
                    />
                </div>

                {/* Level Tabs */}
                <div className="flex p-1 rounded-xl" style={{ backgroundColor: '#1C1C1F' }}>
                    {LEVELS.map(level => (
                        <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all relative"
                            style={{
                                color: selectedLevel === level ? '#FAFAFA' : '#71717A'
                            }}
                        >
                            {selectedLevel === level && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 rounded-lg shadow-sm"
                                    style={{ backgroundColor: '#27272A' }}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{level}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-5">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} color="#6366F1" className="animate-spin" />
                    </div>
                ) : !hasTopics ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-[#1C1C1F] flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} color="#71717A" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: '#FAFAFA' }}>{t('grammarGuide')}</h2>
                        <p className="text-sm opacity-80 mb-4">
                            {t('grammarDesc')}
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/m/grammar/generate')}
                            className="px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 mx-auto"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                        >
                            <Sparkles size={18} />
                            Generate Topic
                        </motion.button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(allCategories).map(([catKey, catName]) => {
                            const catTopics = topicsByCategory[catKey];
                            if (!catTopics) return null;

                            const isExpanded = expandedCategories[catKey];

                            return (
                                <div key={catKey} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}>
                                    <button
                                        onClick={() => toggleCategory(catKey)}
                                        className="w-full px-4 py-3 flex items-center justify-between"
                                        style={{ backgroundColor: '#1C1C1F' }}
                                    >
                                        <span className="font-bold text-sm text-[#FAFAFA]">{catName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#27272A] text-[#A1A1AA]">
                                                {catTopics.length}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronDown size={16} color="#71717A" />
                                            ) : (
                                                <ChevronRight size={16} color="#71717A" />
                                            )}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="divide-y divide-[#27272A]"
                                            >
                                                {catTopics.map(topic => (
                                                    <motion.button
                                                        key={topic.id}
                                                        whileTap={{ backgroundColor: '#27272A' }}
                                                        onClick={() => navigate(`/m/grammar/${topic.id}`)}
                                                        className="w-full px-4 py-3 text-left flex items-center justify-between group"
                                                    >
                                                        <span className="text-sm font-medium text-[#D4D4D8] group-hover:text-[#FAFAFA] transition-colors">
                                                            {topic.title}
                                                        </span>
                                                        <ChevronRight size={14} color="#52525B" />
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Generate Button (only if topics exist to avoid clutter) */}
            {hasTopics && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/m/grammar/generate')}
                    className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 z-30"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                    <Sparkles size={24} color="#FFFFFF" />
                </motion.button>
            )}
        </div>
    );
}

export default MobileGrammar;
