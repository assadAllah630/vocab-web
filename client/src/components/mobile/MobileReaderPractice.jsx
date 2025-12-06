import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import {
    ChevronLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Volume2,
    Plus,
    ArrowRight,
    BookOpen,
    Pencil
} from 'lucide-react';

function MobileReaderPractice({ words, onBack, onComplete }) {
    const [loading, setLoading] = useState(true);
    const [vocabData, setVocabData] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState('flashcards'); // 'flashcards' or 'writing'
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [savedWords, setSavedWords] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            // Try to get API key from localStorage or user profile
            let apiKey = localStorage.getItem('gemini_api_key');

            const res = await api.post('ai/bulk-translate/', {
                api_key: apiKey,
                words: words
            });
            setVocabData(res.data);
        } catch (err) {
            console.error('Translation failed', err);
            setError('Failed to load translations. Please check your API key in settings.');
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
            // Practice complete
            onComplete?.(savedWords);
        }
    };

    const checkAnswer = () => {
        if (!userAnswer.trim()) return;

        const correct = currentData.translation.toLowerCase();
        const user = userAnswer.toLowerCase().trim();

        if (user === correct || correct.includes(user) || user.includes(correct.split(',')[0].trim())) {
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
        } finally {
            setSaving(false);
        }
    };

    const speakWord = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentWord);
            speechSynthesis.speak(utterance);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: '#09090B' }}>
                <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-[#A1A1AA] font-medium">Getting translations...</p>
                <p className="text-xs text-[#52525B] mt-2">Using AI to autofill vocabulary data</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#09090B' }}>
                <XCircle size={48} className="text-red-400 mb-4" />
                <p className="text-[#FAFAFA] font-bold text-center mb-2">Translation Error</p>
                <p className="text-[#71717A] text-sm text-center mb-6">{error}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-[#27272A] text-[#FAFAFA] font-bold rounded-xl"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!currentData) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#09090B' }}>
                <XCircle size={48} className="text-red-400 mb-4" />
                <p className="text-[#FAFAFA] font-bold">Error loading word data</p>
                <button onClick={onBack} className="mt-4 text-indigo-400 font-bold">Go Back</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#18181B]"
                >
                    <ChevronLeft size={18} color="#A1A1AA" />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#FAFAFA]">{currentIndex + 1}</span>
                    <span className="text-xs text-[#52525B]">of {words.length}</span>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-[#18181B] p-1 rounded-lg">
                    <button
                        onClick={() => { setMode('flashcards'); setShowAnswer(false); setFeedback(null); }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === 'flashcards' ? 'bg-[#27272A] text-[#FAFAFA]' : 'text-[#71717A]'
                            }`}
                    >
                        <BookOpen size={14} className="inline mr-1" />
                        Cards
                    </button>
                    <button
                        onClick={() => { setMode('writing'); setShowAnswer(false); setFeedback(null); setUserAnswer(''); }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === 'writing' ? 'bg-[#27272A] text-[#FAFAFA]' : 'text-[#71717A]'
                            }`}
                    >
                        <Pencil size={14} className="inline mr-1" />
                        Write
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-[#27272A]">
                <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                />
            </div>

            {/* Practice Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex + mode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md"
                    >
                        {/* Word Card */}
                        <div className="bg-[#18181B] rounded-3xl border border-[#27272A] overflow-hidden">
                            <div className="p-8 text-center">
                                {/* Word */}
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <h2 className="text-3xl font-black text-[#FAFAFA]">
                                        {currentWord}
                                    </h2>
                                    <button
                                        onClick={speakWord}
                                        className="w-8 h-8 rounded-full bg-[#27272A] flex items-center justify-center"
                                    >
                                        <Volume2 size={16} className="text-[#A1A1AA]" />
                                    </button>
                                </div>
                                <p className="text-[#52525B] text-xs font-medium uppercase tracking-wider mb-8">
                                    {currentData.type}
                                </p>

                                {mode === 'flashcards' ? (
                                    <div className="min-h-[100px] flex items-center justify-center">
                                        {showAnswer ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <p className="text-xl font-bold text-emerald-400 mb-3">
                                                    {currentData.translation}
                                                </p>
                                                {currentData.example && (
                                                    <p className="text-[#71717A] text-sm italic">
                                                        "{currentData.example}"
                                                    </p>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <button
                                                onClick={() => setShowAnswer(true)}
                                                className="px-6 py-3 bg-[#27272A] text-[#A1A1AA] font-bold rounded-xl"
                                            >
                                                Show Translation
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !showAnswer && checkAnswer()}
                                            disabled={showAnswer}
                                            placeholder="Type translation..."
                                            className={`w-full text-center text-lg p-4 rounded-xl border-2 outline-none transition-colors bg-transparent ${feedback === 'correct' ? 'border-emerald-500 text-emerald-400' :
                                                    feedback === 'incorrect' ? 'border-red-500 text-red-400' :
                                                        'border-[#27272A] focus:border-indigo-500 text-[#FAFAFA]'
                                                }`}
                                        />

                                        {!showAnswer ? (
                                            <button
                                                onClick={checkAnswer}
                                                disabled={!userAnswer.trim()}
                                                className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-40"
                                            >
                                                Check
                                            </button>
                                        ) : (
                                            <div className="text-center">
                                                {feedback === 'incorrect' && (
                                                    <div className="mb-3">
                                                        <p className="text-xs text-[#52525B] mb-1">Correct Answer</p>
                                                        <p className="text-lg font-bold text-emerald-400">{currentData.translation}</p>
                                                    </div>
                                                )}
                                                {feedback === 'correct' && (
                                                    <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                                                        <CheckCircle2 size={20} />
                                                        <span className="font-bold">Correct!</span>
                                                    </div>
                                                )}
                                                {currentData.example && (
                                                    <p className="text-[#71717A] text-sm italic">"{currentData.example}"</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            {showAnswer && (
                                <div className="bg-[#0D0D0F] p-4 border-t border-[#27272A] flex items-center gap-3">
                                    <button
                                        onClick={handleSaveWord}
                                        disabled={savedWords.includes(currentWord) || saving}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${savedWords.includes(currentWord)
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-[#27272A] text-[#A1A1AA]'
                                            }`}
                                    >
                                        {savedWords.includes(currentWord) ? (
                                            <>
                                                <CheckCircle2 size={16} />
                                                Saved
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                {saving ? 'Saving...' : 'Save'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        {currentIndex < words.length - 1 ? 'Next' : 'Finish'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Saved Count */}
                        {savedWords.length > 0 && (
                            <p className="text-center text-xs text-[#52525B] mt-4">
                                {savedWords.length} word{savedWords.length > 1 ? 's' : ''} saved to vocabulary
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default MobileReaderPractice;
