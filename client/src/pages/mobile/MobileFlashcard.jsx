import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import api from '../../api';
import { X, ChevronLeft, Check, WifiOff } from 'lucide-react';
import { AnimatedVolume, AnimatedTrophy, AnimatedSparkles, RatingFaces } from '../../components/AnimatedIcons';
import confetti from 'canvas-confetti';
import { vocabStorage, useOnlineStatus, syncQueue } from '../../utils/offlineStorage';

function MobileFlashcard({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [flipped, setFlipped] = useState(false);
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const isOnline = useOnlineStatus();

    const searchParams = new URLSearchParams(location.search);
    const useHLR = searchParams.get('hlr') === 'true';

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-12, 12]);
    const correctOpacity = useTransform(x, [0, 100], [0, 1]);
    const incorrectOpacity = useTransform(x, [-100, 0], [1, 0]);

    useEffect(() => {
        fetchWords();
    }, []);

    const fetchWords = async () => {
        setLoading(true);
        try {
            // Try cache first
            const cached = await vocabStorage.getAll();

            if (isOnline) {
                // If online, fetch fresh data
                const endpoint = useHLR ? 'practice/words/' : 'practice/random/';
                const res = await api.get(endpoint, { params: { limit: 20 } });
                setWords(res.data);
                // Also update cache with full vocab
                const vocabRes = await api.get('vocab/');
                await vocabStorage.saveAll(vocabRes.data);
            } else if (cached.length > 0) {
                // If offline, use cached words
                // Sort by next_review date for HLR or shuffle for random
                let practiceWords = [...cached];
                if (useHLR) {
                    practiceWords = practiceWords
                        .filter(w => !w.next_review || new Date(w.next_review) <= new Date())
                        .slice(0, 20);
                } else {
                    practiceWords = practiceWords
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 20);
                }
                setWords(practiceWords);
            }
        } catch (err) {
            console.error('Failed to fetch words:', err);
            // Fall back to cache
            const cached = await vocabStorage.getAll();
            if (cached.length > 0) {
                const practiceWords = cached.sort(() => Math.random() - 0.5).slice(0, 20);
                setWords(practiceWords);
            }
        } finally {
            setLoading(false);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleResponse = async (difficulty) => {
        const currentWord = words[currentIndex];
        const isCorrect = ['good', 'easy'].includes(difficulty);

        if (isCorrect) {
            setScore(s => ({ ...s, correct: s.correct + 1 }));
            confetti({
                particleCount: 60,
                spread: 55,
                origin: { y: 0.65 },
                colors: ['#6366F1', '#8B5CF6', '#22C55E', '#3B82F6']
            });
        }

        // Save practice result (online or queue for offline)
        if (isOnline) {
            try {
                if (useHLR) {
                    await api.post('practice/result/', { word_id: currentWord.id, difficulty });
                } else {
                    await api.post('progress/update/', { vocab_id: currentWord.id, correct: isCorrect });
                }
            } catch (err) {
                console.error('Failed to save result:', err);
                // Queue for later sync
                await syncQueue.addPracticeResult({
                    word_id: currentWord.id,
                    difficulty,
                    correct: isCorrect,
                    useHLR
                });
            }
        } else {
            // Queue for sync when back online
            await syncQueue.addPracticeResult({
                word_id: currentWord.id,
                difficulty,
                correct: isCorrect,
                useHLR
            });
        }

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(i => i + 1);
                setFlipped(false);
                x.set(0);
            } else {
                setScore(s => ({ ...s, total: words.length }));
                setFinished(true);
            }
        }, 300);
    };

    const handleDragEnd = (_, info) => {
        if (info.offset.x > 100) handleResponse('good');
        else if (info.offset.x < -100) handleResponse('again');
        else x.set(0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#09090B' }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#1C1C1F' }}>
                    <AnimatedSparkles size={36} color="#6366F1" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No words to review!</h2>
                <p className="text-zinc-500 text-center mb-8">Add some vocabulary to start practicing.</p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/m/words/add')}
                    className="px-8 py-4 rounded-2xl font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                >
                    Add Words
                </motion.button>
            </div>
        );
    }

    if (finished) {
        const percentage = Math.round((score.correct / words.length) * 100);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#09090B' }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8"
                        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }}
                    >
                        <AnimatedTrophy size={56} color="#FFFFFF" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
                    <p className="text-zinc-500 mb-8">You reviewed {words.length} words</p>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="text-6xl font-black mb-10"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                        {percentage}%
                    </motion.div>

                    <div className="flex gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/m')}
                            className="px-6 py-4 rounded-2xl font-semibold"
                            style={{ backgroundColor: '#1C1C1F', color: '#FAFAFA' }}
                        >
                            Home
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.reload()}
                            className="px-6 py-4 rounded-2xl font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            Practice Again
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentWord = words[currentIndex];
    const progress = ((currentIndex) / words.length) * 100;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 relative z-20">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/m')}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#1C1C1F' }}
                >
                    <ChevronLeft size={22} style={{ color: '#A1A1AA' }} />
                </motion.button>
                <div className="flex-1 mx-4">
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1C1C1F' }}>
                        <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
                        />
                    </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1C1C1F' }}>
                    <span className="text-sm font-bold" style={{ color: '#A1A1AA' }}>
                        {currentIndex + 1}<span style={{ color: '#52525B' }}>/{words.length}</span>
                    </span>
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center px-5 py-4 relative overflow-hidden">
                {/* Swipe Indicators */}
                <motion.div
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', opacity: incorrectOpacity }}
                >
                    <X size={28} style={{ color: '#EF4444' }} />
                </motion.div>
                <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', opacity: correctOpacity }}
                >
                    <Check size={28} style={{ color: '#22C55E' }} />
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        drag={flipped ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        style={{ x, rotate }}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="w-full max-w-sm"
                    >
                        <div
                            className="relative w-full aspect-[3/4] cursor-pointer"
                            style={{ perspective: '1200px' }}
                            onClick={() => setFlipped(!flipped)}
                        >
                            <motion.div
                                className="absolute inset-0"
                                animate={{ rotateY: flipped ? 180 : 0 }}
                                transition={{ duration: 0.5, type: 'spring', stiffness: 80, damping: 15 }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Front */}
                                <div
                                    className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8"
                                    style={{
                                        background: 'linear-gradient(145deg, #18181B 0%, #141416 100%)',
                                        border: '1px solid #27272A',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        backfaceVisibility: 'hidden'
                                    }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #6366F1)' }} />

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }}
                                        className="absolute top-5 right-5 w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: '#27272A' }}
                                    >
                                        <AnimatedVolume size={22} color="#6366F1" />
                                    </motion.button>

                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}>
                                        <span className="text-3xl">🇩🇪</span>
                                    </div>

                                    <h2 className="text-4xl font-bold text-center mb-3" style={{ color: '#FAFAFA' }}>
                                        {currentWord.word}
                                    </h2>
                                    <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: '#27272A', color: '#71717A' }}>
                                        {currentWord.type}
                                    </span>

                                    <motion.p
                                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute bottom-8 text-sm font-medium"
                                        style={{ color: '#52525B' }}
                                    >
                                        Tap to reveal
                                    </motion.p>
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8"
                                    style={{
                                        background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f23 100%)',
                                        border: '1px solid #3F3F46',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)'
                                    }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #22C55E, #6366F1, #22C55E)' }} />

                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                                        style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}
                                    >
                                        <Check size={28} color="#FFFFFF" />
                                    </motion.div>

                                    <h2 className="text-3xl font-bold text-center mb-4" style={{ color: '#FAFAFA' }}>
                                        {currentWord.translation}
                                    </h2>

                                    {currentWord.example && (
                                        <div className="px-5 py-4 rounded-2xl mt-2" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                            <p className="text-sm italic text-center" style={{ color: '#A1A1AA' }}>
                                                "{currentWord.example}"
                                            </p>
                                        </div>
                                    )}

                                    <p className="absolute bottom-8 text-sm font-medium" style={{ color: '#52525B' }}>
                                        Swipe or tap below to rate
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Rating Buttons with Animated Faces */}
            <AnimatePresence>
                {flipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-10 pt-2"
                    >
                        <div className="grid grid-cols-4 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0 }}
                            >
                                <RatingFaces.Sad onClick={() => handleResponse('again')} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <RatingFaces.Worried onClick={() => handleResponse('hard')} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <RatingFaces.Happy onClick={() => handleResponse('good')} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <RatingFaces.Excited onClick={() => handleResponse('easy')} />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MobileFlashcard;
