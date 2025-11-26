import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
    ArrowLeftIcon,
    ClockIcon,
    TagIcon,
    ShareIcon,
    BookmarkIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import api from '../api';

function ArticleViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await api.get(`ai/generated-content/${id}/`);
                setArticle(res.data);
            } catch (err) {
                console.error('Failed to fetch article', err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    const toggleFavorite = async () => {
        try {
            const res = await api.post(`ai/generated-content/${id}/favorite/`);
            setArticle(prev => ({ ...prev, is_favorite: res.data.is_favorite }));
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!article) return null;

    // Calculate read time (approx 200 words per minute)
    const readTime = Math.ceil(article.total_words / 200);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-serif">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/advanced-text-generator')}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-sans text-sm font-medium"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleFavorite}
                            className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                            {article.is_favorite ? (
                                <BookmarkIconSolid className="h-5 w-5 text-amber-500" />
                            ) : (
                                <BookmarkIcon className="h-5 w-5" />
                            )}
                        </button>
                        <button className="text-slate-400 hover:text-slate-900 transition-colors">
                            <ShareIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 pt-24 pb-20">
                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-3 text-sm font-sans text-slate-500 mb-6">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium">
                            {article.level}
                        </span>
                        <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {readTime} min read
                        </span>
                        <span className="flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            {article.topic}
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                        {article.title}
                    </h1>
                </header>

                {/* Article Body */}
                <article className="prose prose-lg prose-slate max-w-none prose-headings:font-sans prose-headings:font-bold prose-p:leading-relaxed prose-strong:text-indigo-700 prose-strong:bg-indigo-50 prose-strong:px-1 prose-strong:rounded">
                    {article.content_data.paragraphs.map((para, idx) => (
                        <section key={idx} className="mb-8">
                            {para.heading && para.heading !== 'Introduction' && (
                                <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-6">
                                    {para.heading}
                                </h2>
                            )}
                            <ReactMarkdown>
                                {para.content}
                            </ReactMarkdown>
                        </section>
                    ))}
                </article>

                {/* Footer / Vocabulary List */}
                <footer className="mt-16 pt-12 border-t border-slate-200 font-sans">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Vocabulary in this article</h3>
                    <div className="flex flex-wrap gap-2">
                        {article.vocabulary_used.map((word, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors cursor-default"
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </footer>
            </main>
        </div>
    );
}

export default ArticleViewer;
