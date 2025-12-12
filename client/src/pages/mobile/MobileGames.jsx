import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Puzzle,
    Timer,
    Sparkles,
    Trophy,
    Play,
    Lock,
    Star,
    Zap,
    Crown
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

function MobileGames() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const games = [
        {
            id: 'memory',
            title: t('memoryGame'),
            description: t('selectGame'),
            icon: Puzzle,
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            shadowColor: 'rgba(99, 102, 241, 0.4)',
            link: '/m/games/memory',
            available: true,
            badge: 'Popular'
        },
        {
            id: 'speed',
            title: 'Time Challenge',
            description: 'Race against the clock to translate',
            icon: Timer,
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
            shadowColor: 'rgba(245, 158, 11, 0.4)',
            link: '/m/games/speed',
            available: true,
            badge: 'New'
        },
        {
            id: 'builder',
            title: 'Word Builder',
            description: 'Fill in the missing letters',
            icon: Sparkles,
            gradient: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
            shadowColor: 'rgba(34, 197, 94, 0.4)',
            link: '/m/games/builder',
            available: true,
            badge: null
        }
    ];

    // Example leaderboard data
    const leaderboard = [
        { rank: 1, name: 'Player_184', points: 12450, isYou: false },
        { rank: 2, name: 'WordMaster', points: 11230, isYou: false },
        { rank: 3, name: 'You', points: 8920, isYou: true }
    ];

    return (
        <div className="min-h-screen pb-8" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="sticky top-0 z-20 px-5 py-4" style={{ backgroundColor: '#09090B' }}>
                <div className="flex items-center justify-between">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/m/practice')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <ChevronLeft size={22} color="#A1A1AA" />
                    </motion.button>
                    <h1
                        className="text-xl font-black"
                        style={{
                            background: 'linear-gradient(90deg, #6366F1, #A855F7, #EC4899)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        ARCADE
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Description */}
            <div className="px-5 mb-6">
                <p className="text-sm text-center" style={{ color: '#71717A' }}>
                    Level up your skills with fun challenges
                </p>
            </div>

            {/* Games Grid */}
            <div className="px-5 space-y-4 mb-8">
                {games.map((game, index) => {
                    const GameIcon = game.icon;
                    return (
                        <motion.button
                            key={game.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => game.available && navigate(game.link)}
                            disabled={!game.available}
                            className="w-full p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden"
                            style={{
                                backgroundColor: '#141416',
                                border: '1px solid #27272A',
                                opacity: game.available ? 1 : 0.6
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: game.gradient,
                                    boxShadow: `0 8px 24px ${game.shadowColor}`
                                }}
                            >
                                <GameIcon size={26} color="#FFFFFF" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold" style={{ color: '#FAFAFA' }}>
                                        {game.title}
                                    </h3>
                                    {game.badge && (
                                        <span
                                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: game.badge === 'New' ? '#22C55E' : '#6366F1',
                                                color: '#FFFFFF'
                                            }}
                                        >
                                            {game.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm" style={{ color: '#71717A' }}>
                                    {game.description}
                                </p>
                            </div>

                            {/* Action */}
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: game.available ? '#27272A' : '#1C1C1F' }}
                            >
                                {game.available ? (
                                    <Play size={18} color="#FAFAFA" fill="#FAFAFA" />
                                ) : (
                                    <Lock size={18} color="#52525B" />
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Stats Cards */}
            <div className="px-5 mb-8">
                <div className="grid grid-cols-3 gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 rounded-xl text-center"
                        style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                    >
                        <Zap size={20} color="#F59E0B" className="mx-auto mb-2" />
                        <p className="text-xl font-black" style={{ color: '#FAFAFA' }}>24</p>
                        <p className="text-xs" style={{ color: '#71717A' }}>Games</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-4 rounded-xl text-center"
                        style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                    >
                        <Star size={20} color="#6366F1" className="mx-auto mb-2" />
                        <p className="text-xl font-black" style={{ color: '#FAFAFA' }}>8.9K</p>
                        <p className="text-xs" style={{ color: '#71717A' }}>Points</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 rounded-xl text-center"
                        style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                    >
                        <Crown size={20} color="#A855F7" className="mx-auto mb-2" />
                        <p className="text-xl font-black" style={{ color: '#FAFAFA' }}>#42</p>
                        <p className="text-xs" style={{ color: '#71717A' }}>Rank</p>
                    </motion.div>
                </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="px-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                >
                    {/* Header */}
                    <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ backgroundColor: '#1C1C1F' }}
                    >
                        <div className="flex items-center gap-2">
                            <Trophy size={18} color="#F59E0B" />
                            <span className="font-bold text-sm" style={{ color: '#FAFAFA' }}>
                                Leaderboard
                            </span>
                        </div>
                        <button className="text-xs font-medium" style={{ color: '#6366F1' }}>
                            View All
                        </button>
                    </div>

                    {/* Rankings */}
                    <div className="p-4 space-y-3">
                        {leaderboard.map(player => (
                            <div
                                key={player.rank}
                                className={`flex items-center gap-3 p-3 rounded-xl ${player.isYou ? '' : ''}`}
                                style={{
                                    backgroundColor: player.isYou ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    border: player.isYou ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                                }}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                                    style={{
                                        backgroundColor: player.rank === 1 ? '#FEF3C7' :
                                            player.rank === 2 ? '#E5E7EB' :
                                                player.rank === 3 ? '#FED7AA' : '#27272A',
                                        color: player.rank === 1 ? '#B45309' :
                                            player.rank === 2 ? '#4B5563' :
                                                player.rank === 3 ? '#C2410C' : '#71717A'
                                    }}
                                >
                                    {player.rank}
                                </div>
                                <div className="flex-1">
                                    <p
                                        className="font-semibold text-sm"
                                        style={{ color: player.isYou ? '#6366F1' : '#FAFAFA' }}
                                    >
                                        {player.name}
                                    </p>
                                </div>
                                <p className="font-bold text-sm" style={{ color: '#A1A1AA' }}>
                                    {player.points.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default MobileGames;
