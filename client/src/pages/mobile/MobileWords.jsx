import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Search, Plus, Trash2, Pencil, WifiOff, RefreshCw } from 'lucide-react';
import { vocabStorage, useOnlineStatus, syncQueue } from '../../utils/offlineStorage';

function MobileWords() {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const isOnline = useOnlineStatus();
    const [pendingCount, setPendingCount] = useState(0);

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
                setLoading(false);
            }

            // If online, fetch fresh data
            if (navigator.onLine) {
                const res = await api.get('vocab/');
                setWords(res.data);
                await vocabStorage.saveAll(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch words:', err);
            // Fall back to cache
            const cached = await vocabStorage.getAll();
            if (cached.length > 0) {
                setWords(cached);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this word?')) return;

        // Update local state immediately
        setWords(words.filter(w => w.id !== id));

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
        const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
            word.translation.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeFilter === 'all') return matchesSearch;
        return matchesSearch && word.type === activeFilter;
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
                            {words.length}
                        </span>
                    </div>
                </div>

                {/* Search */}
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
                        placeholder="Search words..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{
                            backgroundColor: '#141416',
                            border: '1px solid #27272A',
                            color: '#FAFAFA'
                        }}
                    />
                </div>

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
                        <p style={{ color: '#71717A' }}>No words found</p>
                        <button
                            onClick={() => navigate('/m/words/add')}
                            className="mt-4 px-6 py-2.5 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
                        >
                            Add your first word
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredWords.map((word) => (
                            <div
                                key={word.id}
                                className="flex items-center justify-between py-4"
                                style={{ borderBottom: '1px solid #1C1C1F' }}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate" style={{ color: '#FAFAFA' }}>
                                        {word.word}
                                    </p>
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
                            </div>
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
