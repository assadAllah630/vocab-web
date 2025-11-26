import React, { useState, useEffect } from 'react';
import api from '../api';

function MyPodcasts() {
    const [podcasts, setPodcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState(null);

    useEffect(() => {
        fetchPodcasts();
    }, []);

    const fetchPodcasts = async () => {
        try {
            const res = await api.get('podcasts/');
            setPodcasts(res.data);
        } catch (err) {
            console.error('Error fetching podcasts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this podcast?')) return;

        try {
            await api.delete(`podcasts/${id}/`);
            setPodcasts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to delete podcast');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-600">Loading podcasts...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Podcasts</h1>
                    <p className="mt-2 text-slate-600">
                        Your generated German podcasts
                    </p>
                </div>
                <a
                    href="/podcast-creator"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    Create New Podcast
                </a>
            </div>

            {podcasts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="mt-4 text-slate-600">
                        You haven't created any podcasts yet
                    </p>
                    <a
                        href="/podcast-creator"
                        className="mt-4 inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Create Your First Podcast
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {podcasts.map(podcast => (
                        <div
                            key={podcast.id}
                            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {podcast.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {new Date(podcast.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(podcast.id)}
                                    className="text-red-600 hover:text-red-700 p-2"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Audio Player */}
                            {podcast.audio_url && (
                                <div className="mb-4">
                                    <audio
                                        controls
                                        className="w-full"
                                        src={podcast.audio_url}
                                        onPlay={() => setPlayingId(podcast.id)}
                                        onPause={() => setPlayingId(null)}
                                    >
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}

                            {/* Text Preview */}
                            <div className="mb-4">
                                <p className="text-sm text-slate-700 line-clamp-3">
                                    {podcast.text_content}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {podcast.audio_url && (
                                    <a
                                        href={podcast.audio_url}
                                        download
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                                    >
                                        Download
                                    </a>
                                )}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(podcast.text_content);
                                        alert('Text copied!');
                                    }}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                                >
                                    Copy Text
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyPodcasts;
