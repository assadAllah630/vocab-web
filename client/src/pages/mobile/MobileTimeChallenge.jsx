import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../../api';

const MobileTimeChallenge = () => {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameOver, setGameOver] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        fetchWords();
    }, []);

    useEffect(() => {
        if (timeLeft > 0 && !gameOver) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            setGameOver(true);
        }
    }, [timeLeft, gameOver]);

    const fetchWords = async () => {
        try {
            const res = await api.get('vocab/');
            const shuffled = res.data.sort(() => Math.random() - 0.5).slice(0, 20);
            setWords(shuffled);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAnswer = (correct) => {
        if (correct) setScore(s => s + 1);
        if (currentIndex < words.length - 1) {
            setCurrentIndex(i => i + 1);
            setShowAnswer(false);
        } else {
            setGameOver(true);
        }
    };

    const currentWord = words[currentIndex];

    if (gameOver) {
        return (
            <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Time's Up!</h1>
                    <p className="text-5xl font-black text-[#6366F1] mb-4">{score}/{words.length}</p>
                    <button
                        onClick={() => navigate('/m/games')}
                        className="px-6 py-3 bg-[#6366F1] text-white rounded-xl font-bold"
                    >
                        Back to Games
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090B] p-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/m/games')} className="text-[#A1A1AA]">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#18181B] rounded-xl">
                    <ClockIcon className="w-5 h-5 text-[#F59E0B]" />
                    <span className="text-xl font-bold text-white">{timeLeft}s</span>
                </div>
                <div className="text-[#6366F1] font-bold">{score}/{currentIndex + 1}</div>
            </div>

            {currentWord && (
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#18181B] rounded-2xl p-6 border border-[#27272A]"
                >
                    <h2 className="text-2xl font-bold text-white text-center mb-4">
                        {currentWord.word}
                    </h2>

                    {!showAnswer ? (
                        <button
                            onClick={() => setShowAnswer(true)}
                            className="w-full py-4 bg-[#27272A] rounded-xl text-[#A1A1AA] font-medium"
                        >
                            Show Answer
                        </button>
                    ) : (
                        <>
                            <p className="text-center text-[#71717A] mb-6">{currentWord.translation}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleAnswer(false)}
                                    className="py-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-bold"
                                >
                                    Wrong
                                </button>
                                <button
                                    onClick={() => handleAnswer(true)}
                                    className="py-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-bold"
                                >
                                    Correct
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default MobileTimeChallenge;
