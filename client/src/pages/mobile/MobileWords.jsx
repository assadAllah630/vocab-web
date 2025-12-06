import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { Search, Plus, Trash2, Pencil, WifiOff, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { vocabStorage, useOnlineStatus, syncQueue } from '../../utils/offlineStorage';

function MobileWords() {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const isOnline = useOnlineStatus();
    const [pendingCount, setPendingCount] = useState(0);

    // Semantic search states
    const [useSemanticSearch, setUseSemanticSearch] = useState(false);
    const [semanticLoading, setSemanticLoading] = useState(false);
    const [allWords, setAllWords] = useState([]); // Store all words for filtering

    useEffect(() => {
        fetchWords();
        syncQueue.getPendingCount().then(setPendingCount);
    }, []);

    const fetchWords = async () => {
        setLoading(true);
        try {
            // Try cache first
            const cached = await vocabStorage.getAll();
            if (cached.length > 0) {
                setWords(cached);
                setAllWords(cached);
                setLoading(false);
            }

            // If online, fetch fresh data
            if (navigator.onLine) {
                const res = await api.get('vocab/');
                setWords(res.data);
                setAllWords(res.data);
                await vocabStorage.saveAll(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch words:', err);
            // Fall back to cache
            const cached = await vocabStorage.getAll();
            if (cached.length > 0) {
                setWords(cached);
                setAllWords(cached);
            }
        } finally {
            setLoading(false);
        }
    };

    // Semantic search handler
    const handleSemanticSearch = async () => {
        if (!searchQuery.trim()) {
            setWords(allWords);
            return;
        }

        const apiKey = localStorage.getItem('openrouter_api_key');
        if (!apiKey) {
            alert('Please add your OpenRouter API key in Settings to use semantic search');
            return;
        }

        setSemanticLoading(true);
        try {
            const res = await api.post('vocab/semantic-search/', {
                query: searchQuery,
                api_key: apiKey,
                limit: 10
            });

            if (Array.isArray(res.data)) {
                setWords(res.data.map(r => ({ ...r.vocab, similarity: r.similarity })));
            } else if (res.data.results) {
                setWords(res.data.results.map(r => ({ ...r.vocab, similarity: r.similarity })));
            } else if (res.data.message) {
                alert(res.data.message);
                setWords([]);
            }
        } catch (err) {
            console.error('Semantic search failed:', err);
            alert('Semantic search failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setSemanticLoading(false);
        }
    };

    // Handle search based on mode
    useEffect(() => {
        if (useSemanticSearch && searchQuery.trim()) {
            // Don't auto-search, wait for enter key
        } else if (!useSemanticSearch) {
            // Text search - filter locally
            if (searchQuery.trim()) {
                const filtered = allWords.filter(word =>
                    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    word.translation.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setWords(filtered);
            } else {
                setWords(allWords);
            }
        }
    }, [searchQuery, useSemanticSearch, allWords]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this word?')) return;

        // Update local state immediately
        setWords(words.filter(w => w.id !== id));
        setAllWords(allWords.filter(w => w.id !== id));

        // Update local cache
        await vocabStorage.delete(id);

        // If online, sync with server
        if (isOnline) {
            try {
                await api.delete(`vocab/${id}/`);
            } catch (err) {
                console.error('Failed to delete from server:', err);
            }
        }
    };

    const filteredWords = words.filter(word => {
        if (activeFilter === 'all') return true;
        return word.type === activeFilter;
    });

    const filters = ['all', 'noun', 'verb', 'adjective', 'phrase'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
            {/* Offline Indicator */}
            {!isOnline && (
                <div
                    className="px-4 py-2 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#F59E0B' }}
                >
                    <WifiOff size={14} style={{ color: '#FFFFFF' }} />
                    <span className="text-xs font-medium" style={{ color: '#FFFFFF' }}>
                        Offline - showing cached words
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="px-5 pt-14 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold" style={{ color: '#FAFAFA' }}>Words</h1>
                    <div className="flex items-center gap-2">
                        {!isOnline && (
                            <span
                                className="px-2 py-1 rounded-md text-xs font-medium"
                                style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                            >
                                Offline
                            </span>
                        )}
                        <span
                            className="px-2.5 py-1 rounded-md text-sm font-medium"
                            style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                        >
                            {allWords.length}
                        </span>
                    </div>
                </div>

                {/* Search with Semantic Toggle */}
                <div className="relative mb-4">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#71717A' }}
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && useSemanticSearch) {
                                handleSemanticSearch();
                            }
                        }}
                        placeholder={useSemanticSearch ? "Search by meaning (Enter)..." : "Search words..."}
                        className="w-full pl-10 pr-24 py-3 rounded-xl text-sm outline-none"
                        style={{
                            backgroundColor: '#141416',
                            border: `1px solid ${useSemanticSearch ? '#8B5CF6' : '#27272A'}`,
                            color: '#FAFAFA'
                        }}
                    />
                    {/* Semantic Toggle Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setUseSemanticSearch(!useSemanticSearch);
                            if (!useSemanticSearch) {
                                // Switching to semantic - clear local filter
                                setWords(allWords);
                            }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all"
                        style={{
                            backgroundColor: useSemanticSearch ? '#8B5CF6' : '#27272A',
                            color: useSemanticSearch ? '#FFFFFF' : '#A1A1AA'
                        }}
                    >
                        <Sparkles size={12} />
                        {useSemanticSearch ? 'AI' : 'Text'}
                    </motion.button>
                </div>

                {/* Semantic Search Loading */}
                <AnimatePresence>
                    {semanticLoading && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 rounded-xl flex items-center gap-3"
                            style={{
                                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            <Loader2 size={16} color="#8B5CF6" className="animate-spin" />
                            <span className="text-sm" style={{ color: '#A78BFA' }}>
                                Searching by meaning...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className="px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors"
                            style={{
                                backgroundColor: activeFilter === filter ? '#6366F1' : 'transparent',
                                color: activeFilter === filter ? '#FFFFFF' : '#71717A'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Word List */}
            <div className="px-5">
                {filteredWords.length === 0 ? (
                    <div className="text-center py-16">
                        <p style={{ color: '#71717A' }}>
                            {useSemanticSearch && searchQuery ? 'No matching words found' : 'No words found'}
                        </p>
                        {!useSemanticSearch && (
                            <button
                                onClick={() => navigate('/m/words/add')}
                                className="mt-4 px-6 py-2.5 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
                            >
                                Add your first word
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredWords.map((word, index) => (
                            <motion.div
                                key={word.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex items-center justify-between py-4"
                                style={{ borderBottom: '1px solid #1C1C1F' }}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate" style={{ color: '#FAFAFA' }}>
                                            {word.word}
                                        </p>
                                        {/* Similarity Badge */}
                                        {useSemanticSearch && word.similarity && (
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                                                style={{
                                                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                                    color: '#A78BFA'
                                                }}
                                            >
                                                <Sparkles size={10} />
                                                {Math.round(word.similarity * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm truncate" style={{ color: '#71717A' }}>
                                        {word.translation}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 ml-3">
                                    <span
                                        className="px-2 py-1 rounded text-xs font-medium capitalize"
                                        style={{ backgroundColor: '#1C1C1F', color: '#71717A' }}
                                    >
                                        {word.type}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/m/words/edit/${word.id}`)}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: '#71717A' }}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(word.id)}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: '#71717A' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => navigate('/m/words/add')}
                className="fixed right-5 bottom-24 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#6366F1' }}
            >
                <Plus size={24} style={{ color: '#FFFFFF' }} />
            </button>
        </div>
    );
}

export default MobileWords;

