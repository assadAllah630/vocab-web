import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, UserGroupIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/solid';
import confetti from 'canvas-confetti';

const CARDS_DATA = [
    { id: 1, content: '🍎', matchId: 1, type: 'icon' },
    { id: 2, content: 'Apple', matchId: 1, type: 'text' },
    { id: 3, content: '🐶', matchId: 2, type: 'icon' },
    { id: 4, content: 'Dog', matchId: 2, type: 'text' },
    { id: 5, content: '🚗', matchId: 3, type: 'icon' },
    { id: 6, content: 'Car', matchId: 3, type: 'text' },
    { id: 7, content: '📚', matchId: 4, type: 'icon' },
    { id: 8, content: 'Book', matchId: 4, type: 'text' },
];

const COMMUNITY_FEED = [
    { user: "Alex", action: "mastered", word: "Serendipity", time: "2m ago" },
    { user: "Sarah", action: "shared", word: "Ephemeral", time: "5m ago" },
    { user: "Mike", action: "scored", word: "100% on Quiz", time: "12m ago" },
    { user: "Emma", action: "found", word: "Petrichor", time: "15m ago" },
    { user: "Juan", action: "mastered", word: "Ineffable", time: "18m ago" },
];

const LEADERBOARD = [
    { rank: 2, name: "Sarah K.", xp: "12,450", avatar: "https://i.pravatar.cc/150?u=sarah" },
    { rank: 1, name: "Alex M.", xp: "15,200", avatar: "https://i.pravatar.cc/150?u=alex" },
    { rank: 3, name: "Mike R.", xp: "10,800", avatar: "https://i.pravatar.cc/150?u=mike" },
];

const MemoryGame = () => {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [matched, setMatched] = useState([]);
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        resetGame();
    }, []);

    const resetGame = () => {
        const shuffled = [...CARDS_DATA].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setFlipped([]);
        setMatched([]);
        setDisabled(false);
    };

    const handleClick = (id) => {
        if (disabled || flipped.includes(id) || matched.includes(id)) return;

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setDisabled(true);
            const [firstId, secondId] = newFlipped;
            const firstCard = cards.find(c => c.id === firstId);
            const secondCard = cards.find(c => c.id === secondId);

            if (firstCard.matchId === secondCard.matchId) {
                setMatched(prev => [...prev, firstId, secondId]);
                setFlipped([]);
                setDisabled(false);
                confetti({
                    particleCount: 30,
                    spread: 50,
                    origin: { y: 0.7 },
                    colors: ['#6366f1', '#8b5cf6']
                });
            } else {
                setTimeout(() => {
                    setFlipped([]);
                    setDisabled(false);
                }, 1000);
            }
        }
    };

    const isGameOver = matched.length === CARDS_DATA.length;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                    Memory Match
                </h3>
                <button
                    onClick={resetGame}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                    Reset
                </button>
            </div>

            <div className="grid grid-cols-4 gap-1 md:gap-3">
                {cards.map((card) => {
                    const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
                    const isMatched = matched.includes(card.id);

                    return (
                        <motion.div
                            key={card.id}
                            className={`aspect-square cursor-pointer relative perspective-1000`}
                            onClick={() => handleClick(card.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.div
                                className={`w-full h-full rounded-xl flex items-center justify-center text-xl font-bold shadow-sm transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                                    }`}
                                style={{ transformStyle: 'preserve-3d' }}
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                            >
                                {/* Front (Hidden) */}
                                <div
                                    className="absolute w-full h-full backface-hidden bg-slate-800 rounded-xl flex items-center justify-center"
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <span className="text-2xl">❓</span>
                                </div>

                                {/* Back (Revealed) */}
                                <div
                                    className={`absolute w-full h-full backface-hidden rounded-xl flex items-center justify-center border-2 ${isMatched
                                        ? 'bg-green-50 border-green-500 text-green-700'
                                        : 'bg-white border-indigo-500 text-indigo-700'
                                        }`}
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)'
                                    }}
                                >
                                    {card.content}
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>

            {isGameOver && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center p-3 bg-indigo-50 rounded-xl text-indigo-800 font-bold text-sm"
                >
                    🎉 Perfect Score! +50 XP
                </motion.div>
            )}
        </div>
    );
};

