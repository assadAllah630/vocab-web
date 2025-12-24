/**
 * MobileGameLobby - Waiting room for game session
 * 
 * Teacher View: See participants, start game
 * Student View: Wait for game to start, select avatar
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Users, Play, Copy, Check,
    Wifi, Crown, UserCircle, Clock
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../api';

const AVATARS = ['🦊', '🐻', '🦁', '🐯', '🐨', '🐼', '🐸', '🦄', '🐲', '🦅'];

function MobileGameLobby() {
    const navigate = useNavigate();
    const { id: routeId } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const joinCodeFromQuery = queryParams.get('joinCode');
    const initialJoinCode = location.state?.join_code || joinCodeFromQuery;

    const [session, setSession] = useState(null);
    const [sessionId, setSessionId] = useState(routeId);
    const [error, setError] = useState(null);

    // If no routeId but joinCode exists, lookup session by code
    useEffect(() => {
        const joinByCode = async () => {
            if (!routeId && joinCodeFromQuery) {
                try {
                    // Try to join or get session by code
                    const res = await api.post('game-sessions/join/', { join_code: joinCodeFromQuery });
                    if (res.data?.id) {
                        setSessionId(res.data.id);
                    }
                } catch (e) {
                    console.error('Failed to join by code:', e);
                    setError(e.response?.data?.error || 'Invalid or expired join code');
                }
            }
        };
        joinByCode();
    }, [routeId, joinCodeFromQuery]);

    // Redirect legacy/invalid 'global' route to games menu
    useEffect(() => {
        if (sessionId === 'global') {
            navigate('/m/games', { replace: true });
        }
    }, [sessionId, navigate]);

    const [loading, setLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isReady, setIsReady] = useState(false);

    const loadSession = useCallback(async () => {
        if (!sessionId) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`game-sessions/${sessionId}/`);
            setSession(res.data);

            // Check if current user is host
            const meRes = await api.get('users/me/');
            setIsHost(res.data.host_id === meRes.data.id || res.data.participants?.some(
                p => p.user_id === meRes.data.id && p.is_host
            ));

            // If game started, redirect to arena
            if (res.data.status === 'active') {
                navigate(`/m/game/arena/${sessionId}`);
            }
        } catch (e) {
            console.error('Failed to load session', e);
            setError('Failed to load game session');
        } finally {
            setLoading(false);
        }
    }, [sessionId, navigate]);

    useEffect(() => {
        if (sessionId) {
            loadSession();

            // Poll for updates every 2 seconds
            const interval = setInterval(loadSession, 2000);
            return () => clearInterval(interval);
        }
    }, [sessionId, loadSession]);

    const handleCopyCode = () => {
        const code = session?.join_code || initialJoinCode;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReadyUp = async () => {
        try {
            await api.post(`game-sessions/${id}/ready/`);
            setIsReady(true);
        } catch (e) {
            console.error('Failed to ready up', e);
        }
    };

    const handleStartGame = async () => {
        try {
            await api.post(`game-sessions/${id}/start/`);
            navigate(`/m/game/arena/${id}`);
        } catch (e) {
            console.error('Failed to start game', e);
            alert('Failed to start game');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const joinCode = session?.join_code || initialJoinCode;
    const participants = session?.participants || [];
    const readyCount = participants.filter(p => p.is_ready).length;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-32 text-white">
            {/* Header */}
            <div className="p-4 pt-8 relative z-10">
                <button onClick={() => navigate(-1)} className="p-2 bg-[#1C1C1F]/80 backdrop-blur rounded-lg mb-4 text-gray-400 hover:text-white">
                    <ChevronLeft size={20} />
                </button>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2 animate-pulse">
                        <Wifi size={12} />
                        Live Lobby
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-1">
                        {session?.config?.name || 'Classroom Arena'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Waiting for players...
                    </p>
                </motion.div>
            </div>

            {/* Join Code Display */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyCode}
                className="mx-5 p-8 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-3xl text-center relative overflow-hidden shadow-2xl shadow-indigo-900/40 cursor-pointer group"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                />

                <div className="relative z-10">
                    <p className="text-indigo-200 text-xs uppercase tracking-widest font-bold mb-3">Join Code</p>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-5xl font-black tracking-[0.2em] text-white font-mono shadow-sm">
                            {joinCode}
                        </span>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2 text-indigo-200/80 text-xs">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied to clipboard!' : 'Tap card to copy'}
                    </div>
                </div>
            </motion.div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 py-4 text-green-400">
                <Wifi size={16} className="animate-pulse" />
                <span className="text-xs">Connected • {participants.length} player{participants.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Participants */}
            <div className="px-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Users size={16} />
                        Players
                    </h2>
                    <span className="text-xs text-gray-500">{readyCount}/{participants.length} ready</span>
                </div>

                {participants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Waiting for players to join...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <AnimatePresence>
                            {participants.map((player, index) => (
                                <motion.div
                                    key={player.user_id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 rounded-xl border-2 ${player.is_ready
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-[#27272A] bg-[#1C1C1F]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="text-3xl">{AVATARS[index % AVATARS.length]}</div>
                                            {player.is_host && (
                                                <Crown size={14} className="absolute -top-2 -right-2 text-amber-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{player.username}</p>
                                            <p className={`text-xs ${player.is_ready ? 'text-green-400' : 'text-gray-500'}`}>
                                                {player.is_ready ? 'Ready!' : 'Waiting...'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Avatar Selection (Students) */}
            {!isHost && (
                <div className="px-4 mt-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Select Avatar</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {AVATARS.map((avatar) => (
                            <button
                                key={avatar}
                                onClick={() => setSelectedAvatar(avatar)}
                                className={`text-3xl p-2 rounded-xl transition-all ${selectedAvatar === avatar
                                    ? 'bg-indigo-600 scale-110'
                                    : 'bg-[#1C1C1F] hover:bg-[#27272A]'
                                    }`}
                            >
                                {avatar}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B] border-t border-[#27272A]">
                {isHost ? (
                    <button
                        onClick={handleStartGame}
                        disabled={participants.length === 0}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${participants.length === 0
                            ? 'bg-[#27272A] text-gray-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            }`}
                    >
                        <Play size={24} />
                        Start Game ({participants.length} players)
                    </button>
                ) : (
                    <button
                        onClick={handleReadyUp}
                        disabled={isReady}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${isReady
                            ? 'bg-green-600 text-white'
                            : 'bg-indigo-600 text-white'
                            }`}
                    >
                        {isReady ? (
                            <>
                                <Check size={24} />
                                Ready! Waiting for host...
                            </>
                        ) : (
                            <>
                                <UserCircle size={24} />
                                I'm Ready!
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default MobileGameLobby;
