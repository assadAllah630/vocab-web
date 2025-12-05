import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import confetti from 'canvas-confetti';
import {
    ChevronLeft,
    Sparkles,
    Trophy,
    Check,
    X,
    RotateCcw,
    Loader2,
    AlertCircle,
    Lightbulb,
    ArrowRight
} from 'lucide-react';

function MobileWordBuilder() {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [result, setResult] = useState(null); // correct | wrong | null
    const [gameComplete, setGameComplete] = useState(false);
    const [totalWords, setTotalWords] = useState(10);

    useEffect(() => {
        loadWords();
    }, []);

    const loadWords = async () => {
        setLoading(true);
        try {
            const res = await api.get('vocab/');
            const shuffled = [...res.data]
                .filter(w => w.word && w.word.length >= 3)
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);
            setWords(shuffled);
            setTotalWords(shuffled.length);
        } catch (err) {
            console.error('Failed to load words:', err);
        } finally {
            setLoading(false);
        }
    };

    const createMaskedWord = (word) => {
        if (!word || word.length < 3) return { masked: word, blanks: [] };

        const chars = word.split('');
        const numBlanks = Math.max(1, Math.floor(word.length / 3));
        const blankPositions = [];

        // Randomly select positions to blank out (not first or last)
        const middlePositions = chars
            .map((_, i) => i)
            .filter(i => i > 0 && i < chars.length - 1);

        while (blankPositions.length < numBlanks && middlePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * middlePositions.length);
            blankPositions.push(middlePositions.splice(randomIndex, 1)[0]);
        }

        blankPositions.sort((a, b) => a - b);

        const masked = chars.map((c, i) =>
            blankPositions.includes(i) ? '_' : c
        ).join('');

        return {
            masked,
            blanks: blankPositions.map(pos => ({ position: pos, letter: chars[pos] }))
        };
    };

    const currentWord = words[currentIndex];
    const { masked, blanks } = currentWord ? createMaskedWord(currentWord.word) : { masked: '', blanks: [] };

    const handleKeyPress = (letter) => {
        if (result !== null) return;
        if (guess.length < blanks.length) {
            setGuess(prev => prev + letter);
        }
    };

    const handleBackspace = () => {
        if (result !== null) return;
        setGuess(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (guess.length !== blanks.length) return;

        const isCorrect = guess.toLowerCase() === blanks.map(b => b.letter).join('').toLowerCase();
        setResult(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            const hintPenalty = hintsUsed * 2;
            setScore(prev => prev + Math.max(5, 10 - hintPenalty));
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 >= words.length) {
            setGameComplete(true);
            if (score >= 50) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#22C55E', '#14B8A6', '#6366F1']
                });
            }
        } else {
            setCurrentIndex(prev => prev + 1);
            setGuess('');
            setResult(null);
            setShowHint(false);
            setHintsUsed(0);
        }
    };

    const handleHint = () => {
        setShowHint(true);
        setHintsUsed(prev => prev + 1);
    };

    const restartGame = () => {
        setCurrentIndex(0);
        setGuess('');
        setScore(0);
        setStreak(0);
        setResult(null);
        setShowHint(false);
        setHintsUsed(0);
        setGameComplete(false);
        loadWords();
    };

    const keyboard = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
        ['ä', 'ö', 'ü', 'ß']
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
                <Loader2 size={40} color="#22C55E" className="animate-spin" />
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#09090B' }}>
                <AlertCircle size={48} color="#EF4444" className="mb-4" />
                <h2 className="text-xl font-bold mb-2" style={{ color: '#FAFAFA' }}>No Words Found</h2>
                <p className="text-sm text-center mb-6" style={{ color: '#71717A' }}>
                    Add some vocabulary words first to play this game.
                </p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/m/games')}
                    className="px-6 py-3 rounded-xl font-semibold"
                    style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
                >
                    Go Back
                </motion.button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/games')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>

                    <div className="flex items-center gap-2">
                        <Sparkles size={20} color="#22C55E" />
                        <span className="font-bold" style={{ color: '#FAFAFA' }}>Word Builder</span>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={restartGame}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <RotateCcw size={18} color="#A1A1AA" />
                    </motion.button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col px-4">
                <AnimatePresence mode="wait">
                    {gameComplete ? (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center"
                        >
                            <div
                                className="w-full max-w-sm p-8 rounded-3xl text-center"
                                style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                            >
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                    style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}
                                >
                                    <Trophy size={40} color="#FFFFFF" />
                                </div>

                                <h2 className="text-2xl font-black mb-2" style={{ color: '#FAFAFA' }}>
                                    Complete!
                                </h2>
                                <p className="text-sm mb-6" style={{ color: '#71717A' }}>
                                    You finished all {totalWords} words
                                </p>

                                <div
                                    className="p-4 rounded-xl mb-6"
                                    style={{ backgroundColor: '#1C1C1F' }}
                                >
                                    <p className="text-xs mb-1" style={{ color: '#71717A' }}>Final Score</p>
                                    <p className="text-3xl font-black" style={{ color: '#22C55E' }}>{score}</p>
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/m/games')}
                                        className="flex-1 py-3 rounded-xl font-semibold"
                                        style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
                                    >
                                        Exit
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={restartGame}
                                        className="flex-1 py-3 rounded-xl font-semibold text-white"
                                        style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}
                                    >
                                        Play Again
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col"
                        >
                            {/* Progress & Stats */}
                            <div
                                className="flex items-center justify-between p-3 rounded-xl mb-4"
                                style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold" style={{ color: '#FAFAFA' }}>
                                        {currentIndex + 1}/{totalWords}
                                    </span>
                                    <div
                                        className="h-2 w-20 rounded-full overflow-hidden"
                                        style={{ backgroundColor: '#27272A' }}
                                    >
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${((currentIndex + 1) / totalWords) * 100}%`,
                                                background: 'linear-gradient(90deg, #22C55E, #14B8A6)'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-xs" style={{ color: '#71717A' }}>Score</p>
                                        <p className="font-bold" style={{ color: '#22C55E' }}>{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs" style={{ color: '#71717A' }}>Streak</p>
                                        <p className="font-bold" style={{ color: '#F59E0B' }}>🔥 {streak}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Translation Hint */}
                            <div
                                className="p-4 rounded-xl mb-4 text-center"
                                style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                            >
                                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#71717A' }}>
                                    Translation
                                </p>
                                <p className="text-lg font-semibold" style={{ color: '#FAFAFA' }}>
                                    {currentWord?.translation}
                                </p>
                            </div>

                            {/* Word Display */}
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 rounded-2xl text-center mb-4 transition-colors`}
                                style={{
                                    backgroundColor: result === 'correct' ? 'rgba(34, 197, 94, 0.2)' :
                                        result === 'wrong' ? 'rgba(239, 68, 68, 0.2)' : '#141416',
                                    border: `2px solid ${result === 'correct' ? '#22C55E' :
                                            result === 'wrong' ? '#EF4444' : '#27272A'
                                        }`
                                }}
                            >
                                <div className="flex justify-center gap-2 flex-wrap mb-4">
                                    {masked.split('').map((char, idx) => {
                                        const blankIdx = blanks.findIndex(b => b.position === idx);
                                        const isBlank = char === '_';
                                        const userLetter = isBlank && blankIdx !== -1 ? guess[blankIdx] : null;

                                        return (
                                            <div
                                                key={idx}
                                                className={`w-10 h-12 rounded-lg flex items-center justify-center text-xl font-black ${isBlank ? 'border-2 border-dashed' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: isBlank ? '#1C1C1F' : 'transparent',
                                                    borderColor: isBlank ? '#6366F1' : 'transparent',
                                                    color: '#FAFAFA'
                                                }}
                                            >
                                                {isBlank ? (userLetter || '') : char}
                                            </div>
                                        );
                                    })}
                                </div>

                                {result === 'wrong' && (
                                    <p className="text-sm" style={{ color: '#EF4444' }}>
                                        Correct: {blanks.map(b => b.letter).join('')}
                                    </p>
                                )}

                                {showHint && !result && (
                                    <p className="text-sm" style={{ color: '#F59E0B' }}>
                                        First letter: {blanks[0]?.letter}
                                    </p>
                                )}
                            </motion.div>

                            {/* Hint Button */}
                            {!result && !showHint && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleHint}
                                    className="flex items-center justify-center gap-2 py-2 rounded-xl mb-4"
                                    style={{ backgroundColor: '#1C1C1F', color: '#F59E0B' }}
                                >
                                    <Lightbulb size={16} />
                                    <span className="text-sm font-medium">Show Hint (-2 pts)</span>
                                </motion.button>
                            )}

                            {/* Result Actions */}
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4"
                                >
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleNext}
                                        className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                                        style={{
                                            background: result === 'correct'
                                                ? 'linear-gradient(135deg, #22C55E, #14B8A6)'
                                                : 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                                        }}
                                    >
                                        {result === 'correct' ? <Check size={20} /> : <ArrowRight size={20} />}
                                        {currentIndex + 1 >= words.length ? 'Finish' : 'Next Word'}
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            {!result && guess.length === blanks.length && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSubmit}
                                    className="w-full py-4 rounded-xl font-semibold text-white mb-4"
                                    style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}
                                >
                                    Check Answer
                                </motion.button>
                            )}

                            {/* Keyboard */}
                            {!result && (
                                <div className="mt-auto pb-4">
                                    {keyboard.map((row, rowIdx) => (
                                        <div key={rowIdx} className="flex justify-center gap-1 mb-1">
                                            {row.map(letter => (
                                                <motion.button
                                                    key={letter}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleKeyPress(letter)}
                                                    className="w-8 h-10 rounded-lg font-semibold text-sm"
                                                    style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
                                                >
                                                    {letter}
                                                </motion.button>
                                            ))}
                                            {rowIdx === 2 && (
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={handleBackspace}
                                                    className="w-12 h-10 rounded-lg font-semibold text-sm flex items-center justify-center"
                                                    style={{ backgroundColor: '#3F3F46', color: '#FAFAFA' }}
                                                >
                                                    <X size={16} />
                                                </motion.button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default MobileWordBuilder;