const CommunityTicker = () => {
    return (
        <div className="w-full overflow-hidden bg-slate-900 py-3 border-y border-slate-800">
            <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
                {[...COMMUNITY_FEED, ...COMMUNITY_FEED, ...COMMUNITY_FEED].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                        <span className="font-bold text-indigo-400">{item.user}</span>
                        <span className="text-slate-500">{item.action}</span>
                        <span className="text-white font-medium bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            {item.word}
                        </span>
                        <span className="text-xs text-slate-600">• {item.time}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

const Leaderboard = () => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrophyIcon className="w-24 h-24 text-yellow-500" />
            </div>

            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                <FireIcon className="w-5 h-5 text-orange-500" />
                Global Leaderboard
            </h3>

            <div className="flex items-end justify-center gap-4 mb-4 relative z-10">
                {LEADERBOARD.map((user) => (
                    <div key={user.rank} className={`flex flex-col items-center ${user.rank === 1 ? 'order-2' : user.rank === 2 ? 'order-1' : 'order-3'}`}>
                        <div className="relative mb-2">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className={`rounded-full border-4 ${user.rank === 1 ? 'w-20 h-20 border-yellow-400 shadow-yellow-200' :
                                    user.rank === 2 ? 'w-16 h-16 border-slate-300' :
                                        'w-14 h-14 border-orange-300'
                                    } shadow-lg`}
                            />
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${user.rank === 1 ? 'bg-yellow-500' :
                                user.rank === 2 ? 'bg-slate-400' :
                                    'bg-orange-400'
                                }`}>
                                {user.rank}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                            <div className="text-xs text-indigo-600 font-bold">{user.xp} XP</div>
                        </div>
                        <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: user.rank === 1 ? 80 : user.rank === 2 ? 50 : 30 }}
                            className={`w-full rounded-t-lg mt-2 ${user.rank === 1 ? 'bg-gradient-to-t from-yellow-100 to-yellow-50' :
                                user.rank === 2 ? 'bg-gradient-to-t from-slate-100 to-slate-50' :
                                    'bg-gradient-to-t from-orange-100 to-orange-50'
                                }`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ArcadeSection = () => {
    return (
        <section className="py-12 sm:py-16 md:py-24 bg-slate-50 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12 lg:gap-16">

                    {/* Text Content - Natural Flow */}
                    <div className="w-full lg:w-5/12 space-y-4 sm:space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide"
                        >
                            <UserGroupIcon className="w-4 h-4" />
                            The Arcade
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight"
                        >
                            Learning is better <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">together</span>.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed"
                        >
                            Join a community of learners, compete on global leaderboards, and play mini-games that make vocabulary stick.
                        </motion.p>

                        {/* Stats Card - Integrated into text flow */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-xl p-4 shadow-lg border border-indigo-50 inline-block mt-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <SparklesIcon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-slate-900">12,405</div>
                                    <div className="text-xs text-slate-500 font-medium">Words Mastered Today</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Interactive Components - Organic Layout */}
                    <div className="w-full lg:w-7/12 grid sm:grid-cols-2 gap-6 items-start">
                        {/* Game - Slightly rotated for organic feel */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, rotate: -2 }}
                            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="w-full max-w-sm mx-auto sm:mx-0"
                        >
                            <MemoryGame />
                        </motion.div>

                        {/* Leaderboard - Offset for asymmetry */}
                        <motion.div
                            initial={{ opacity: 0, y: 60, rotate: 2 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 2 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="w-full max-w-sm mx-auto sm:mx-0 sm:mt-12"
                        >
                            <Leaderboard />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Ticker at bottom */}
            <div className="mt-12 sm:mt-16">
                <CommunityTicker />
            </div>
        </section>
    );
};

export default ArcadeSection;
