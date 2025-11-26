import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    HomeIcon,
    BookOpenIcon,
    PhotoIcon,
    ArrowPathIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import api from '../api';

function StoryViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [pollingInterval, setPollingInterval] = useState(null);
    const [pollingCount, setPollingCount] = useState(0);
    const MAX_POLLING_ATTEMPTS = 200; // 200 * 5s = ~16 minutes max

    // Fetch initial story data
    useEffect(() => {
        const fetchStory = async () => {
            try {
                setError(null);
                const res = await api.get(`ai/generated-content/${id}/`);
                setStory(res.data);

                // Start polling if images are pending/generating
                if (res.data.has_images &&
                    ['pending', 'generating', 'partial'].includes(res.data.image_generation_status)) {
                    startPolling();
                }
            } catch (err) {
                console.error('Failed to fetch story', err);
                if (err.response?.status === 404) {
                    setError('Story not found. It may have been deleted or you may not have permission to view it.');
                } else {
                    setError('Failed to load story. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStory();

        return () => stopPolling();
    }, [id]);

    const startPolling = useCallback(() => {
        if (pollingInterval) return;

        setPollingCount(0);
        const interval = setInterval(async () => {
            try {
                setPollingCount(prev => {
                    const newCount = prev + 1;

                    if (newCount >= MAX_POLLING_ATTEMPTS) {
                        console.warn('Polling timeout reached. Stopping...');
                        stopPolling();
                        setStory(prevStory => ({
                            ...prevStory,
                            image_generation_status: 'failed'
                        }));
                        return newCount;
                    }

                    return newCount;
                });

                const res = await api.get(`ai/generated-content/${id}/images/status/`);

                setStory(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        image_generation_status: res.data.status,
                        images_generated_count: res.data.images_generated,
                        total_images_count: res.data.total_images,
                        content_data: {
                            ...prev.content_data,
                            events: res.data.events || prev.content_data.events || []
                        }
                    };
                });

                if (['completed', 'failed'].includes(res.data.status)) {
                    console.log(`Image generation ${res.data.status}. Stopping polling.`);
                    stopPolling();
                }
            } catch (err) {
                console.error('Polling failed', err);
                setPollingCount(prev => prev + 1);
            }
        }, 5000);

        setPollingInterval(interval);
    }, [id, pollingInterval]);

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
    };

    const handleRetryImage = async (eventNumber) => {
        try {
            await api.post(`ai/generated-content/${id}/images/${eventNumber}/retry/`);

            setStory(prev => {
                const newEvents = [...prev.content_data.events];
                const eventIndex = newEvents.findIndex(e => e.event_number === eventNumber);
                if (eventIndex !== -1) {
                    newEvents[eventIndex] = { ...newEvents[eventIndex], image_status: 'pending' };
                }
                return {
                    ...prev,
                    image_generation_status: 'generating',
                    content_data: { ...prev.content_data, events: newEvents }
                };
            });

            startPolling();
        } catch (err) {
            console.error('Retry failed', err);
        }
    };

    const nextEvent = () => {
        if (currentEventIndex < story.content_data.events.length - 1) {
            setDirection(1);
            setCurrentEventIndex(prev => prev + 1);
        }
    };

    const prevEvent = () => {
        if (currentEventIndex > 0) {
            setDirection(-1);
            setCurrentEventIndex(prev => prev - 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextEvent();
            if (e.key === 'ArrowLeft') prevEvent();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentEventIndex, story]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-red-900/20 border border-red-500/50 rounded-xl p-8 text-center">
                    <ExclamationCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-300 mb-2">Error Loading Story</h2>
                    <p className="text-red-200 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/advanced-text-generator')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                    >
                        <HomeIcon className="h-5 w-5" />
                        Back to Generator
                    </button>
                </div>
            </div>
        );
    }

    if (!story) return null;

    // Safety check for content structure
    if (!story.content_data || !Array.isArray(story.content_data.events) || story.content_data.events.length === 0) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-8 text-center">
                    <ExclamationCircleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-yellow-300 mb-2">Invalid Story Content</h2>
                    <p className="text-yellow-200 mb-6">This story seems to have incomplete or invalid data structure.</p>
                    <button
                        onClick={() => navigate('/advanced-text-generator')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                    >
                        <HomeIcon className="h-5 w-5" />
                        Back to Generator
                    </button>
                </div>
            </div>
        );
    }

    const currentEvent = story.content_data.events[currentEventIndex];
    const totalEvents = story.content_data.events.length;
    const progress = ((currentEventIndex + 1) / totalEvents) * 100;

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8
        })
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-hidden flex flex-col">
            <div className="p-4 flex items-center justify-between z-10">
                <button
                    onClick={() => navigate('/advanced-text-generator')}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <HomeIcon className="h-6 w-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-lg">{story.title}</h1>
                    <span className="text-xs text-white/60">{story.level} • {story.topic}</span>
                </div>
                <div className="w-10" />
            </div>

            <div className="w-full h-1 bg-white/10">
                <motion.div
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentEventIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="w-full max-w-5xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[600px]"
                    >
                        {story.has_images && (
                            <div className="w-full md:w-1/2 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                                {currentEvent.image_status === 'completed' && currentEvent.image_base64 ? (
                                    <img
                                        src={`data:image/jpeg;base64,${currentEvent.image_base64}`}
                                        alt={`Scene ${currentEvent.event_number}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : currentEvent.image_status === 'failed' ? (
                                    <div className="flex flex-col items-center justify-center p-6 text-center">
                                        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mb-2" />
                                        <p className="text-slate-500 mb-4">Image generation failed</p>
                                        <button
                                            onClick={() => handleRetryImage(currentEvent.event_number)}
                                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center gap-2"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                            Retry
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 text-center animate-pulse">
                                        <PhotoIcon className="h-16 w-16 text-slate-300 mb-4" />
                                        <p className="text-slate-400 font-medium">
                                            {currentEvent.image_status === 'generating' ? 'Painting scene...' : 'Waiting for artist...'}
                                        </p>
                                        {currentEvent.image_status === 'generating' && (
                                            <p className="text-xs text-slate-400 mt-2">This may take 1-2 minutes</p>
                                        )}
                                    </div>
                                )}

                                {currentEvent.image_provider && (
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                        Generated by {currentEvent.image_provider}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`w-full ${story.has_images ? 'md:w-1/2' : 'w-full'} p-8 sm:p-12 flex flex-col overflow-y-auto`}>
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase">
                                    Event {currentEvent.event_number} of {totalEvents}
                                </span>
                                <BookOpenIcon className="h-6 w-6 text-slate-400" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 leading-tight">
                                {currentEvent.title}
                            </h2>

                            <div className="prose prose-lg prose-indigo max-w-none flex-1 text-slate-600 leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        strong: ({ node, ...props }) => (
                                            <span className="bg-indigo-100 text-indigo-800 px-1 rounded font-semibold" {...props} />
                                        )
                                    }}
                                >
                                    {currentEvent.content}
                                </ReactMarkdown>
                            </div>

                            {currentEvent.vocabulary_in_event?.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-3">
                                        Vocabulary in this scene
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {currentEvent.vocabulary_in_event.map((word, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium"
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 flex items-center justify-center gap-8 z-10">
                <button
                    onClick={prevEvent}
                    disabled={currentEventIndex === 0}
                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>

                <span className="text-sm font-medium tracking-widest">
                    {currentEventIndex + 1} / {totalEvents}
                </span>

                <button
                    onClick={nextEvent}
                    disabled={currentEventIndex === totalEvents - 1}
                    className="p-4 rounded-full bg-white text-indigo-900 hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/20"
                >
                    <ArrowRightIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}

export default StoryViewer;
