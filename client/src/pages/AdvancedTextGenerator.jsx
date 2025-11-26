import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpenIcon,
    NewspaperIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    PhotoIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import api from '../api';

function AdvancedTextGenerator() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userVocab, setUserVocab] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        topic: '',
        content_type: 'story', // story, article, dialogue
        student_level: 'B1',
        vocabulary_selection: 'random', // random, manual, hlr
        selected_words: [],
        grammar_selection: 'random', // random, manual
        selected_grammar: [],
        grammar_focus: '',
        instructor_notes: '',
        word_count: 300,
        generate_images: false // NEW: Image generation toggle
    });

    // Fetch user vocabulary for manual selection
    useEffect(() => {
        const fetchVocab = async () => {
            try {
                const res = await api.get('vocab/');
                setUserVocab(res.data);
            } catch (err) {
                console.error('Failed to fetch vocabulary', err);
            }
        };
        fetchVocab();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('ai/generate-advanced-text/', formData);

            // Navigate to appropriate viewer based on content type
            const contentId = res.data.id;
            if (formData.content_type === 'story') {
                navigate(`/story/${contentId}`);
            } else if (formData.content_type === 'article') {
                navigate(`/article/${contentId}`);
            } else if (formData.content_type === 'dialogue') {
                navigate(`/dialogue/${contentId}`);
            }
        } catch (err) {
            console.error('Generation failed', err);
            setError(err.response?.data?.error || 'Failed to generate content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleWordSelection = (wordId) => {
        setFormData(prev => {
            const current = prev.selected_words;
            if (current.includes(wordId)) {
                return { ...prev, selected_words: current.filter(id => id !== wordId) };
            } else {
                return { ...prev, selected_words: [...current, wordId] };
            }
        });
    };

    // Content Type Cards
    const contentTypes = [
        {
            id: 'story',
            title: 'Story',
            icon: <BookOpenIcon className="h-8 w-8" />,
            description: 'Engaging stories with sequential events and emojis.'
        },
        {
            id: 'article',
            title: 'Article',
            icon: <NewspaperIcon className="h-8 w-8" />,
            description: 'Professional articles with organized paragraphs.'
        },
        {
            id: 'dialogue',
            title: 'Dialogue',
            icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
            description: 'Natural conversations between two characters.'
        }
    ];

    // CEFR Levels
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8 text-center relative">
                <button
                    onClick={() => navigate('/generated-content')}
                    className="absolute right-0 top-0 text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                    <BookOpenIcon className="h-4 w-4" />
                    My Library
                </button>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                    <SparklesIcon className="h-8 w-8 text-indigo-600" />
                    AI Content Generator
                </h1>
                <p className="mt-2 text-slate-600">
                    Create custom stories, articles, and dialogues tailored to your level.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Content Type Selection */}
                <section>
                    <label className="block text-sm font-medium text-slate-700 mb-4">Content Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {contentTypes.map((type) => (
                            <div
                                key={type.id}
                                onClick={() => setFormData({ ...formData, content_type: type.id })}
                                className={`cursor-pointer rounded-xl p-6 border-2 transition-all ${formData.content_type === type.id
                                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-opacity-50'
                                    : 'border-slate-200 hover:border-indigo-300 bg-white'
                                    }`}
                            >
                                <div className={`mb-4 ${formData.content_type === type.id ? 'text-indigo-600' : 'text-slate-500'
                                    }`}>
                                    {type.icon}
                                </div>
                                <h3 className="font-semibold text-slate-900">{type.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Topic & Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                        <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
                            Topic
                        </label>
                        <input
                            type="text"
                            id="topic"
                            required
                            placeholder="e.g., A day at the beach, Technology trends..."
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </section>

                    <section>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Student Level (CEFR)
                        </label>
                        <div className="flex gap-2">
                            {levels.map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, student_level: lvl })}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${formData.student_level === lvl
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Image Generation Toggle (Only for Stories) */}
                {formData.content_type === 'story' && (
                    <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm text-indigo-600">
                                <PhotoIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-slate-900">Illustrated Story</h3>
                                        <p className="text-sm text-slate-500">Generate professional illustrations for each scene</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.generate_images}
                                            onChange={(e) => setFormData({ ...formData, generate_images: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {formData.generate_images && (
                                    <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <ClockIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <p>
                                            <strong>Note:</strong> Generating illustrations takes time (1-2 minutes per image).
                                            You can start reading the story while images generate in the background.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Vocabulary Selection */}
                <section className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-medium text-slate-900">Vocabulary Selection</h3>
                            <p className="text-sm text-slate-500">Choose how words are selected</p>
                        </div>
                        <div className="flex bg-slate-100 rounded-lg p-1 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, vocabulary_selection: 'random' })}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${formData.vocabulary_selection === 'random'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                AI Auto
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, vocabulary_selection: 'hlr' })}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${formData.vocabulary_selection === 'hlr'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Smart Review (HLR)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, vocabulary_selection: 'manual' })}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${formData.vocabulary_selection === 'manual'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Manual
                            </button>
                        </div>
                    </div>

                    {formData.vocabulary_selection === 'manual' && (
                        <div className="mt-4 animate-fadeIn">
                            <p className="text-sm text-slate-500 mb-3">Select words to include in your content:</p>
                            <div className="max-h-60 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-2 custom-scrollbar">
                                {userVocab.map((word) => (
                                    <div
                                        key={word.id}
                                        onClick={() => toggleWordSelection(word.id)}
                                        className={`cursor-pointer px-3 py-2 rounded-lg text-sm border transition-colors flex items-center justify-between ${formData.selected_words.includes(word.id)
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span>{word.word}</span>
                                        {formData.selected_words.includes(word.id) && (
                                            <CheckCircleIcon className="h-4 w-4 text-indigo-600" />
                                        )}
                                    </div>
                                ))}
                                {userVocab.length === 0 && (
                                    <p className="col-span-full text-center text-slate-500 py-4">
                                        No vocabulary found. Add some words first!
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-right">
                                {formData.selected_words.length} words selected
                            </p>
                        </div>
                    )}

                    {formData.vocabulary_selection === 'hlr' && (
                        <div className="mt-4 bg-indigo-50 rounded-lg p-4 text-sm text-indigo-800 flex items-start gap-2">
                            <SparklesIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p>
                                The AI will automatically select words you need to review based on your learning history (Half-Life Regression algorithm).
                            </p>
                        </div>
                    )}
                </section>

                {/* Grammar Selection */}
                <section className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-medium text-slate-900">Grammar Focus</h3>
                            <p className="text-sm text-slate-500">Target specific grammar points</p>
                        </div>
                        <div className="flex bg-slate-100 rounded-lg p-1 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, grammar_selection: 'random' })}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${formData.grammar_selection === 'random'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                AI Auto-Select
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, grammar_selection: 'manual' })}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${formData.grammar_selection === 'manual'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Specific Focus
                            </button>
                        </div>
                    </div>

                    {formData.grammar_selection === 'manual' && (
                        <div className="mt-4 animate-fadeIn">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Enter Grammar Topic
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Past Perfect, Conditional Sentences, Prepositions..."
                                value={formData.grammar_focus}
                                onChange={(e) => setFormData({ ...formData, grammar_focus: e.target.value })}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                The AI will specifically focus on demonstrating this grammar point.
                            </p>
                        </div>
                    )}
                </section>

                {/* Instructor Notes */}
                <section>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Instructor Notes (Optional)
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Add specific instructions for the AI (e.g., 'Make the story funny', 'Focus on travel vocabulary', 'Write in a formal tone')..."
                        value={formData.instructor_notes}
                        onChange={(e) => setFormData({ ...formData, instructor_notes: e.target.value })}
                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </section>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                >
                    {loading ? (
                        <>
                            <ArrowPathIcon className="h-6 w-6 animate-spin" />
                            Generating Magic...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="h-6 w-6" />
                            Generate Content
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default AdvancedTextGenerator;
