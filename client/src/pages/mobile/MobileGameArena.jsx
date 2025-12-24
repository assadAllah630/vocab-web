/**
 * MobileGameArena - Main game shell component
 * 
 * Features:
 * - Timer display
 * - Score tracking
 * - Question display
 * - Mode-specific UI
 * - Real-time sync
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Award, Zap, X, Check, SkipForward,
    Trophy, Users, Target, Sparkles, Shield, Snowflake, Bomb
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { GameVX, spawnParticles } from '../../components/GameVX';
import { soundManager } from '../../utils/SoundManager';

// Sound effects could be added here
const playSound = (type) => {
    // placeholder for sound effects
    console.log('Sound:', type);
};

function MobileGameArena() {
    const navigate = useNavigate();
    const { id } = useParams();
    const timerRef = useRef(null);

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showResult, setShowResult] = useState(null); // 'correct' | 'wrong' | null
    const [gameEnded, setGameEnded] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [shakeTrigger, setShakeTrigger] = useState(0);

    // Power-Ups State
    const [powerUps, setPowerUps] = useState({
        freeze: { count: 1, active: false, icon: Snowflake, color: 'bg-cyan-500' },
        bomb: { count: 1, active: false, icon: Bomb, color: 'bg-red-500' },
        shield: { count: 1, active: false, icon: Shield, color: 'bg-emerald-500' }
    });
    const [eliminatedOptions, setEliminatedOptions] = useState([]);

    const questions = session?.state?.questions || [];
    const currentQuestion = questions[questionIndex];

    const loadSession = useCallback(async () => {
        try {
            const res = await api.get(`game-sessions/${id}/sync/`);
            setSession(res.data);

            if (res.data.status === 'completed') {
                setGameEnded(true);
            }
        } catch (e) {
            console.error('Failed to sync', e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadSession();

        // Sync every 2 seconds
        const syncInterval = setInterval(loadSession, 2000);
        return () => clearInterval(syncInterval);
    }, [loadSession]);

    // Timer countdown
    useEffect(() => {
        if (gameEnded || powerUps.freeze.active) return; // FREEZE LOGIC

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleAnswer(null, true); // Time's up
                    return session?.config?.settings?.time_limit || 60;
                }
                if (prev <= 6) soundManager.play('click'); // Ticking sound
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [questionIndex, gameEnded, powerUps.freeze.active]);

    // Cleanup Freeze
    useEffect(() => {
        if (powerUps.freeze.active) {
            const timer = setTimeout(() => {
                setPowerUps(prev => ({
                    ...prev,
                    freeze: { ...prev.freeze, active: false }
                }));
            }, 10000); // 10s freeze
            return () => clearTimeout(timer);
        }
    }, [powerUps.freeze.active]);

    const handlePowerUp = (type) => {
        if (powerUps[type].count <= 0) return;

        soundManager.play('streak'); // Powerup sound

        setPowerUps(prev => ({
            ...prev,
            [type]: { ...prev[type], count: prev[type].count - 1, active: true }
        }));

        if (type === 'bomb' && currentQuestion) {
            // Eliminate 2 wrong answers
            const wrongOptions = currentQuestion.options.filter(o => o !== currentQuestion.answer);
            const toEliminate = wrongOptions.slice(0, 2);
            setEliminatedOptions(toEliminate);
        }
    };

    const handleAnswer = async (selectedAnswer, timeout = false, e) => {
        // Prevent clicking eliminated options
        if (eliminatedOptions.includes(selectedAnswer)) return;

        const isCorrect = selectedAnswer === currentQuestion.answer;
        const responseTime = startTime ? (Date.now() - startTime) / 1000 : 0;

        // SHIELD LOGIC
        if (!isCorrect && !timeout && powerUps.shield.active) {
            soundManager.play('shield_break'); // Placeholder
            setPowerUps(prev => ({ ...prev, shield: { ...prev.shield, active: false } }));
            setShakeTrigger(1); // Minor shake
            return; // Absorb the miss
        }

        // VX & SFX
        if (isCorrect) {
            soundManager.play('correct');
            if (e) spawnParticles(e.clientX, e.clientY, 'correct');
            if (streak > 0 && streak % 5 === 0) soundManager.play('streak');
        } else {
            soundManager.play('wrong');
            setShakeTrigger(prev => prev === 2 ? 1 : 2); // Trigger shake
            if (e) spawnParticles(e.clientX, e.clientY, 'wrong');
        }

        setShowResult(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            const points = Math.max(10, 100 - Math.floor(responseTime * 10));
            setScore((prev) => prev + points);
            setStreak((prev) => prev + 1);
        } else {
            setStreak(0);
        }

        try {
            await api.post(`game-sessions/${id}/answer/`, {
                question_id: currentQuestion.id,
                is_correct: isCorrect,
                response_time: responseTime,
            });
        } catch (e) {
            console.error('Failed to submit', e);
        }

        setTimeout(() => {
            setShowResult(null);
            setEliminatedOptions([]); // Reset bomb

            if (questionIndex < questions.length - 1) {
                setQuestionIndex((prev) => prev + 1);
                setTimeLeft(session?.config?.settings?.time_limit || 60);
                setStartTime(Date.now());
            } else {
                gameEndedSound();
            }
        }, 1000);
    };

    const gameEndedSound = () => {
        soundManager.play('gameOver');
        endGame();
    }

    const endGame = async () => {
        setGameEnded(true);
        clearInterval(timerRef.current);

        try {
            const res = await api.post(`game-sessions/${id}/end/`);
            setLeaderboard(res.data.leaderboard || []);
        } catch (e) {
            console.error('Failed to end game', e);
        }
    };

    useEffect(() => {
        setStartTime(Date.now());
    }, [questionIndex]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading game...</p>
                </div>
            </div>
        );
    }

    // Game Over Screen
    if (gameEnded) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] p-4 text-white">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                >
                    <Trophy size={80} className="mx-auto text-amber-400 mb-4" />
                    <h1 className="text-3xl font-black mb-2">Game Over!</h1>
                    <p className="text-2xl font-bold text-indigo-400">{score} points</p>
                </motion.div>

                <div className="space-y-3 mt-8">
                    <h2 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Users size={16} />
                        Leaderboard
                    </h2>
                    {leaderboard.map((player, index) => (
                        <motion.div
                            key={player.username}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl flex items-center gap-4 ${index === 0
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                                : index === 1
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                    : index === 2
                                        ? 'bg-gradient-to-r from-amber-700 to-amber-800'
                                        : 'bg-[#1C1C1F]'
                                }`}
                        >
                            <div className="text-2xl font-black w-8">#{player.rank}</div>
                            <div className="flex-1">
                                <p className="font-bold">{player.username}</p>
                                <p className="text-xs opacity-80">{player.correct} correct • {player.avg_time}s avg</p>
                            </div>
                            <div className="text-2xl font-black">{player.score}</div>
                        </motion.div>
                    ))}
                </div>

                <button
                    onClick={() => navigate('/m/dashboard')}
                    className="w-full mt-8 py-4 bg-indigo-600 rounded-xl font-bold"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Active Game UI
    return (
        <GameVX shakeTrigger={shakeTrigger} streak={streak}>
            <div className="min-h-screen text-white relative overflow-hidden flex flex-col">

                {/* Result Overlay */}
                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`absolute inset-0 z-50 flex items-center justify-center ${showResult === 'correct' ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-32 h-32 rounded-full flex items-center justify-center ${showResult === 'correct' ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                            >
                                {showResult === 'correct' ? <Check size={64} /> : <X size={64} />}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Stats */}
                <div className="p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                        <Award className="text-amber-400" size={24} />
                        <span className="text-2xl font-black">{score}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {streak > 1 && (
                            <motion.div
                                key={streak}
                                initial={{ scale: 1.5 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 text-orange-400 font-black italic text-xl"
                            >
                                <Zap size={20} className="fill-current" />
                                {streak}x
                            </motion.div>
                        )}

                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-colors ${timeLeft <= 10 ? 'bg-red-500/80 animate-pulse' : 'bg-black/30'
                            }`}>
                            <Clock size={18} />
                            <span className="font-bold text-lg">{timeLeft}s</span>
                        </div>
                    </div>
                </div>

                {/* Power Up Deck */}
                <div className="px-4 flex justify-center gap-4 mb-2 z-10">
                    {Object.entries(powerUps).map(([key, data]) => (
                        <button
                            key={key}
                            onClick={() => handlePowerUp(key)}
                            disabled={data.count === 0 || data.active}
                            className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${data.active ? 'ring-4 ring-white scale-110' : ''
                                } ${data.count === 0 ? 'opacity-30 grayscale' : 'hover:scale-105 active:scale-95'} ${data.color}`}
                        >
                            <data.icon size={24} className="text-white" />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-black rounded-full text-xs font-bold flex items-center justify-center border-2 border-[#0A0A0B]">
                                {data.count}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/10 mx-4 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((questionIndex + 1) / (questions.length || 1)) * 100}%` }}
                    />
                </div>

                {/* Question Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ minHeight: '30vh' }}>

                    {!currentQuestion ? (
                        <div className="text-center animate-pulse">
                            <div className="text-2xl font-bold text-gray-400">Loading next round...</div>
                        </div>
                    ) : (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ y: 50, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            className="text-center relative z-10"
                        >
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold tracking-wider mb-4 inline-block text-indigo-300">
                                TRANSLATE THIS
                            </span>
                            <h2 className="text-5xl md:text-6xl font-black text-white drop-shadow-2xl">
                                {currentQuestion.question}
                            </h2>
                        </motion.div>
                    )}
                </div>

                {/* Answer Options */}
                <div className="p-4 grid grid-cols-2 gap-3 pb-8 z-10">
                    {currentQuestion?.options?.map((option, index) => {
                        const isEliminated = eliminatedOptions.includes(option);

                        return (
                            <motion.button
                                key={option}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    scale: isEliminated ? 0 : 1,
                                    opacity: isEliminated ? 0 : 1
                                }}
                                transition={{ delay: index * 0.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleAnswer(option, false, e)}
                                disabled={showResult !== null || isEliminated}
                                className={`p-6 rounded-2xl font-bold text-lg transition-all shadow-lg backdrop-blur-sm border border-white/5 relative overflow-hidden group ${showResult === null
                                        ? 'bg-white/10 hover:bg-white/20 active:bg-indigo-600/50'
                                        : option === currentQuestion.answer
                                            ? 'bg-green-500 border-green-400'
                                            : 'bg-white/5 opacity-50'
                                    }`}
                            >
                                <div className="relative z-10">{option}</div>

                                {/* Button Hover Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </GameVX>
    );
}

export default MobileGameArena;
