import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Play, Pause, Plus, Settings, ChevronLeft, ChevronDown,
    Headphones, Sparkles, BookOpen, Clock, AlertCircle, Trash2,
    BarChart3, ChevronRight, Music, Heart, Shuffle, Rewind, FastForward, Repeat, MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AudioVisualizer = ({ isPlaying }) => {
    return (
        <div className="flex items-center gap-1 h-6">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-indigo-500 rounded-full"
                    initial={{ height: 4 }}
                    animate={{
                        height: isPlaying ? [8, 24, 8, 16] : 4,
                        opacity: isPlaying ? 1 : 0.5
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};
import api from '../../api';

const MobilePodcastStudio = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [statusData, setStatusData] = useState(null);
    const [statusInterval, setStatusInterval] = useState(null);

    // Generation Options
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [genOptions, setGenOptions] = useState({
        topic: '',
        level: 'B1',
        speed: 1.0
    });

    // Audio Player State
    // Audio Player State
    const [currentAudio, setCurrentAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTranscript, setCurrentTranscript] = useState([]);
    const [activeWordIndex, setActiveWordIndex] = useState(-1);
    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchEpisodes(selectedCategory.id);
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('podcasts/categories/');
            setCategories(res.data);
            if (res.data.length > 0 && !selectedCategory) {
                setSelectedCategory(res.data[0]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to load shows", err);
            setLoading(false);
        }
    };

    const fetchEpisodes = async (categoryId) => {
        try {
            // Filter by category client-side or assume endpoint supports query
            // For now, getting all and filtering (MVP) or update API to filter
            const res = await api.get('podcasts/');
            const filtered = res.data.filter(ep => ep.category === categoryId);
            setEpisodes(filtered);
        } catch (err) {
            console.error("Failed to load episodes", err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedCategory) return;
        setGenerating(true);
        setShowGenerateModal(false); // Close modal

        setStatusData({ message: "Starting Agent...", progress: 0, estimated: 120 });
        try {
            const payload = {
                category_id: selectedCategory.id,
                topic: genOptions.topic,
                level: genOptions.level,
                speed: genOptions.speed
            };
            const res = await api.post('podcasts/generate/', payload);
            const podcastId = res.data.id;

            // Start Polling
            const interval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`podcasts/${podcastId}/`);
                    const data = statusRes.data;
                    setStatusData({
                        message: data.current_message,
                        progress: data.progress,
                        estimated: data.estimated_remaining
                    });

                    if (data.processing_status === 'completed') {
                        clearInterval(interval);
                        setGenerating(false);
                        setStatusData(null);
                        fetchEpisodes(selectedCategory.id);
                        alert("Podcast Generated Successfully!");
                    } else if (data.processing_status === 'failed') {
                        clearInterval(interval);
                        setGenerating(false);
                        setStatusData(null);
                        // Remove temp podcast
                        setEpisodes(prev => prev.filter(p => p.id !== podcastId));
                        alert(`Generation Failed: ${data.current_message}`);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);
            setStatusInterval(interval);

        } catch (err) {
            console.error(err);
            setGenerating(false);
            setStatusData(null);
            alert("Failed to start generation.");
        }
    };

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (statusInterval) clearInterval(statusInterval);
        }
    }, [statusInterval]);

    const handleCreateCategory = async (data) => {
        try {
            const res = await api.post('podcasts/categories/', data);
            setCategories([...categories, res.data]);
            setSelectedCategory(res.data);
            setShowCreateModal(false);
        } catch (err) {
            alert("Failed to create show.");
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;
        if (!window.confirm(`Are you sure you want to delete "${selectedCategory.name}" and all its episodes?`)) return;

        try {
            await api.delete(`podcasts/categories/${selectedCategory.id}/`);
            const newCats = categories.filter(c => c.id !== selectedCategory.id);
            setCategories(newCats);
            setSelectedCategory(newCats.length > 0 ? newCats[0] : null);
            alert("Show deleted.");
        } catch (err) {
            console.error(err);
            alert("Failed to delete show.");
        }
    };

    const handleDeleteEpisode = async (e, episodeId) => {
        e.stopPropagation(); // Prevent playing if clicked
        if (!window.confirm("Delete this episode? This will impact the continuity of future episodes.")) return;

        try {
            await api.delete(`podcasts/${episodeId}/`);
            setEpisodes(episodes.filter(ep => ep.id !== episodeId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete episode.");
        }
    };

    const playEpisode = (episode) => {
        if (currentAudio) {
            currentAudio.pause();
        }
        if (episode.audio_url) {
            const audio = new Audio(episode.audio_url);
            audio.play();
            setCurrentAudio(audio);
            setIsPlaying(true);
            setCurrentEpisode(episode);
            setCurrentTranscript(episode.speech_marks || []);
            setShowFullPlayer(true); // Open full player on start

            audio.addEventListener('ended', () => setIsPlaying(false));
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    setAudioProgress((audio.currentTime / audio.duration) * 100);

                    // Sync Transcript
                    if (episode.speech_marks && episode.speech_marks.length > 0) {
                        const currentTimeMs = audio.currentTime * 1000;
                        // Find the word that corresponds to current time
                        // We want the last word where word.time <= currentTime
                        let activeIdx = -1;
                        for (let i = 0; i < episode.speech_marks.length; i++) {
                            if (episode.speech_marks[i].time <= currentTimeMs) {
                                activeIdx = i;
                            } else {
                                break;
                            }
                        }
                        setActiveWordIndex(activeIdx);
                    }
                }
            });
        }
    };

    const handleSeek = (e) => {
        if (!currentAudio) return;
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = offsetX / rect.width;
        currentAudio.currentTime = percent * currentAudio.duration;
    };

    const handleWordClick = (startTimeMs) => {
        if (currentAudio) {
            currentAudio.currentTime = startTimeMs / 1000;
            if (!isPlaying) {
                currentAudio.play();
                setIsPlaying(true);
            }
        }
    };

    const togglePlay = () => {
        if (currentAudio) {
            if (isPlaying) {
                currentAudio.pause();
            } else {
                currentAudio.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-white pb-28 overflow-x-hidden font-sans">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 pt-12 flex justify-between items-center bg-[#09090B]/80 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5"
            >
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                        <ChevronLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Podcast Studio <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">Beta</span>
                        </h1>
                        <p className="text-zinc-500 text-xs">Create & Listen</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5 text-white" />
                </button>
            </motion.div>

            {/* Shows Carousel */}
            {/* Show Highlights / Carousel */}
            <div className="pl-6 py-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <AnimatePresence>
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setSelectedCategory(cat)}
                            className={`inline-block mr-4 p-4 rounded-2xl w-64 cursor-pointer transition-all border
                                ${selectedCategory?.id === cat.id
                                    ? 'bg-gradient-to-br from-indigo-900/40 to-indigo-900/10 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
                                    : 'bg-[#18181B] border-[#27272A] hover:bg-[#202023]'
                                }
                            `}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner
                                    ${selectedCategory?.id === cat.id ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'}
                                `}>
                                    <Headphones className="w-6 h-6" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-bold truncate text-sm">{cat.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <p className="text-xs text-zinc-500 truncate">{cat.style}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{cat.target_level || 'B1'} LEVEL</p>
                                <ChevronRight className={`w-4 h-4 ${selectedCategory?.id === cat.id ? 'text-indigo-400' : 'text-zinc-600'}`} />
                            </div>
                        </motion.div>
                    ))}
                    {categories.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            onClick={() => setShowCreateModal(true)}
                            className="inline-block p-4 rounded-2xl w-64 border border-dashed border-zinc-700 bg-zinc-900/30 flex flex-col items-center justify-center cursor-pointer text-zinc-500 gap-2 h-[108px]"
                        >
                            <Plus className="w-6 h-6 mb-1" />
                            <span className="text-sm font-medium">Start New Series</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Content Area */}
            <div className="px-6 mt-2">
                <AnimatePresence mode='wait'>
                    {selectedCategory && (
                        <motion.div
                            key={selectedCategory.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-bold">Episodes</h2>
                                    <p className="text-xs text-zinc-500">
                                        {episodes.length} available • <span className="text-indigo-400">New Daily</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteCategory}
                                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                        title="Delete Show"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowGenerateModal(true)}
                                        disabled={generating}
                                        className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg
                                            ${generating
                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30'
                                            }
                                        `}
                                    >
                                        {generating ? (
                                            <><Clock className="w-4 h-4 animate-spin" /> <span className="text-sm">Creating...</span></>
                                        ) : (
                                            <><Sparkles className="w-4 h-4" /> <span className="text-sm">Generate New</span></>
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Status Bar */}
                            <AnimatePresence>
                                {generating && statusData && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        className="bg-[#18181B] rounded-2xl p-5 border border-indigo-500/30 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                                        <div className="flex justify-between items-center mb-3 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                                <span className="text-sm font-semibold text-indigo-300">{statusData.message}</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">{statusData.estimated}s</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${statusData.progress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3">
                                {episodes.map((ep, i) => (
                                    <motion.div
                                        key={ep.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`group bg-[#18181B] rounded-2xl p-4 border transition-all relative overflow-hidden
                                            ${currentAudio?.src === ep.audio_url ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-[#27272A] hover:border-zinc-600'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start gap-4 z-10 relative">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400">EP {ep.episode_number}</span>
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {Math.round(ep.duration / 60)}m
                                                    </span>
                                                </div>
                                                <h3 className={`font-bold text-base truncate mb-1 ${currentAudio?.src === ep.audio_url ? 'text-indigo-300' : 'text-zinc-200'}`}>
                                                    {ep.title}
                                                </h3>
                                                <p className="text-xs text-zinc-500 line-clamp-2">{ep.summary || "No description."}</p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => playEpisode(ep)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg
                                                        ${currentAudio?.src === ep.audio_url && isPlaying
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                                        }
                                                    `}
                                                >
                                                    {currentAudio?.src === ep.audio_url && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteEpisode(e, ep.id)}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar within card if active */}
                                        {currentAudio && currentAudio.src === ep.audio_url && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/50">
                                                <motion.div
                                                    className="h-full bg-indigo-500"
                                                    style={{ width: `${audioProgress}%` }}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {episodes.length === 0 && (
                                    <div className="text-center py-16 text-zinc-600 bg-[#18181B]/50 rounded-2xl border border-dashed border-zinc-800">
                                        <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        <p>No episodes yet. Tap "Generate" to start!</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Generate Options Modal */}
            <AnimatePresence>
                {showGenerateModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#18181B] rounded-2xl w-full max-w-md p-6 border border-zinc-700"
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                Podcast Options
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Topic (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. The history of Coffee, Future of AI..."
                                        className="w-full bg-zinc-800 rounded-lg p-3 text-white border border-zinc-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        value={genOptions.topic}
                                        onChange={(e) => setGenOptions({ ...genOptions, topic: e.target.value })}
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Leave blank for a random topic based on series.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Target Level</label>
                                        <select
                                            className="w-full bg-zinc-800 rounded-lg p-3 text-white border border-zinc-700 outline-none"
                                            value={genOptions.level}
                                            onChange={(e) => setGenOptions({ ...genOptions, level: e.target.value })}
                                        >
                                            <option value="A1">A1 (Beginner)</option>
                                            <option value="A2">A2 (Elementary)</option>
                                            <option value="B1">B1 (Intermediate)</option>
                                            <option value="B2">B2 (Upper Intermediate)</option>
                                            <option value="C1">C1 (Advanced)</option>
                                            <option value="C2">C2 (Proficiency)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Speed</label>
                                        <select
                                            className="w-full bg-zinc-800 rounded-lg p-3 text-white border border-zinc-700 outline-none"
                                            value={genOptions.speed}
                                            onChange={(e) => setGenOptions({ ...genOptions, speed: parseFloat(e.target.value) })}
                                        >
                                            <option value="0.8">0.8x (Slower)</option>
                                            <option value="0.9">0.9x (Slow)</option>
                                            <option value="1.0">1.0x (Normal)</option>
                                            <option value="1.1">1.1x (Fast)</option>
                                            <option value="1.25">1.25x (Faster)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowGenerateModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                >
                                    Generate Episode
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Category Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700"
                        >
                            <h2 className="text-xl font-bold mb-4">New Podcast Series</h2>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                handleCreateCategory({
                                    name: formData.get('name'),
                                    style: formData.get('style'),
                                    tone: formData.get('tone'),
                                    target_level: 'B1' // Default for now
                                });
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Show Name</label>
                                        <input name="name" required className="w-full bg-gray-700 rounded-lg p-3 text-white border-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Daily Tech News" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Style</label>
                                        <select name="style" className="w-full bg-gray-700 rounded-lg p-3 text-white border-none">
                                            <option value="Conversational">Conversational (2 Hosts)</option>
                                            <option value="Interview">Interview</option>
                                            <option value="Storytelling">Storytelling</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Tone</label>
                                        <select name="tone" className="w-full bg-gray-700 rounded-lg p-3 text-white border-none">
                                            <option value="Casual">Casual & Fun</option>
                                            <option value="Professional">Professional</option>
                                            <option value="Academic">Academic</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium">Create Show</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Mini Player */}
            <AnimatePresence>
                {currentAudio && !showFullPlayer && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        onClick={() => setShowFullPlayer(true)}
                        className="fixed bottom-24 left-4 right-4 z-50 cursor-pointer"
                    >
                        <div className="bg-[#18181B]/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl shadow-black/50 flex items-center justify-between">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                    {isPlaying ? (
                                        <AudioVisualizer isPlaying={true} />
                                    ) : (
                                        <Headphones className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-white truncate pr-4">{currentEpisode?.title || "Playing..."}</p>
                                    <p className="text-xs text-indigo-400 font-medium">Tap for Transcript</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const time = currentAudio.currentTime - 10;
                                        currentAudio.currentTime = time < 0 ? 0 : time;
                                    }}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                                </button>
                            </div>
                            {/* Background Progress */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800 rounded-b-2xl overflow-hidden">
                                <motion.div className="h-full bg-indigo-500" style={{ width: `${audioProgress}%` }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Full Screen Player with Transcript */}
            <AnimatePresence>
                {showFullPlayer && currentEpisode && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[2000] flex flex-col bg-black overflow-hidden"
                    >
                        {/* Dynamic Background */}
                        <div className="absolute inset-0 opacity-40">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-black animate-pulse-slow" />
                            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen" />
                            <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen" />
                        </div>

                        {/* Player Header */}
                        <div className="relative z-10 p-6 pt-12 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                            <button
                                onClick={() => setShowFullPlayer(false)}
                                className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/5"
                            >
                                <ChevronDown className="w-6 h-6" />
                            </button>
                            <div className="flex flex-col items-center">
                                <h3 className="font-bold text-xs tracking-[0.2em] uppercase text-indigo-300">Now Playing</h3>
                                <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1 animate-pulse" />
                            </div>
                            <button className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/5">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Immersive Transcript Area */}
                        <div className="flex-1 overflow-y-auto px-6 relative z-10 mask-image-premium-gradient scrollbar-hide">
                            {currentTranscript.length > 0 ? (
                                <div className="space-y-6 py-[40vh] text-center max-w-3xl mx-auto">
                                    {/* Group words into chunks or render naturally wrapping */}
                                    <div className="flex flex-wrap justify-center content-center gap-x-3 gap-y-4 px-4 leading-relaxed">
                                        {currentTranscript.map((mark, i) => {
                                            const isActive = i === activeWordIndex;
                                            const isPast = i < activeWordIndex;

                                            // Dynamic size for current word
                                            return (
                                                <motion.span
                                                    key={i}
                                                    onClick={() => handleWordClick(mark.time)}
                                                    animate={{
                                                        scale: isActive ? 1.05 : 1,
                                                        opacity: isActive ? 1 : isPast ? 0.6 : 0.3,
                                                        color: isActive ? '#ffffff' : isPast ? '#a1a1aa' : '#52525b',
                                                        filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none',
                                                        y: isActive ? -2 : 0
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`cursor-pointer font-bold text-3xl md:text-4xl transition-all duration-300 select-none
                                                    ${isActive ? 'z-10' : 'z-0'}
                                                `}
                                                    ref={el => isActive && el && el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })}
                                                >
                                                    {mark.word}
                                                </motion.span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <Music className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <p className="font-medium text-lg">Lyrics not available</p>
                                    <p className="text-sm opacity-60">Generate a new episode to see the transcript.</p>
                                </div>
                            )}
                        </div>

                        {/* Player Controls Footer */}
                        {/* Added pb-32 to push controls above the bottom navigation bar */}
                        <div className="relative z-10 p-8 pb-32 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-sm">
                            <div className="mb-8 flex items-end justify-between">
                                <div className="flex-1 mr-4">
                                    <motion.h2 layoutId={`title-${currentEpisode.id}`} className="text-2xl font-bold text-white mb-1 line-clamp-1">{currentEpisode.title}</motion.h2>
                                    <p className="text-indigo-400 font-medium">{currentEpisode.category_name || "Podcast"}</p>
                                </div>
                                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                    <Heart className="w-6 h-6 text-zinc-400 hover:text-red-500 transition-colors" />
                                </button>
                            </div>

                            {/* Enhanced Progress Bar */}
                            <div
                                className="h-1.5 bg-zinc-800 rounded-full mb-2 cursor-pointer group relative py-2 -my-2" // Larger hit area
                                onClick={handleSeek}
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-white rounded-full relative"
                                        style={{ width: `${audioProgress}%` }}
                                        layoutId="progress"
                                    />
                                </div>
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-0 group-hover:scale-100 duration-200"
                                    style={{ left: `${audioProgress}%`, marginLeft: '-6px' }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-medium text-zinc-500 mb-6 font-mono">
                                <span>{currentAudio ? new Date(currentAudio.currentTime * 1000).toISOString().substr(14, 5) : "00:00"}</span>
                                <span>{currentAudio && currentAudio.duration ? new Date(currentAudio.duration * 1000).toISOString().substr(14, 5) : "--:--"}</span>
                            </div>

                            {/* Main Controls */}
                            <div className="flex justify-between items-center max-w-sm mx-auto">
                                <button className="text-zinc-400 hover:text-white transition-colors p-2">
                                    <Shuffle className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleWordClick((currentAudio?.currentTime - 10) * 1000)}
                                    className="p-4 rounded-full text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <Rewind className="w-8 h-8" />
                                </button>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={togglePlay}
                                    className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all"
                                >
                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
                                </motion.button>

                                <button
                                    onClick={() => handleWordClick((currentAudio?.currentTime + 10) * 1000)}
                                    className="p-4 rounded-full text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <FastForward className="w-8 h-8" />
                                </button>

                                <button className="text-zinc-400 hover:text-white transition-colors p-2">
                                    <Repeat className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobilePodcastStudio;
