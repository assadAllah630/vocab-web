import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SparklesIcon,
    AdjustmentsHorizontalIcon,
    BookOpenIcon,
    LanguageIcon,
    SpeakerWaveIcon,
    ClipboardDocumentCheckIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    PlayCircleIcon,
    StopCircleIcon
} from '@heroicons/react/24/outline';

const WORD_TYPES = [
    { value: 'verb', label: 'Verbs', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'noun', label: 'Nouns', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'adjective', label: 'Adjectives', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'phrase', label: 'Phrases', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'connector', label: 'Connectors', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

function TextGenerator() {
    const [level, setLevel] = useState('A1');
    const [length, setLength] = useState('medium');
    const [filters, setFilters] = useState([]);
    const [generatedText, setGeneratedText] = useState('');
    const [vocabularyUsed, setVocabularyUsed] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // New features
    const [grammarTopics, setGrammarTopics] = useState([]);
    const [selectedGrammar, setSelectedGrammar] = useState([]);
    const [clarificationPrompt, setClarificationPrompt] = useState('');
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Load state from sessionStorage on mount
    useEffect(() => {
        const savedState = sessionStorage.getItem('textGeneratorState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                setLevel(state.level || 'A1');
                setLength(state.length || 'medium');
                setFilters(state.filters || []);
                setGeneratedText(state.generatedText || '');
                setVocabularyUsed(state.vocabularyUsed || []);
                setSelectedGrammar(state.selectedGrammar || []);
                setClarificationPrompt(state.clarificationPrompt || '');
                setAudioUrl(state.audioUrl || null);
            } catch (err) {
                console.error('Failed to load saved state', err);
            }
        }
        fetchGrammarTopics();
    }, []);

    // Save state to sessionStorage whenever it changes
    useEffect(() => {
        const state = {
            level,
            length,
            filters,
            generatedText,
            vocabularyUsed,
            selectedGrammar,
            clarificationPrompt,
            audioUrl
        };
        sessionStorage.setItem('textGeneratorState', JSON.stringify(state));
    }, [level, length, filters, generatedText, vocabularyUsed, selectedGrammar, clarificationPrompt, audioUrl]);

    const fetchGrammarTopics = async () => {
        try {
            const res = await api.get('grammar/');
            setGrammarTopics(res.data);
        } catch (err) {
            console.error('Failed to fetch grammar topics', err);
        }
    };

    const handleGrammarToggle = (topicId) => {
        setSelectedGrammar(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };
    const handleFilterToggle = (filterValue) => {
        setFilters(prev =>
            prev.includes(filterValue)
                ? prev.filter(f => f !== filterValue)
                : [...prev, filterValue]
        );
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setGeneratedText('');
        setVocabularyUsed([]);
        setAudioUrl(null); // Reset audio on new generation

        try {
            const res = await api.post('generate-text/', {
                level,
                length,
                filters: filters.length > 0 ? filters : undefined,
                grammar_topics: selectedGrammar,
                clarification_prompt: clarificationPrompt
            });

            setGeneratedText(res.data.text);
            setVocabularyUsed(res.data.vocabulary_used || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate text');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        // Could add a toast notification here
    };

    const handleGenerateAudio = async () => {
        if (!generatedText) return;

        setAudioLoading(true);
        try {
            const res = await api.post('generate-podcast/', {
                text: generatedText,
                title: 'Text to Speech',
            });
            setAudioUrl(res.data.audio_file);
        } catch (err) {
            console.error('Audio generation failed', err);
            alert('Audio generation failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setAudioLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-primary-600" />
                        Creative Studio
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Craft unique stories and texts tailored to your learning level.
                    </p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                {/* Left Panel: Configuration */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-4">
                            <AdjustmentsHorizontalIcon className="w-5 h-5 text-primary-500" />
                            Configuration
                        </div>

                        {/* Level & Length */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Level
                                </label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-medium text-slate-700"
                                >
                                    <option value="A1">A1 - Beginner</option>
                                    <option value="A2">A2 - Elementary</option>
                                    <option value="B1">B1 - Intermediate</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Length
                                </label>
                                <select
                                    value={length}
                                    onChange={(e) => setLength(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-medium text-slate-700"
                                >
                                    <option value="short">Short (~75 words)</option>
                                    <option value="medium">Medium (~150 words)</option>
                                    <option value="long">Long (~250 words)</option>
                                </select>
                            </div>
                        </div>

                        {/* Vocabulary Filters */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Include Vocabulary
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {WORD_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => handleFilterToggle(type.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.includes(type.value)
                                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grammar Focus */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Grammar Focus
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 custom-scrollbar">
                                {grammarTopics.length > 0 ? (
                                    <div className="space-y-1">
                                        {grammarTopics.map(topic => (
                                            <label key={topic.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGrammar.includes(topic.id) ? 'bg-primary-500 border-primary-500' : 'border-slate-300 bg-white'}`}>
                                                    {selectedGrammar.includes(topic.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGrammar.includes(topic.id)}
                                                    onChange={() => handleGrammarToggle(topic.id)}
                                                    className="hidden"
                                                />
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{topic.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 p-2 text-center">No grammar topics found.</p>
                                )}
                            </div>
                        </div>

                        {/* Custom Instructions */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Custom Instructions
                            </label>
                            <div className="relative">
                                <PencilSquareIcon className="absolute top-3 left-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={clarificationPrompt}
                                    onChange={(e) => setClarificationPrompt(e.target.value)}
                                    placeholder="e.g. 'About a trip to Berlin'"
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    Crafting Story...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    Generate Story
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

                {/* Right Panel: Canvas */}
                <div className="lg:col-span-8 flex flex-col min-h-0">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex-1 flex flex-col overflow-hidden relative">
                        {/* Canvas Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5 text-slate-400" />
                                <span className="font-bold text-slate-700">Story Canvas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {generatedText && (
                                    <>
                                        <button
                                            onClick={handleGenerateAudio}
                                            disabled={audioLoading}
                                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="Generate Audio"
                                        >
                                            {audioLoading ? (
                                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <SpeakerWaveIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Copy Text"
                                        >
                                            <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Audio Player */}
                        <AnimatePresence>
                            {audioUrl && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-indigo-50 border-b border-indigo-100 px-6 py-3 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <SpeakerWaveIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <audio controls className="w-full h-8 accent-indigo-600" src={audioUrl}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                            {generatedText ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="prose prose-lg prose-slate max-w-none"
                                >
                                    <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-lg">
                                        {generatedText}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <SparklesIcon className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-600 mb-2">Ready to Create?</h3>
                                    <p className="max-w-xs mx-auto">
                                        Configure your settings on the left and let our AI craft a personalized story for you.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Vocabulary Footer */}
                        <AnimatePresence>
                            {vocabularyUsed.length > 0 && (
                                <motion.div
                                    initial={{ y: 100 }}
                                    animate={{ y: 0 }}
                                    className="border-t border-slate-100 bg-slate-50/80 backdrop-blur-md p-4"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <LanguageIcon className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Vocabulary Used
                                        </span>
                                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {vocabularyUsed.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                        {vocabularyUsed.map((word, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm"
                                            >
                                                {word}
                                            </motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TextGenerator;
