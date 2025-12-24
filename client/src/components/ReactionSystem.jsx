import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, ThumbsUp, Smile, Frown,
    Hand, X
} from 'lucide-react';
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";

// --- CONFIG ---
const MSG_REACTION = 'REACTION';
const MSG_HAND_TOGGLE = 'HAND_TOGGLE';
const REACTION_DURATION = 3000;

const EMOJIS = {
    LOVE: { icon: Heart, color: 'text-red-500', char: '❤️' },
    LIKE: { icon: ThumbsUp, color: 'text-blue-400', char: '👍' },
    WOW: { icon: Smile, color: 'text-yellow-400', char: '😮' },
    HAHA: { icon: Smile, color: 'text-orange-400', char: '😂' },
};

/**
 * ReactionSystem - Floating reactions & Unified Hand Raising
 * Pure client-side logic for high performance.
 */
const ReactionSystem = ({
    isTeacher,
    isHandRaised,
    toggleHand,
    setIsHandRaised,
    isVisible = true
}) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // State
    const [floatingReactions, setFloatingReactions] = useState([]); // { id, char, x, senderId }
    const [handRaisedUsers, setHandRaisedUsers] = useState(new Set()); // Set of Identity strings
    const [interactionCounts, setInteractionCounts] = useState({}); // { identity: count }

    // --- HANDLERS ---

    const addFloatingReaction = useCallback((char, senderId) => {
        const id = Date.now() + Math.random();
        setFloatingReactions(prev => [...prev, { id, char, x: 50 + (Math.random() * 20 - 10), senderId }]);
        setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), REACTION_DURATION);
    }, []);

    useEffect(() => {
        if (!room) return;

        const handleData = (payload, participant) => {
            try {
                const data = JSON.parse(new TextDecoder().decode(payload));
                const senderId = participant.identity;

                if (data.type === MSG_REACTION) {
                    addFloatingReaction(data.char, senderId);
                    if (isTeacher) {
                        setInteractionCounts(prev => ({
                            ...prev,
                            [senderId]: (prev[senderId] || 0) + 1
                        }));
                    }
                } else if (data.type === MSG_HAND_TOGGLE) {
                    const targetIdentity = data.target || senderId;

                    // If I am the target and raised is false, lower my local state
                    if (targetIdentity === localParticipant.identity && !data.raised) {
                        if (setIsHandRaised) setIsHandRaised(false);
                    }

                    setHandRaisedUsers(prev => {
                        const newSet = new Set(prev);
                        if (data.raised) newSet.add(targetIdentity);
                        else newSet.delete(targetIdentity);
                        return newSet;
                    });
                }
            } catch (e) {
                // Ignore non-JSON or malformed data
            }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [room, isTeacher, addFloatingReaction, localParticipant, setIsHandRaised]);

    const sendReaction = (key) => {
        if (!room) return;
        const reaction = EMOJIS[key];
        addFloatingReaction(reaction.char, localParticipant.identity);
        const payload = JSON.stringify({ type: MSG_REACTION, char: reaction.char });
        room.localParticipant.publishData(new TextEncoder().encode(payload), { kind: DataPacket_Kind.LOSSY });
    };

    // --- RENDER ---

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">

            {/* 1. Floating Reactions Overlay */}
            <div className="absolute inset-x-0 bottom-32 flex justify-center h-[400px]">
                <AnimatePresence mode="popLayout">
                    {floatingReactions.map(reaction => (
                        <motion.div
                            key={reaction.id}
                            initial={{ y: 0, opacity: 0, scale: 0.5, x: `${reaction.x}%` }}
                            animate={{ y: -350, opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2.5, ease: "easeOut" }}
                            className="absolute text-4xl select-none pointer-events-none"
                        >
                            {reaction.char}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* 2. Reaction Selector & Hand List (Mobile Optimized) */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="absolute left-4 bottom-28 md:bottom-auto md:top-1/2 md:-translate-y-1/2 flex flex-col items-center gap-4 pointer-events-auto"
                    >
                        {/* Reaction Bar (Vertical Glass) */}
                        <div className="flex flex-col gap-2 p-2.5 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                            {Object.entries(EMOJIS).map(([key, item]) => (
                                <button
                                    key={key}
                                    onClick={() => sendReaction(key)}
                                    className={`p-3.5 rounded-2xl transition-all hover:scale-110 active:scale-90 ${item.color} bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10`}
                                >
                                    <item.icon size={24} />
                                </button>
                            ))}
                        </div>

                        {/* Hand Raise List (Stacked Bubbles) */}
                        {handRaisedUsers.size > 0 && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/60 backdrop-blur-xl rounded-2xl p-2 border border-white/10 min-w-[150px] shadow-2xl max-h-[300px] flex flex-col"
                            >
                                <h4 className="text-[10px] uppercase tracking-[0.1em] text-white/40 mb-2 font-bold px-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Hand size={12} className="text-yellow-500 fill-current" />
                                        Raised ({handRaisedUsers.size})
                                    </span>
                                </h4>
                                <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1">
                                    {Array.from(handRaisedUsers).map(identity => {
                                        const participant = identity === localParticipant.identity
                                            ? localParticipant
                                            : Array.from(room.remoteParticipants.values()).find(p => p.identity === identity);

                                        const pName = participant?.name || `Student ${identity.slice(0, 4)}`;

                                        return (
                                            <div key={identity} className="group flex justify-between items-center bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 text-xs text-white border border-white/5 transition-all">
                                                <span className="truncate max-w-[100px] font-medium opacity-90">{identity === localParticipant.identity ? "Me" : pName}</span>
                                                {isTeacher && (
                                                    <button
                                                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        onClick={() => {
                                                            const payload = JSON.stringify({ type: MSG_HAND_TOGGLE, raised: false, target: identity });
                                                            room.localParticipant.publishData(
                                                                new TextEncoder().encode(payload),
                                                                { kind: DataPacket_Kind.RELIABLE }
                                                            );
                                                        }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Engagement Leaderboard (Teacher Hub) */}
            {isTeacher && Object.keys(interactionCounts).length > 0 && (
                <div className="fixed top-20 right-4 z-40 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[10px] text-zinc-400 shadow-xl flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Active Engagement:</span>
                    <span className="text-white font-medium">
                        {Object.entries(interactionCounts)
                            .sort(([, a], [, b]) => b - a)[0][0].slice(0, 4)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default memo(ReactionSystem);
