import React, { useState, useEffect } from 'react';
import api from '../api';

function SharedBank() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [copying, setCopying] = useState(null);

    useEffect(() => {
        fetchPublicVocab();
    }, []);

    const fetchPublicVocab = async () => {
        try {
            const res = await api.get('public-vocab/');
            setWords(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (id) => {
        setCopying(id);
        try {
            await api.post(`public-vocab/${id}/copy/`);
            // Ideally show a toast notification here
            alert('Word added to your collection!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to copy word');
        } finally {
            setCopying(null);
        }
    };

    const filteredWords = words.filter(word =>
        word.word.toLowerCase().includes(search.toLowerCase()) ||
        word.translation.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Shared Vocabulary Bank</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Discover words shared by the community and add them to your collection.
                    </p>
                </div>
                <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400">🔍</span>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Search words..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredWords.map((word) => (
                    <div key={word.id} className="bg-white overflow-hidden shadow rounded-lg border border-slate-200 hover:shadow-md transition-shadow duration-200">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-slate-900">{word.word}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{word.translation}</p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    {word.type}
                                </span>
                            </div>
                            {word.example && (
                                <div className="mt-4 text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3">
                                    "{word.example}"
                                </div>
                            )}
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                    {word.tags && word.tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleCopy(word.id)}
                                    disabled={copying === word.id}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {copying === word.id ? 'Adding...' : 'Add to Collection'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredWords.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No words found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}

export default SharedBank;
