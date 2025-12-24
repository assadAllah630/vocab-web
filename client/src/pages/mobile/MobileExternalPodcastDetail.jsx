/**
 * MobileExternalPodcastDetail - View podcast and its episodes
 * 
 * Features:
 * - Podcast artwork, title, author, level
 * - Episode list with play buttons
 * - Duration and publish date display
 * - Navigate to player on play
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Play, Clock, Calendar,
    ExternalLink, Wifi, Headphones, Heart, Bookmark
} from 'lucide-react';
import api, { getProxyUrl } from '../../api';

function MobileExternalPodcastDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [podcast, setPodcast] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadPodcast();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                try {
                    const res = await api.get(`external-podcasts/${id}/episodes/?search=${encodeURIComponent(searchQuery)}`);
                    setEpisodes(res.data);
                } catch (e) {
                    console.error("Search failed", e);
                } finally {
                    setIsSearching(false);
                }
            } else if (podcast) {
                // Reset to initial recent episodes if cleared
                setEpisodes(podcast.recent_episodes || []);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, id, podcast]);

    const loadPodcast = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`external-podcasts/${id}/`);
            setPodcast(res.data);
            setEpisodes(res.data.recent_episodes || []);
        } catch (err) {
            console.error('Failed to load podcast:', err);
            setError('Failed to load podcast');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const hours = Math.floor(mins / 60);
        if (hours > 0) {
            return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePlayEpisode = (episode) => {
        navigate(`/m/external-episode/${episode.id}/play`, {
            state: { episode, podcast }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0B' }}>
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !podcast) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#0A0A0B' }}>
                <Headphones size={48} color="#71717A" className="mb-4" />
                <p style={{ color: '#A1A1AA' }}>{error || 'Podcast not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#1C1C1F', color: '#FAFAFA' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0A0A0B' }}>
            {/* Header with blur backdrop */}
            <div className="relative">
                {/* Background blur */}
                <div
                    className="absolute inset-0 h-56"
                    style={{
                        backgroundImage: podcast.artwork_url ? `url(${getProxyUrl(podcast.artwork_url)})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(50px)',
                        opacity: 0.25
                    }}
                />

                {/* Content */}
                <div className="relative px-4 pt-12 pb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full mb-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    >
                        <ChevronLeft size={20} color="#FAFAFA" />
                    </button>

                    <div className="flex gap-4">
                        <img
                            src={getProxyUrl(podcast.artwork_url)}
                            alt={podcast.name}
                            className="w-28 h-28 rounded-xl shadow-2xl object-cover flex-shrink-0"
                            style={{ backgroundColor: '#1C1C1F' }}
                            onError={(e) => { e.target.src = '/podcast-placeholder.png'; }}
                        />
                        <div className="flex-1 min-w-0 py-1">
                            <h1 className="text-lg font-bold leading-tight" style={{ color: '#FAFAFA' }}>
                                {podcast.name}
                            </h1>
                            <p className="text-sm mt-1 truncate" style={{ color: '#A1A1AA' }}>
                                {podcast.author || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span
                                    className="text-xs px-2 py-1 rounded font-medium"
                                    style={{ backgroundColor: '#6366F1', color: '#FFF' }}
                                >
                                    {podcast.level}
                                </span>
                                <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                                >
                                    {podcast.language?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Wifi size={12} color="#22C55E" />
                                <span className="text-xs" style={{ color: '#71717A' }}>
                                    {podcast.episode_count} episodes • Stream
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subscribe Button */}
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={async () => {
                                try {
                                    if (podcast.is_subscribed) {
                                        await api.delete(`external-podcasts/${id}/unsubscribe/`);
                                        setPodcast(p => ({ ...p, is_subscribed: false }));
                                    } else {
                                        await api.post(`external-podcasts/${id}/subscribe/`);
                                        setPodcast(p => ({ ...p, is_subscribed: true }));
                                    }
                                } catch (e) {
                                    console.error("Subscription failed", e);
                                    setError("Action failed");
                                }
                            }}
                            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${podcast.is_subscribed
                                ? 'bg-zinc-800 text-zinc-300'
                                : 'bg-indigo-600 text-white'
                                }`}
                        >
                            {podcast.is_subscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search episodes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1C1C1F] text-sm text-white placeholder-zinc-500 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            {podcast.description && (
                <div className="px-4 py-3">
                    <p className="text-sm leading-relaxed" style={{ color: '#D4D4D8' }}>
                        {podcast.description.slice(0, 180)}
                        {podcast.description.length > 180 && '...'}
                    </p>
                    {podcast.website_url && (
                        <a
                            href={podcast.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs"
                            style={{ color: '#6366F1' }}
                        >
                            <ExternalLink size={12} />
                            Visit Website
                        </a>
                    )}
                </div>
            )}

            {/* Episodes */}
            <div className="px-4 pb-24">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold" style={{ color: '#A1A1AA' }}>
                        {searchQuery ? 'Search Results' : `Episodes (${episodes.length})`}
                    </h2>
                    {podcast.episode_count > episodes.length && !searchQuery && ( // Hide Load All when searching
                        <button
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const res = await api.get(`external-podcasts/${id}/episodes/`);
                                    setEpisodes(res.data);
                                } catch (e) {
                                    console.error("Failed to load all episodes", e);
                                    setError("Failed to load older episodes");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="text-xs font-medium px-2 py-1 rounded hover:bg-white/10"
                            style={{ color: '#6366F1' }}
                        >
                            Load All ({podcast.episode_count})
                        </button>
                    )}
                </div>

                {episodes.length === 0 ? (
                    <div className="text-center py-8">
                        <p style={{ color: '#71717A' }}>No episodes available</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {episodes.map((episode) => (
                            <div
                                key={episode.id}
                                className="p-3 rounded-xl"
                                style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3
                                            className="font-medium text-sm leading-tight"
                                            style={{ color: '#FAFAFA' }}
                                        >
                                            {episode.title}
                                        </h3>
                                        {episode.description && (
                                            <p
                                                className="text-xs mt-1 line-clamp-2"
                                                style={{ color: '#71717A' }}
                                            >
                                                {episode.description.slice(0, 100)}
                                                {episode.description.length > 100 && '...'}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#52525B' }}>
                                            <span className="flex items-center gap-1">
                                                <Clock size={11} />
                                                {formatDuration(episode.duration)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} />
                                                {formatDate(episode.published_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handlePlayEpisode(episode)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: '#6366F1' }}
                                        >
                                            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                                        </button>
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const res = await api.post(`external-episodes/${episode.id}/like/`);
                                                        // Update local state
                                                        setEpisodes(prev => prev.map(ep =>
                                                            ep.id === episode.id ? { ...ep, is_liked: res.data.is_liked } : ep
                                                        ));
                                                    } catch (err) {
                                                        console.error("Like failed", err);
                                                    }
                                                }}
                                                className="p-1 rounded-full hover:bg-white/10"
                                            >
                                                <Heart
                                                    size={16}
                                                    color={episode.is_liked ? "#EF4444" : "#71717A"}
                                                    fill={episode.is_liked ? "#EF4444" : "none"}
                                                />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const res = await api.post(`external-episodes/${episode.id}/save/`);
                                                        setEpisodes(prev => prev.map(ep =>
                                                            ep.id === episode.id ? { ...ep, is_saved: res.data.is_saved } : ep
                                                        ));
                                                    } catch (err) {
                                                        console.error("Save failed", err);
                                                    }
                                                }}
                                                className="p-1 rounded-full hover:bg-white/10"
                                            >
                                                <Bookmark
                                                    size={16}
                                                    color={episode.is_saved ? "#6366F1" : "#71717A"}
                                                    fill={episode.is_saved ? "#6366F1" : "none"}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MobileExternalPodcastDetail;
