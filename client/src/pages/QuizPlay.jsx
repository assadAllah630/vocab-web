import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SpeakerWaveIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    TrophyIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';
import HLRStatsCard from '../components/HLRStatsCard';

function QuizPlay({ user }) {
    const { mode } = useParams(); // 'flashcard', 'translation', 'writing', 'listening'
    const navigate = useNavigate();
    const location = useLocation();
    const [vocabList, setVocabList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAnswer, setShowAnswer] = useState(false);
    const [inputAnswer, setInputAnswer] = useState('');
    const [finished, setFinished] = useState(false);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'

    // Check if HLR is enabled from query params
    const searchParams = new URLSearchParams(location.search);
    const useHLR = searchParams.get('hlr') === 'true';

    // Language names
    const nativeLang = user?.native_language === 'ar' ? 'Arabic' :
        user?.native_language === 'ru' ? 'Russian' :
            user?.native_language === 'de' ? 'German' : 'English';

    const targetLang = user?.target_language === 'ar' ? 'Arabic' :
        user?.target_language === 'ru' ? 'Russian' :
            user?.target_language === 'en' ? 'English' : 'German';

    useEffect(() => {
        fetchVocab();
    }, []);

    const fetchVocab = async () => {
        try {
            if (useHLR) {
                // Use HLR endpoint to get prioritized words
                const res = await api.get('practice/words/', { params: { limit: 20 } });
                setVocabList(res.data);
            } else {
                // Use new random endpoint (Request #1)
                const res = await api.get('practice/random/');
                setVocabList(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vocabList.length > 0 && !finished) {
            if (mode === 'translation') {
                generateOptions();
            } else if (mode === 'listening' && !showAnswer) {
                speak(vocabList[currentIndex].word);
            }
        }
    }, [currentIndex, vocabList, mode, showAnswer, finished]);

    const generateOptions = () => {
        const current = vocabList[currentIndex];
        const others = vocabList.filter(w => w.id !== current.id);
        const shuffledOthers = others.sort(() => 0.5 - Math.random());
        const wrong = shuffledOthers.slice(0, 3);
        const all = [current, ...wrong].sort(() => 0.5 - Math.random());
        setOptions(all);
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel previous
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleNext = async (correct) => {
        const currentWord = vocabList[currentIndex];

        if (correct) {
            setScore(s => s + 1);
            setFeedback('correct');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            setFeedback('incorrect');
        }

        try {
            if (useHLR) {
                // Use HLR endpoint to record result with difficulty parameter
                await api.post('practice/result/', {
                    word_id: currentWord.id,
                    difficulty: correct  // Send difficulty ('again'/'hard'/'good'/'easy' or boolean)
                });
            } else {
                // Use standard progress endpoint
                // Convert difficulty to boolean for SM2
                const wasCorrect = typeof correct === 'boolean' ? correct : ['good', 'easy'].includes(correct);
                await api.post('progress/update/', {
                    vocab_id: currentWord.id,
                    correct: wasCorrect
                });
            }
        } catch (err) {
            console.error('Failed to update progress', err);
        }

        // Delay to show feedback
        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < vocabList.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setShowAnswer(false);
                setInputAnswer('');
            } else {
                setFinished(true);
            }
        }, 1500);
    };

    const checkInput = () => {
        const currentWord = vocabList[currentIndex];
        const isCorrect = inputAnswer.trim().toLowerCase() === currentWord.word.toLowerCase() ||
            inputAnswer.trim().toLowerCase() === currentWord.translation.toLowerCase();

        if (isCorrect) {
            handleNext(true);
        } else {
            setFeedback('incorrect');
            // Shake animation logic handled by framer-motion key
            setTimeout(() => setFeedback(null), 500); // Reset shake
            setShowAnswer(true);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
        </div>
    );

    if (vocabList.length === 0) return (
        <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No words found!</h3>
            <p className="text-slate-600 mb-8">Add some vocabulary to start playing.</p>
            <button onClick={() => navigate('/vocab/add')} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
                Add Words
            </button>
        </div>
    );

    if (finished) return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrophyIcon className="w-12 h-12 text-yellow-600" />
                </div>

                <h2 className="text-4xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
                <p className="text-slate-600 mb-8 text-lg">You're making great progress.</p>

                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
                    {Math.round((score / vocabList.length) * 100)}%
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                    >
                        Play Again
                    </button>
                </div>
            </motion.div>
        </div>
    );

    const currentWord = vocabList[currentIndex];
    const progress = ((currentIndex) / vocabList.length) * 100;

    const getMaskedExample = (word, example) => {
        if (!example) return null;
        // Create a regex to replace the word (case insensitive)
        // We use word boundary \b to avoid replacing substrings, but need to be careful with German compounds
        // For simplicity, we'll try to match the word string
        const regex = new RegExp(word, 'gi');
        return example.replace(regex, '_______');
    };

    const maskedExample = mode === 'context' ? getMaskedExample(currentWord.word, currentWord.example) : null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    <span>{mode} Mode</span>
                    <span>{currentIndex + 1} / {vocabList.length}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col justify-center relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {mode === 'flashcard' ? (
                            <div className="perspective-1000 w-full h-[500px] cursor-pointer group" onClick={() => setShowAnswer(!showAnswer)}>
                                <motion.div
                                    className="relative w-full h-full transition-all duration-500 transform-style-3d"
                                    animate={{ rotateY: showAnswer ? 180 : 0 }}
                                >
                                    {/* Front */}
                                    <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center justify-center p-8 text-center hover:shadow-2xl transition-shadow">
                                        {/* HLR Stats - Top Right */}
                                        {useHLR && currentWord.hlr_stats && (
                                            <div className="absolute top-4 right-4 max-w-xs">
                                                <HLRStatsCard hlrStats={currentWord.hlr_stats} showDetails={true} />
                                            </div>
                                        )}

                                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
                                            <span className="text-3xl">🇩🇪</span>
                                        </div>
                                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">{currentWord.word}</h2>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-8">Tap to Flip</p>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 rounded-3xl shadow-xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center">
                                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">{currentWord.translation}</h2>
                                        {currentWord.example && (
                                            <p className="text-slate-400 italic text-xl mb-8">"{currentWord.example}"</p>
                                        )}
                                        <div className="flex gap-2 mt-auto w-full px-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleNext('again')}
                                                className="flex-1 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-colors text-sm"
                                            >
                                                Again
                                            </button>
                                            <button
                                                onClick={() => handleNext('hard')}
                                                className="flex-1 py-3 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl font-bold hover:bg-orange-500/20 transition-colors text-sm"
                                            >
                                                Hard
                                            </button>
                                            <button
                                                onClick={() => handleNext('good')}
                                                className="flex-1 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold hover:bg-blue-500/20 transition-colors text-sm"
                                            >
                                                Good
                                            </button>
                                            <button
                                                onClick={() => handleNext('easy')}
                                                className="flex-1 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl font-bold hover:bg-green-500/20 transition-colors text-sm"
                                            >
                                                Easy
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col relative">
                                {/* HLR Stats - Top Right */}
                                {useHLR && currentWord.hlr_stats && (
                                    <div className="absolute top-4 right-4 max-w-xs z-10">
                                        <HLRStatsCard hlrStats={currentWord.hlr_stats} showDetails={true} />
                                    </div>
                                )}

                                {/* Feedback Overlay */}
                                <AnimatePresence>
                                    {feedback && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${feedback === 'correct' ? 'bg-green-500/10' : 'bg-red-500/10'
                                                }`}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.5 }}
                                                animate={{ scale: 1 }}
                                                className={`p-8 rounded-3xl shadow-2xl flex flex-col items-center ${feedback === 'correct' ? 'bg-white text-green-600' : 'bg-white text-red-600'
                                                    }`}
                                            >
                                                {feedback === 'correct' ? (
                                                    <CheckCircleIcon className="w-20 h-20 mb-4" />
                                                ) : (
                                                    <XCircleIcon className="w-20 h-20 mb-4" />
                                                )}
                                                <span className="text-2xl font-black uppercase tracking-widest">
                                                    {feedback === 'correct' ? 'Excellent!' : 'Try Again'}
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center">
                                    {mode === 'listening' && !showAnswer ? (
                                        <button
                                            onClick={() => speak(currentWord.word)}
                                            className="w-32 h-32 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"
                                        >
                                            <SpeakerWaveIcon className="w-16 h-16" />
                                        </button>
                                    ) : (
                                        <div className="mb-8">
                                            {mode === 'context' && maskedExample ? (
                                                <div className="space-y-4">
                                                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 leading-relaxed">
                                                        {maskedExample}
                                                    </h2>
                                                    <p className="text-slate-500 font-medium">Fill in the blank ({currentWord.translation})</p>
                                                </div>
                                            ) : (
                                                <h2 className="text-5xl md:text-6xl font-black text-slate-900">
                                                    {mode === 'translation' ? currentWord.word : (showAnswer ? currentWord.word : (mode === 'writing' || mode === 'context' ? currentWord.translation : currentWord.word))}
                                                </h2>
                                            )}
                                        </div>
                                    )}

                                    {(showAnswer || mode === 'translation') && (
                                        <div className="w-full mt-8">
                                            {mode === 'translation' ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                    {options.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleNext(opt.id === currentWord.id)}
                                                            className="p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all text-xl font-bold text-slate-700 text-left flex items-center justify-between group"
                                                        >
                                                            {opt.translation}
                                                            <ArrowRightIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-slate-50 rounded-2xl p-8 border border-slate-100"
                                                >
                                                    <p className="text-3xl text-indigo-600 font-bold mb-2">
                                                        {currentWord.translation}
                                                    </p>
                                                    {currentWord.example && (
                                                        <p className="text-slate-500 italic text-lg">"{currentWord.example}"</p>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {mode !== 'translation' && (
                                    <div className="bg-slate-50 p-6 border-t border-slate-100">
                                        {(mode === 'writing' || mode === 'listening' || mode === 'context') && !showAnswer && (
                                            <div className="mb-6 max-w-md mx-auto flex gap-3">
                                                <input
                                                    type="text"
                                                    className="block w-full rounded-xl border-slate-200 py-4 text-lg text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                                                    placeholder={mode === 'listening' ? `Type what you hear...` : `Type the word...`}
                                                    value={inputAnswer}
                                                    onChange={(e) => setInputAnswer(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && checkInput()}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={checkInput}
                                                    className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                                >
                                                    Check
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex justify-center">
                                            {!showAnswer ? (
                                                mode !== 'writing' && mode !== 'listening' && mode !== 'context' && (
                                                    <button
                                                        onClick={() => setShowAnswer(true)}
                                                        className="w-full sm:w-auto rounded-xl bg-indigo-600 px-12 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all"
                                                    >
                                                        Show Answer
                                                    </button>
                                                )
                                            ) : (
                                                <div className="grid grid-cols-4 gap-2 w-full sm:max-w-2xl">
                                                    <button
                                                        onClick={() => handleNext('again')}
                                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
                                                    >
                                                        <span className="font-bold text-lg">Again</span>
                                                        <span className="text-xs opacity-75">Fail</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleNext('hard')}
                                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-50 text-orange-600 border-2 border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all"
                                                    >
                                                        <span className="font-bold text-lg">Hard</span>
                                                        <span className="text-xs opacity-75">Struggle</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleNext('good')}
                                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 text-blue-600 border-2 border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all"
                                                    >
                                                        <span className="font-bold text-lg">Good</span>
                                                        <span className="text-xs opacity-75">Normal</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleNext('easy')}
                                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-50 text-green-600 border-2 border-green-100 hover:bg-green-100 hover:border-green-200 transition-all"
                                                    >
                                                        <span className="font-bold text-lg">Easy</span>
                                                        <span className="text-xs opacity-75">Perfect</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default QuizPlay;
