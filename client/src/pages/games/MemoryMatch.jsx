import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowPathIcon,
    XMarkIcon,
    TrophyIcon,
    SparklesIcon,
    PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';

function MemoryMatch() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [disabled, setDisabled] = useState(false);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = async () => {
        setLoading(true);
        try {
            // Use new matching game endpoint (Request #2)
            const res = await api.get('games/matching/');
            const words = res.data; // Endpoint already returns 8 random words
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
            console.error(err);
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
            setSolved(prev => [...prev, flipped[0], secondId]);
            setFlipped([]);
            setDisabled(false);
            setScore(prev => prev + 10);

            // Check for win condition immediately after solving
            if (solved.length + 2 === cards.length) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } else {
            setTimeout(() => {
                setFlipped([]);
                setDisabled(false);
            }, 1000);
        }
    };

    const isGameOver = cards.length > 0 && solved.length === cards.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                        <PuzzlePieceIcon className="w-10 h-10 text-indigo-600" />
                        Memory Match
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg">Find the matching pairs to clear the board.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="px-6 py-3 bg-indigo-50 rounded-xl">
                        <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">Score</span>
                        <span className="text-2xl font-black text-indigo-600">{score}</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 rounded-xl">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Moves</span>
                        <span className="text-2xl font-black text-slate-600">{moves}</span>
                    </div>
                    <div className="h-12 w-px bg-slate-100 mx-2"></div>
                    <button
                        onClick={initializeGame}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Restart Game"
                    >
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigate('/games')}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Exit Game"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Game Board */}
            <div className="flex-1 flex flex-col justify-center">
                {isGameOver ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-lg mx-auto text-center bg-white rounded-3xl shadow-xl border border-slate-100 p-12 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrophyIcon className="w-12 h-12 text-yellow-600" />
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 mb-2">Level Complete!</h3>
                        <p className="text-slate-600 mb-8 text-lg">
                            You cleared the board in <span className="font-bold text-slate-900">{moves}</span> moves.
                        </p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={initializeGame}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                                Play Again
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto w-full">
                        <AnimatePresence>
                            {cards.map((card, index) => (
                                <motion.div
                                    key={card.uniqueId}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleClick(card.uniqueId)}
                                    className="aspect-square cursor-pointer perspective-1000 group"
                                >
                                    <motion.div
                                        className="relative w-full h-full transition-all duration-500 transform-style-3d"
                                        animate={{ rotateY: flipped.includes(card.uniqueId) || solved.includes(card.uniqueId) ? 180 : 0 }}
                                    >
                                        {/* Front (Hidden) */}
                                        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center border-2 border-indigo-400/30 group-hover:shadow-xl group-hover:scale-[1.02] transition-all">
                                            <SparklesIcon className="w-8 h-8 text-white/30" />
                                        </div>

                                        {/* Back (Revealed) */}
                                        <div className={`absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-2xl shadow-lg border-2 flex items-center justify-center p-2 text-center transition-colors ${solved.includes(card.uniqueId)
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-indigo-100'
                                            }`}>
                                            <span className={`font-bold text-sm md:text-lg select-none ${solved.includes(card.uniqueId) ? 'text-green-700' : 'text-slate-700'
                                                }`}>
                                                {card.content}
                                            </span>
                                            {solved.includes(card.uniqueId) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-1 right-1 text-green-500"
                                                >
                                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MemoryMatch;
