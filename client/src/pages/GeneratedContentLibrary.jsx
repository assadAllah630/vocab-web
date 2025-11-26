import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpenIcon,
    NewspaperIcon,
    ChatBubbleLeftRightIcon,
    TrashIcon,
    StarIcon as StarIconOutline,
    PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import api from '../api';

function GeneratedContentLibrary() {
    const navigate = useNavigate();
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, story, article, dialogue

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await api.get('ai/generated-content/');
            setContent(res.data);
        } catch (err) {
            console.error('Failed to fetch content', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this content?')) {
            try {
                await api.delete(`ai/generated-content/${id}/delete/`);
                setContent(prev => prev.filter(item => item.id !== id));
            } catch (err) {
                console.error('Failed to delete content', err);
            }
        }
    };

    const toggleFavorite = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await api.post(`ai/generated-content/${id}/favorite/`);
            setContent(prev => prev.map(item =>
                item.id === id ? { ...item, is_favorite: res.data.is_favorite } : item
            ));
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const filteredContent = content.filter(item => {
        if (filter === 'all') return true;
        return item.content_type === filter;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'story': return <BookOpenIcon className="h-5 w-5" />;
            case 'article': return <NewspaperIcon className="h-5 w-5" />;
            case 'dialogue': return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
            default: return <BookOpenIcon className="h-5 w-5" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'story': return 'bg-purple-100 text-purple-700';
            case 'article': return 'bg-blue-100 text-blue-700';
            case 'dialogue': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const handleCardClick = (item) => {
        navigate(`/${item.content_type}/${item.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Generated Content</h1>
                    <p className="text-slate-500">Access your saved stories, articles, and dialogues</p>
                </div>
                <button
                    onClick={() => navigate('/advanced-text-generator')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="h-5 w-5" />
                    Create New
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'story', 'article', 'dialogue'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filter === type
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filteredContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContent.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleCardClick(item)}
                            className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-lg ${getTypeColor(item.content_type)}`}>
                                    {getTypeIcon(item.content_type)}
                                </div>
                                <button
                                    onClick={(e) => toggleFavorite(e, item.id)}
                                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                                >
                                    {item.is_favorite ? (
                                        <StarIconSolid className="h-5 w-5 text-amber-400" />
                                    ) : (
                                        <StarIconOutline className="h-5 w-5" />
                                    )}
                                </button>
                            </div>

                            <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {item.title}
                            </h3>

                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                <span className="px-2 py-0.5 bg-slate-100 rounded font-medium">
                                    {item.level}
                                </span>
                                <span>•</span>
                                <span>{item.total_words} words</span>
                                <span>•</span>
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    {item.topic}
                                </span>
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <BookOpenIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No content found</h3>
                    <p className="text-slate-500 mt-1 mb-6">Create your first AI-generated story, article, or dialogue!</p>
                    <button
                        onClick={() => navigate('/advanced-text-generator')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Start Generating
                    </button>
                </div>
            )}
        </div>
    );
}

export default GeneratedContentLibrary;
