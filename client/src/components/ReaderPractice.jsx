import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    SpeakerWaveIcon,
    PencilSquareIcon,
    SwatchIcon
} from '@heroicons/react/24/outline';

function ReaderPractice({ words, onBack }) {
    const [loading, setLoading] = useState(true);
    const [vocabData, setVocabData] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState('flashcards'); // 'flashcards' or 'writing'
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct' or 'incorrect'
    const [savedWords, setSavedWords] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                alert('Please set your Gemini API Key in settings');
                onBack();
                return;
            }

            const res = await api.post('ai/bulk-translate/', {
                api_key: apiKey,
                words: words
            });
            setVocabData(res.data);
        } catch (err) {
            console.error('Translation failed', err);
            alert('Failed to load translations');
            onBack();
        } finally {
            setLoading(false);
        }
    };

    const currentWord = words[currentIndex];
    const currentData = vocabData[currentWord];

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer('');
            setFeedback(null);
        } else {
            alert('Practice complete!');
            onBack();
        }
    };

    const checkAnswer = () => {
        if (!userAnswer.trim()) return;

        const correct = currentData.translation.toLowerCase();
        const user = userAnswer.toLowerCase().trim();

        // Simple fuzzy match or exact match
        if (user === correct || correct.includes(user)) {
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }
        setShowAnswer(true);
    };

    const handleSaveWord = async () => {
        if (savedWords.includes(currentWord)) return;
        setSaving(true);
        try {
            const payload = {
                word: currentWord,
                translation: currentData.translation,
                type: (currentData.type || 'other').toLowerCase(),
                example: currentData.example || '',
                synonyms: currentData.synonyms || [],
                antonyms: currentData.antonyms || [],
                related_concepts: currentData.related_concepts || [],
                is_public: false
            };
            await api.post('vocab/', payload);
            setSavedWords([...savedWords, currentWord]);
        } catch (err) {
            console.error('Failed to save word', err);
            alert('Failed to save word');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <ArrowPathIcon className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Translating words...</p>
            </div>
        );
    }

    if (!currentData) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <p className="text-red-500">Error loading word data.</p>
                <button onClick={onBack} className="mt-4 text-primary-600 font-bold">Go Back</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <button
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-slate-700 font-bold transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Text
                </button>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('flashcards')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'flashcards' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <SwatchIcon className="w-4 h-4 inline mr-1" />
                        Flashcards
                    </button>
                    <button
                        onClick={() => setMode('writing')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'writing' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <PencilSquareIcon className="w-4 h-4 inline mr-1" />
                        Writing
                    </button>
                </div>

                <div className="text-sm font-bold text-slate-400">
                    {currentIndex + 1} / {words.length}
                </div>
            </div>

            {/* Practice Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                <div className="max-w-xl w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex + mode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
                        >
                            <div className="p-10 text-center">
                                <h2 className="text-4xl font-extrabold text-slate-900 mb-2">
                                    {currentWord}
                                </h2>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-8">
                                    {currentData.type}
                                </p>

                                {mode === 'flashcards' ? (
                                    <div className="min-h-[120px] flex items-center justify-center">
                                        {showAnswer ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <p className="text-2xl font-bold text-primary-600 mb-2">
                                                    {currentData.translation}
                                                </p>
                                                <p className="text-slate-500 italic">
                                                    "{currentData.example}"
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <button
                                                onClick={() => setShowAnswer(true)}
                                                className="px-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                                            >
                                                Show Answer
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <input
                                            type="text"
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !showAnswer && checkAnswer()}
                                            disabled={showAnswer}
                                            placeholder="Type translation..."
                                            className={`w-full text-center text-xl p-4 border-b-2 outline-none transition-colors ${feedback === 'correct' ? 'border-green-500 text-green-700 bg-green-50/30' :
                                                feedback === 'incorrect' ? 'border-red-500 text-red-700 bg-red-50/30' :
                                                    'border-slate-200 focus:border-primary-500'
                                                }`}
                                        />

                                        {!showAnswer ? (
                                            <button
                                                onClick={checkAnswer}
                                                className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                                            >
                                                Check
                                            </button>
                                        ) : (
                                            <div className="text-center">
                                                {feedback === 'incorrect' && (
                                                    <div className="mb-4">
                                                        <p className="text-sm text-slate-400 font-bold uppercase mb-1">Correct Answer</p>
                                                        <p className="text-xl font-bold text-slate-900">{currentData.translation}</p>
                                                    </div>
                                                )}
                                                <p className="text-slate-500 italic">"{currentData.example}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    onClick={handleSaveWord}
                                    disabled={savedWords.includes(currentWord) || saving}
                                    className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-colors ${savedWords.includes(currentWord)
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                                        }`}
                                >
                                    {savedWords.includes(currentWord) ? (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon className="w-5 h-5 mr-2" />
                                            {saving ? 'Saving...' : 'Save to Vocabulary'}
                                        </>
                                    )}
                                </button>

                                {showAnswer && (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                                    >
                                        Next Word
                                        <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function PlusIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

export default ReaderPractice;
