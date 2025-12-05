import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import confetti from 'canvas-confetti';
import {
    ChevronLeft,
    RotateCcw,
    Trophy,
    Sparkles,
    Puzzle,
    Star,
    Loader2
} from 'lucide-react';

function MobileMemoryMatch() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [disabled, setDisabled] = useState(false);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(0);
    const [loading, setLoading] = useState(true);
    const [gameComplete, setGameComplete] = useState(false);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = async () => {
        setLoading(true);
        setGameComplete(false);
        try {
            const res = await api.get('games/matching/');
            const words = res.data;
            const gameCards = [];

            words.forEach(word => {
                gameCards.push({
                    id: word.id,
                    content: word.word,
                    type: 'word',
                    uniqueId: `${word.id}-word`
                });
                gameCards.push({
                    id: word.id,
                    content: word.translation,
                    type: 'translation',
                    uniqueId: `${word.id}-trans`
                });
            });

            setCards(shuffle(gameCards));
            setFlipped([]);
            setSolved([]);
            setScore(0);
            setMoves(0);
        } catch (err) {
            console.error('Failed to load game:', err);
        } finally {
            setLoading(false);
        }
    };

    const shuffle = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleClick = (uniqueId) => {
        if (disabled || solved.includes(uniqueId) || flipped.includes(uniqueId)) return;

        if (flipped.length === 0) {
            setFlipped([uniqueId]);
            return;
        }

        setFlipped([flipped[0], uniqueId]);
        setDisabled(true);
        setMoves(m => m + 1);
        checkForMatch(uniqueId);
    };

    const checkForMatch = (secondId) => {
        const firstCard = cards.find(card => card.uniqueId === flipped[0]);
        const secondCard = cards.find(card => card.uniqueId === secondId);

        if (firstCard.id === secondCard.id) {
            const newSolved = [...solved, flipped[0], secondId];
            setSolved(newSolved);
            setFlipped([]);
            setDisabled(false);
            setScore(prev => prev + 10);

            // Check for win
            if (newSolved.length === cards.length) {
                setGameComplete(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#6366F1', '#8B5CF6', '#22C55E']
                });
            }
        } else {
            setTimeout(() => {
                setFlipped([]);
                setDisabled(false);
            }, 800);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090B' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 size={40} color="#6366F1" />
                </motion.div>
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
                        <Puzzle size={20} color="#8B5CF6" />
                        <span className="font-bold" style={{ color: '#FAFAFA' }}>Memory Match</span>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={initializeGame}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <RotateCcw size={18} color="#A1A1AA" />
                    </motion.button>
                </div>

                {/* Score Bar */}
                <div
                    className="flex items-center justify-center gap-6 py-3 rounded-xl"
                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                >
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase" style={{ color: '#6366F1' }}>Score</p>
                        <p className="text-2xl font-black" style={{ color: '#FAFAFA' }}>{score}</p>
                    </div>
                    <div className="w-px h-10" style={{ backgroundColor: '#27272A' }} />
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase" style={{ color: '#71717A' }}>Moves</p>
                        <p className="text-2xl font-black" style={{ color: '#A1A1AA' }}>{moves}</p>
                    </div>
                    <div className="w-px h-10" style={{ backgroundColor: '#27272A' }} />
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase" style={{ color: '#71717A' }}>Pairs</p>
                        <p className="text-2xl font-black" style={{ color: '#A1A1AA' }}>
                            {solved.length / 2}/{cards.length / 2}
                        </p>
                    </div>
                </div>
            </div>

            {/* Game Board / Victory Screen */}
            <div className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {gameComplete ? (
                        <motion.div
                            key="victory"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="text-center p-8 rounded-3xl"
                            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                        >
                            <motion.div
                                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: 2 }}
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                            >
                                <Trophy size={40} color="#FFFFFF" />
                            </motion.div>

                            <h2 className="text-2xl font-black mb-2" style={{ color: '#FAFAFA' }}>
                                Victory!
                            </h2>
                            <p className="text-sm mb-6" style={{ color: '#71717A' }}>
                                Completed in <span style={{ color: '#FAFAFA', fontWeight: 'bold' }}>{moves}</span> moves
                            </p>

                            <div className="flex items-center justify-center gap-1 mb-6">
                                {[1, 2, 3].map(i => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                    >
                                        <Star
                                            size={28}
                                            color="#F59E0B"
                                            fill={i <= (moves <= 8 ? 3 : moves <= 12 ? 2 : 1) ? '#F59E0B' : 'transparent'}
                                        />
                                    </motion.div>
                                ))}
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
                                    onClick={initializeGame}
                                    className="flex-1 py-3 rounded-xl font-semibold text-white"
                                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                                >
                                    Play Again
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="board"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-4 gap-2 w-full max-w-sm"
                        >
                            {cards.map((card, index) => {
                                const isFlipped = flipped.includes(card.uniqueId);
                                const isSolved = solved.includes(card.uniqueId);

                                return (
                                    <motion.div
                                        key={card.uniqueId}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => handleClick(card.uniqueId)}
                                        className="aspect-square cursor-pointer"
                                        style={{ perspective: '1000px' }}
                                    >
                                        <motion.div
                                            className="w-full h-full relative"
                                            initial={false}
                                            animate={{ rotateY: isFlipped || isSolved ? 180 : 0 }}
                                            transition={{ duration: 0.4 }}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            {/* Card Back (Hidden) */}
                                            <div
                                                className="absolute inset-0 rounded-xl flex items-center justify-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                    backfaceVisibility: 'hidden'
                                                }}
                                            >
                                                <Sparkles size={20} color="rgba(255,255,255,0.3)" />
                                            </div>

                                            {/* Card Front (Revealed) */}
                                            <div
                                                className="absolute inset-0 rounded-xl flex items-center justify-center p-2"
                                                style={{
                                                    backgroundColor: isSolved ? '#22C55E' : '#1C1C1F',
                                                    border: `2px solid ${isSolved ? '#22C55E' : '#27272A'}`,
                                                    backfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)'
                                                }}
                                            >
                                                <span
                                                    className="text-xs font-bold text-center leading-tight break-all"
                                                    style={{ color: isSolved ? '#FFFFFF' : '#FAFAFA' }}
                                                >
                                                    {card.content}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Instructions */}
            {!gameComplete && (
                <div className="px-4 pb-6">
                    <p className="text-center text-xs" style={{ color: '#52525B' }}>
                        Tap cards to find matching word-translation pairs
                    </p>
                </div>
            )}
        </div>
    );
}

export default MobileMemoryMatch;
