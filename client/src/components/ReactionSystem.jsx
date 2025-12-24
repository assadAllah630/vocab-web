import React, { useState, useEffect, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { Hand, Heart, ThumbsUp, Smile, Zap, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// === CONSTANTS ===
const REACTION_DURATION = 2000; // ms to show floating emoji
const MSG_REACTION = 'REACTION';
const MSG_HAND_TOGGLE = 'HAND_TOGGLE';

const EMOJIS = {
    LOVE: { icon: Heart, color: 'text-pink-500', char: '❤️' },
    LIKE: { icon: ThumbsUp, color: 'text-blue-500', char: '👍' },
    WOW: { icon: Zap, color: 'text-yellow-400', char: '😮' }, // Using Zap for "Shock/Wow" visual or Smile
    HAHA: { icon: Smile, color: 'text-orange-400', char: '😂' },
};

const ReactionSystem = ({ isTeacher }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // State
    const [floatingReactions, setFloatingReactions] = useState([]); // { id, char, x, y }
    const [handRaisedUsers, setHandRaisedUsers] = useState(new Set()); // Set of Identity strings
    const [isMyHandRaised, setIsMyHandRaised] = useState(false);

    // Engagement Stats (Teacher Only)
    const [interactionCounts, setInteractionCounts] = useState({}); // { identity: count }

    // --- SOUNDS (Optional) ---
    // const playSound = (type) => { ... }

    // --- HANDLERS ---

    const addFloatingReaction = useCallback((char, senderId) => {
        const id = Date.now() + Math.random();
        // Randomize start position slightly for variety
        const randomX = Math.random() * 20 - 10; // +/- 10% offset

        setFloatingReactions(prev => [...prev, { id, char, x: 50 + randomX, senderId }]);

        // Remove after animation
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, REACTION_DURATION);
    }, []);

    useEffect(() => {
        if (!room) return;

        const handleData = (payload, participant) => {
            const data = JSON.parse(new TextDecoder().decode(payload));
            const senderId = participant.identity;

            if (data.type === MSG_REACTION) {
                addFloatingReaction(data.char, senderId);

                // Track engagement
                if (isTeacher) {
                    setInteractionCounts(prev => ({
                        ...prev,
                        [senderId]: (prev[senderId] || 0) + 1
                    }));
                }
            } else if (data.type === MSG_HAND_TOGGLE) {
                setHandRaisedUsers(prev => {
                    const newSet = new Set(prev);
                    if (data.raised) newSet.add(senderId);
                    else newSet.delete(senderId);
                    return newSet;
                });
            }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [room, isTeacher, addFloatingReaction]);

    const sendReaction = (key) => {
        const reaction = EMOJIS[key];
        addFloatingReaction(reaction.char, localParticipant.identity); // Show locally instantly

        const payload = JSON.stringify({ type: MSG_REACTION, char: reaction.char });
        room.localParticipant.publishData(
            new TextEncoder().encode(payload),
            DataPacket_Kind.LOSSY // Lossy is fine for emojis
        );
    };

    const toggleHand = () => {
        const newState = !isMyHandRaised;
        setIsMyHandRaised(newState);

        // Optimistic update
        setHandRaisedUsers(prev => {
            const newSet = new Set(prev);
            if (newState) newSet.add(localParticipant.identity);
            else newSet.delete(localParticipant.identity);
            return newSet;
        });

        const payload = JSON.stringify({ type: MSG_HAND_TOGGLE, raised: newState });
        room.localParticipant.publishData(
            new TextEncoder().encode(payload),
            DataPacket_Kind.RELIABLE // Reliable for state
        );
    };

    // --- RENDER ---

    return (
        <>
            {/* 1. Floating Animations Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden">
                <AnimatePresence>
                    {floatingReactions.map(reaction => (
                        <motion.div
                            key={reaction.id}
                            initial={{ opacity: 0, y: '80%', x: `${reaction.x}%`, scale: 0.5 }}
                            animate={{ opacity: 1, y: '40%', scale: 1.5 }}
                            exit={{ opacity: 0, y: '0%', scale: 0.8 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute text-6xl drop-shadow-lg"
                        >
                            {reaction.char}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* 2. Reaction Bar (Bottom Left) */}
            <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-10">
                {/* Hand Raise Toggle */}
                <button
                    onClick={toggleHand}
                    className={`p-3 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 ${isMyHandRaised
                            ? 'bg-yellow-500 text-black animate-pulse'
                            : 'bg-zinc-800/80 backdrop-blur-md border border-white/10 text-white hover:bg-zinc-700'
                        }`}
                    title={isMyHandRaised ? "Lower Hand" : "Raise Hand"}
                >
                    <Hand size={24} className={isMyHandRaised ? "fill-current" : ""} />
                </button>

                {/* Emoji Bar */}
                <div className="bg-zinc-800/80 backdrop-blur-md border border-white/10 p-2 rounded-full flex flex-col gap-2 shadow-xl">
                    {Object.entries(EMOJIS).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => sendReaction(key)}
                            className="p-2 hover:bg-white/10 rounded-full transition-transform hover:scale-125 active:scale-90"
                            title={key}
                        >
                            <span className="text-2xl">{config.char}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Teacher Dashboard / Raised Hands List (Top Right) */}
            {handRaisedUsers.size > 0 && (
                <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/50 p-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10 pointer-events-auto">
                        <h4 className="text-yellow-400 font-bold text-sm flex items-center gap-2 mb-2">
                            <Hand size={16} className="fill-current" />
                            Raised Hands ({handRaisedUsers.size})
                        </h4>
                        <div className="flex flex-col gap-1">
                            {Array.from(handRaisedUsers).map(id => {
                                // In real app, look up participant Name from context
                                const pName = id === localParticipant.identity ? "Me" : `Student ${id.slice(0, 4)}`;
                                return (
                                    <div key={id} className="flex justify-between items-center bg-black/40 rounded px-2 py-1 text-xs text-white">
                                        <span>{pName}</span>
                                        {isTeacher && (
                                            <button
                                                className="ml-2 text-white/50 hover:text-white"
                                                onClick={() => {
                                                    // Teacher lowers hand (sends message?)
                                                    // For now, simpler: just UI dismiss locally or assume teacher addresses them.
                                                }}
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Interaction Leaderboard (Teacher Only - Tiny Pill) */}
            {isTeacher && Object.keys(interactionCounts).length > 0 && (
                <div className="fixed bottom-4 left-4 z-40 bg-black/60 px-3 py-1 rounded-full border border-white/5 text-[10px] text-zinc-400">
                    Highest Engagement: {
                        Object.entries(interactionCounts)
                            .sort(([, a], [, b]) => b - a)[0][0].slice(0, 4)
                    }
                </div>
            )}
        </>
    );
};

export default ReactionSystem;
