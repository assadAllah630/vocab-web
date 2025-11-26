import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    PuzzlePieceIcon,
    ClockIcon,
    SparklesIcon,
    TrophyIcon,
    PlayCircleIcon,
    StarIcon
} from '@heroicons/react/24/outline';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function MiniGames() {
    const games = [
        {
            id: 'memory',
            title: 'Memory Match',
            description: 'Test your recall by finding matching pairs of words and translations.',
            icon: PuzzlePieceIcon,
            color: 'from-violet-500 to-purple-600',
            shadow: 'shadow-purple-500/30',
            link: '/games/memory',
            stats: 'Best Streak: 12'
        },
        {
            id: 'speed',
            title: 'Time Challenge',
            description: 'Race against the clock! Translate as many words as possible.',
            icon: ClockIcon,
            color: 'from-amber-400 to-orange-500',
            shadow: 'shadow-orange-500/30',
            link: '/games/speed',
            comingSoon: true
        },
        {
            id: 'missing',
            title: 'Word Builder',
            description: 'Fill in the missing letters to complete the vocabulary words.',
            icon: SparklesIcon,
            color: 'from-emerald-400 to-teal-500',
            shadow: 'shadow-teal-500/30',
            link: '/games/missing',
            comingSoon: true
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
            <div className="text-center mb-16 relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block"
                >
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tight mb-4 drop-shadow-sm">
                        ARCADE
                    </h1>
                </motion.div>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Level up your language skills with interactive challenges.
                </p>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl -z-10 animate-pulse" />
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {games.map((game) => (
                    <motion.div
                        key={game.id}
                        variants={item}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`relative group bg-white rounded-3xl p-1 overflow-hidden shadow-xl ${game.comingSoon ? 'opacity-80' : 'hover:shadow-2xl'} transition-all duration-300`}
                    >
                        {/* Card Border Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                        <div className="relative bg-white rounded-[22px] p-8 h-full flex flex-col border border-slate-100">
                            {/* Icon Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-4 rounded-2xl bg-gradient-to-br ${game.color} ${game.shadow} text-white shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
                                    <game.icon className="w-8 h-8" />
                                </div>
                                {game.comingSoon ? (
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-full">
                                        Coming Soon
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
                                        <TrophyIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold">Top 100</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-colors">
                                {game.title}
                            </h3>
                            <p className="text-slate-600 mb-8 flex-grow leading-relaxed">
                                {game.description}
                            </p>

                            {/* Action Footer */}
                            <div className="mt-auto">
                                {game.comingSoon ? (
                                    <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-center cursor-not-allowed border border-slate-100">
                                        Locked
                                    </div>
                                ) : (
                                    <Link
                                        to={game.link}
                                        className={`block w-full py-3.5 rounded-xl font-bold text-white text-center shadow-lg transform transition-all active:scale-95 bg-gradient-to-r ${game.color} ${game.shadow} hover:shadow-xl flex items-center justify-center gap-2`}
                                    >
                                        <PlayCircleIcon className="w-5 h-5" />
                                        Play Now
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Leaderboard Teaser */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-20 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
            >
                <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrophyIcon className="w-8 h-8 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white">Global Leaderboard</h3>
                    </div>
                    <button className="text-slate-400 hover:text-white text-sm font-bold transition-colors">
                        View All
                    </button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((rank) => (
                        <div key={rank} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                    rank === 2 ? 'bg-slate-100 text-slate-600' :
                                        'bg-orange-100 text-orange-600'
                                }`}>
                                {rank}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">Player_{rank}84</div>
                                <div className="text-sm text-slate-500">12,450 pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

export default MiniGames;
