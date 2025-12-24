/**
 * PodcastSearch Component
 * 
 * Search via iTunes API (proxied) and add to library.
 */

import React, { useState } from 'react';
import { Search, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import api, { getProxyUrl } from '../../api';

function PodcastSearch({ onPodcastAdded }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const res = await api.get('external-podcasts/search/', {
                params: { q: query }
            });
            setResults(res.data.results);
            if (res.data.results.length === 0) {
                setError('No podcasts found');
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPodcast = async (podcast) => {
        setAddingId(podcast.itunes_id);
        try {
            await api.post('external-podcasts/add/', {
                feed_url: podcast.feed_url,
                level: 'B1'
            });
            if (onPodcastAdded) onPodcastAdded();

            setResults(prev => prev.map(p =>
                p.itunes_id === podcast.itunes_id ? { ...p, isAdded: true } : p
            ));
        } catch (err) {
            console.error('Failed to add podcast:', err);
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSearch} className="mb-4">
                <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl transition-colors focus-within:bg-[#27272A]"
                    style={{ backgroundColor: '#1C1C1F' }}
                >
                    <Search size={18} color="#71717A" />
                    <input
                        type="text"
                        placeholder="Search iTunes via API..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-zinc-500"
                        style={{ color: '#FAFAFA' }}
                    />
                    {loading && <Loader2 size={18} className="animate-spin text-indigo-500" />}
                </div>
            </form>

            {error && (
                <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                    <AlertCircle size={16} />
                    <p>{error}</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-2 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#71717A' }}>
                        Search Results
                    </h3>
                    {results.map((podcast) => (
                        <div
                            key={podcast.itunes_id}
                            className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-zinc-800/50"
                            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                        >
                            <img
                                src={getProxyUrl(podcast.artwork_url)}
                                alt={podcast.name}
                                className="w-12 h-12 rounded-lg object-cover bg-zinc-800"
                                onError={(e) => { e.target.src = '/podcast-placeholder.png'; }}
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-zinc-100 truncate">
                                    {podcast.name}
                                </h4>
                                <p className="text-xs text-zinc-500 truncate">
                                    {podcast.artist}
                                </p>
                            </div>
                            <button
                                onClick={() => !podcast.isAdded && handleAddPodcast(podcast)}
                                disabled={addingId === podcast.itunes_id || podcast.isAdded}
                                className={`p-2 rounded-lg transition-all ${podcast.isAdded
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    }`}
                            >
                                {addingId === podcast.itunes_id ? <Loader2 size={16} className="animate-spin" /> :
                                    podcast.isAdded ? <Check size={16} /> : <Plus size={16} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PodcastSearch;
