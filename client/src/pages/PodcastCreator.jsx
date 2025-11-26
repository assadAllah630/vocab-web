import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MicrophoneIcon,
    PlayCircleIcon,
    StopCircleIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon,
    SparklesIcon,
    MusicalNoteIcon,
    SignalIcon,
    SpeakerWaveIcon
} from '@heroicons/react/24/outline';

function PodcastCreator() {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [voiceId, setVoiceId] = useState('marlene');
    const [voices, setVoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedPodcast, setGeneratedPodcast] = useState(null);
    const [autoGenerate, setAutoGenerate] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Fetch Speechify Voices
        const fetchVoices = async () => {
            try {
                const res = await api.get('tts/speechify-voices/');
                if (res.data && Array.isArray(res.data)) {
                    console.log('Speechify voices response:', res.data);

                    // Map voices to ensure they have a name property
                    const mappedVoices = res.data.map(v => ({
                        id: v.id || v.voice_id,
                        name: v.name || v.display_name || v.voice_name || v.id || 'Unknown Voice',
                        language: v.language || v.lang
                    }));

                    // Filter for German voices
                    const germanVoices = mappedVoices.filter(v =>
                        v.language === 'de-DE' ||
                        v.language === 'de' ||
                        v.language === 'deu'
                    );

                    if (germanVoices.length > 0) {
                        console.log('German voices found:', germanVoices);
                        setVoices(germanVoices);
                        setVoiceId(germanVoices[0].id);
                    } else {
                        // If no German voices found, show all
                        console.log('No German voices found, showing all:', mappedVoices);
                        setVoices(mappedVoices);
                        if (mappedVoices.length > 0) {
                            setVoiceId(mappedVoices[0].id);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch Speechify voices', err);
                // Fallback to common German voices
                setVoices([
                    { id: 'marlene', name: 'Marlene (German Female)' },
                    { id: 'hans', name: 'Hans (German Male)' },
                    { id: 'vicki', name: 'Vicki (German Female)' },
                ]);
                setVoiceId('marlene');
            }
        };
        fetchVoices();
    }, []);

    const handleGenerate = async () => {
        if (!autoGenerate && !text.trim()) {
            setError('Please enter some text');
            return;
        }

        if (!title.trim()) {
            setError('Please enter a title');
            return;
        }

        setLoading(true);
        setError('');
        setGeneratedPodcast(null);

        try {
            const res = await api.post('generate-podcast/', {
                text: autoGenerate ? null : text,
                title,
                voice_id: voiceId
            });

            setGeneratedPodcast(res.data);
            setText(res.data.text_content);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate podcast');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <MicrophoneIcon className="w-8 h-8 text-rose-500" />
                        Podcast Studio
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Turn your vocabulary into engaging audio lessons.
                    </p>
                </div>
                {loading && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-sm font-bold animate-pulse border border-rose-100">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        RECORDING IN PROGRESS
                    </div>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                {/* Left Panel: Studio Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-4">
                            <MusicalNoteIcon className="w-5 h-5 text-rose-500" />
                            Studio Settings
                        </div>

                        {/* Title Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Episode Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Daily German Briefing"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none font-medium text-slate-900"
                            />
                        </div>

                        {/* Voice Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Voice Artist
                            </label>
                            <div className="relative">
                                <select
                                    value={voiceId}
                                    onChange={(e) => setVoiceId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none font-medium text-slate-900 appearance-none"
                                >
                                    {voices.map(voice => (
                                        <option key={voice.id} value={voice.id}>
                                            {voice.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <SignalIcon className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Requires Speechify API key in Settings.
                            </p>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2 text-amber-700 text-xs">
                                <span className="font-bold">Note:</span>
                                Speechify supports high-quality German voices.
                            </div>
                        </div>

                        {/* Input Mode Selection */}
                        <div className="bg-slate-100 p-1 rounded-xl flex mb-4">
                            <button
                                onClick={() => setAutoGenerate(true)}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${autoGenerate
                                    ? 'bg-white text-rose-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <SparklesIcon className="w-4 h-4 inline-block mr-2" />
                                AI Script
                            </button>
                            <button
                                onClick={() => setAutoGenerate(false)}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${!autoGenerate
                                    ? 'bg-white text-rose-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <DocumentTextIcon className="w-4 h-4 inline-block mr-2" />
                                Manual Text
                            </button>
                        </div>

                        {/* Input Area */}
                        <AnimatePresence mode="wait">
                            {autoGenerate ? (
                                <motion.div
                                    key="auto"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="bg-rose-50 border border-rose-100 rounded-xl p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <SparklesIcon className="w-5 h-5 text-rose-500 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-bold text-rose-900">AI Generation</h3>
                                            <p className="text-xs text-rose-700 mt-1">
                                                We'll generate a script using your recent vocabulary words ({'<'} 50 words).
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="manual"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                >
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Script Text
                                    </label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Enter your German text here..."
                                        rows={6}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none font-medium text-slate-900 resize-none"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Producing...
                                </>
                            ) : (
                                <>
                                    <MicrophoneIcon className="w-6 h-6" />
                                    Start Recording
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Panel: Playback & Script */}
                <div className="lg:col-span-8 flex flex-col min-h-0">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex-1 flex flex-col overflow-hidden relative">
                        {/* Player Header */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                                        <SpeakerWaveIcon className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {generatedPodcast ? generatedPodcast.title : 'Ready to Record'}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {generatedPodcast ? 'Audio generated successfully' : 'Configure settings to start'}
                                        </p>
                                    </div>
                                </div>
                                {generatedPodcast?.audio_url && (
                                    <a
                                        href={generatedPodcast.audio_url}
                                        download
                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                        title="Download Audio"
                                    >
                                        <ArrowDownTrayIcon className="w-6 h-6" />
                                    </a>
                                )}
                            </div>

                            {/* Audio Visualizer / Player */}
                            <div className="bg-slate-900 rounded-xl p-4 relative overflow-hidden group">
                                {/* Simulated Waveform Background */}
                                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20">
                                    {[...Array(40)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: isPlaying ? [10, 40, 10] : 10 }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1,
                                                delay: i * 0.05,
                                                ease: "easeInOut"
                                            }}
                                            className="w-1 bg-rose-500 rounded-full"
                                            style={{ height: '10px' }}
                                        />
                                    ))}
                                </div>

                                {generatedPodcast?.audio_url ? (
                                    <audio
                                        controls
                                        className="w-full relative z-10 accent-rose-500"
                                        src={generatedPodcast.audio_url}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onEnded={() => setIsPlaying(false)}
                                    >
                                        Your browser does not support the audio element.
                                    </audio>
                                ) : (
                                    <div className="h-12 flex items-center justify-center text-slate-500 text-sm font-medium">
                                        Waiting for audio generation...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Script View */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white relative">
                            {generatedPodcast ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="max-w-3xl mx-auto"
                                >
                                    <div className="flex items-center gap-2 mb-6 text-slate-400 uppercase tracking-widest text-xs font-bold">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        Transcript
                                    </div>
                                    <div className="prose prose-lg prose-slate max-w-none">
                                        <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-lg">
                                            {generatedPodcast.text_content}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <MicrophoneIcon className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-600 mb-2">Studio is Empty</h3>
                                    <p className="max-w-xs mx-auto">
                                        Use the controls on the left to generate your first AI podcast episode.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PodcastCreator;
