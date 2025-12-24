/**
 * MobileExternalPodcastLibrary - Browse external podcasts
 * 
 * Features:
 * - List podcasts from API with level filtering
 * - Search by name/author
 * - Featured podcasts section
 * - Navigate to detail on click
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Search, Headphones,
    Radio, Wifi, Star, Filter, Plus
} from 'lucide-react';
import api, { getProxyUrl } from '../../api';

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function MobileExternalPodcastLibrary() {
    const navigate = useNavigate();
    const [podcasts, setPodcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [level, setLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchMode, setShowSearchMode] = useState(false);

    useEffect(() => {
        loadPodcasts();
    }, [level]);

    const loadPodcasts = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (level !== 'All') params.level = level;

            const res = await api.get('external-podcasts/', { params });
            setPodcasts(res.data);
        } catch (err) {
            console.error('Failed to load podcasts:', err);
            setError('Failed to load podcasts');
        } finally {
            setLoading(false);
        }
    };

    // Filter and separate podcasts
    const { featured, regular } = useMemo(() => {
        const filtered = podcasts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return {
            featured: filtered.filter(p => p.is_featured),
            regular: filtered.filter(p => !p.is_featured)
        };
    }, [podcasts, searchQuery]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 px-4 pt-12 pb-4" style={{ backgroundColor: '#0A0A0B' }}>
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={20} color="#FAFAFA" />
                    </button>
                    <h1 className="text-xl font-bold flex-1" style={{ color: '#FAFAFA' }}>
                        {showSearchMode ? 'Add Podcast' : 'Podcast Library'}
                    </h1>

                    <button
                        onClick={() => setShowSearchMode(!showSearchMode)}
                        className="p-2 rounded-full transition-colors"
                        style={{ backgroundColor: showSearchMode ? '#6366F1' : '#1C1C1F' }}
                    >
                        {showSearchMode ? (
                            <Radio size={20} color="#FFF" />
                        ) : (
                            <Plus size={20} color="#FAFAFA" />
                        )}
                    </button>
                </div>

                {showSearchMode ? (
                    <PodcastSearch onPodcastAdded={() => {
                        loadPodcasts();
                        // Optional: Switch back to library view after adding?
                        // setShowSearchMode(false); 
                    }} />
                ) : (
                    <>
                        {/* Search Local */}
                        <div
                            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-3"
                            style={{ backgroundColor: '#1C1C1F' }}
                        >
                            <Search size={18} color="#71717A" />
                            <input
                                type="text"
                                placeholder="Filter your library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                                style={{ color: '#FAFAFA' }}
                            />
                        </div>

                        {/* Level Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {LEVELS.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLevel(l)}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                                    style={{
                                        backgroundColor: level === l ? '#6366F1' : '#1C1C1F',
                                        color: level === l ? '#FFFFFF' : '#A1A1AA'
                                    }}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="px-4 pb-24">
                {showSearchMode ? null : loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <Radio size={40} color="#71717A" className="mx-auto mb-3" />
                        <p style={{ color: '#A1A1AA' }}>{error}</p>
                        <button
                            onClick={loadPodcasts}
                            className="mt-4 px-4 py-2 rounded-lg text-sm"
                            style={{ backgroundColor: '#6366F1', color: '#FFF' }}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Featured Section */}
                        {featured.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star size={16} color="#FBBF24" fill="#FBBF24" />
                                    <h2 className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>
                                        Featured
                                    </h2>
                                </div>
                                <div className="space-y-2">
                                    {featured.map(podcast => (
                                        <PodcastCard
                                            key={podcast.id}
                                            podcast={podcast}
                                            onClick={() => navigate(`/m/external-podcast/${podcast.id}`)}
                                            featured
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Podcasts */}
                        {regular.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold mb-3" style={{ color: '#A1A1AA' }}>
                                    All Podcasts ({regular.length})
                                </h2>
                                <div className="space-y-2">
                                    {regular.map(podcast => (
                                        <PodcastCard
                                            key={podcast.id}
                                            podcast={podcast}
                                            onClick={() => navigate(`/m/external-podcast/${podcast.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {featured.length === 0 && regular.length === 0 && (
                            <div className="text-center py-16">
                                <Headphones size={48} color="#71717A" className="mx-auto mb-4" />
                                <p className="text-lg font-medium" style={{ color: '#FAFAFA' }}>
                                    No podcasts found
                                </p>
                                <p className="text-sm mt-1" style={{ color: '#71717A' }}>
                                    {searchQuery ? 'Try a different search' : 'Check back later'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function PodcastCard({ podcast, onClick, featured = false }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex gap-3 p-3 rounded-xl text-left transition-colors"
            style={{
                backgroundColor: featured ? 'rgba(99, 102, 241, 0.08)' : '#141416',
                border: featured ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid #27272A'
            }}
        >
            {/* Artwork */}
            <img
                src={getProxyUrl(podcast.artwork_url)}
                alt={podcast.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                style={{ backgroundColor: '#1C1C1F' }}
                onError={(e) => { e.target.src = '/podcast-placeholder.png'; }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0 py-0.5">
                <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: '#FAFAFA' }}
                >
                    {podcast.name}
                </h3>
                <p
                    className="text-xs truncate mt-0.5"
                    style={{ color: '#A1A1AA' }}
                >
                    {podcast.author || 'Unknown'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                    <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: '#6366F1', color: '#FFF' }}
                    >
                        {podcast.level}
                    </span>
                    <span className="text-xs" style={{ color: '#71717A' }}>
                        {podcast.episode_count} eps
                    </span>
                </div>
            </div>
        </button>
    );
}

export default MobileExternalPodcastLibrary;
