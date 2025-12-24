import React, { useState, useEffect, useMemo } from 'react';
import { useRoomContext, useLocalParticipant, useParticipants, ParticipantLoop, ParticipantTile, GridLayout } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { Users, Shuffle, Play, Square, Settings, Eye, VolumeX, Mic } from 'lucide-react';
import { Button, Card } from '@heroui/react';

// === CONSTANTS ===
const MSG_BREAKOUT_UPDATE = 'BREAKOUT_UPDATE';

// === HELPER: Group Generation ===
const generateGroups = (participants, numGroups) => {
    // Filter out teacher/local if needed, but usually we just shuffle everyone else
    // For simplicity, let's assume 'teacher' is excluded or handled separately
    // But since we don't know who is teacher easily without metadata, let's just shuffle all REMOTE participants?
    // Better: Shuffle all, then teacher can drag/drop or we assign.

    // Simple Random:
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const groups = {};

    shuffled.forEach((p, i) => {
        const groupIndex = i % numGroups;
        const groupId = `Group ${groupIndex + 1}`;
        groups[p.identity] = groupId;
    });

    return groups;
};

const BreakoutSystem = ({ isOpen, onClose, isTeacher, setVisibleIdentities }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const participants = useParticipants(); // All remote participants

    // State
    const [isActive, setIsActive] = useState(false);
    const [assignments, setAssignments] = useState({}); // { identity: groupId }
    const [numGroups, setNumGroups] = useState(2);
    const [viewingGroup, setViewingGroup] = useState('ALL'); // Teacher only: which group to view

    // --- EFFECT: Listen for Updates (Student & Teacher) ---
    useEffect(() => {
        if (!room) return;

        const handleData = (payload, participant) => {
            const data = JSON.parse(new TextDecoder().decode(payload));
            if (data.type === MSG_BREAKOUT_UPDATE) {
                setIsActive(data.active);
                setAssignments(data.assignments);

                // If I am a student, I should automatically "view" my group
                if (!isTeacher) {
                    if (data.active) {
                        const myGroupId = data.assignments[localParticipant.identity];
                        // Filter: Me + Anyone in my group
                        // Note: assignments keys are identities.
                        const visible = Object.entries(data.assignments)
                            .filter(([pid, gid]) => gid === myGroupId)
                            .map(([pid]) => pid);
                        setVisibleIdentities(visible);
                    } else {
                        setVisibleIdentities(null); // Show all
                    }
                }
            }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [room, isTeacher, localParticipant, setVisibleIdentities]);

    // --- TEACHER ACTIONS ---

    const broadcastUpdate = (active, newAssignments) => {
        const payload = JSON.stringify({
            type: MSG_BREAKOUT_UPDATE,
            active,
            assignments: newAssignments
        });

        room.localParticipant.publishData(
            new TextEncoder().encode(payload),
            DataPacket_Kind.RELIABLE
        );

        // Local update
        setIsActive(active);
        setAssignments(newAssignments);

        // Teacher view update
        if (!active) {
            setVisibleIdentities(null);
            setViewingGroup('ALL');
        }
    };

    const handleCreateRandom = () => {
        const remotes = participants.filter(p => !p.isLocal); // Don't assign teacher mostly?
        // Or assign everyone including teacher? Let's exclude local (Teacher) from assignment usually
        const newAssigns = generateGroups(remotes, numGroups);
        setAssignments(newAssigns);
    };

    const handleStart = () => {
        broadcastUpdate(true, assignments);
    };

    const handleEnd = () => {
        broadcastUpdate(false, assignments);
    };

    // Teacher View Switching
    const handleTeacherViewJoin = (groupId) => {
        setViewingGroup(groupId);
        if (groupId === 'ALL') {
            setVisibleIdentities(null);
        } else {
            const visible = Object.entries(assignments)
                .filter(([pid, gid]) => gid === groupId)
                .map(([pid]) => pid);
            setVisibleIdentities(visible);
        }
    };

    // --- RENDER ---

    if (!isOpen && !isActive) return null; // If hidden and inactive, don't show UI
    // If active, we might want to show a small "In Breakout" badge even if "closed"?
    // For now, let's assume this component renders the *Controls*.

    if (!isTeacher && !isActive) return null; // Student only sees when active (or just the breakout view)

    // STUDENT VIEW (Just info message usually, or hidden if integrated in Grid)
    if (!isTeacher) {
        if (isActive) {
            const myGroupId = assignments[localParticipant.identity];
            return (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white px-4 py-2 rounded-full backdrop-blur-md z-40 shadow-xl flex items-center gap-2">
                    <Users size={16} />
                    <span className="font-bold">{myGroupId ? `You are in ${myGroupId}` : 'Main Room'}</span>
                </div>
            );
        }
        return null; // Not active
    }

    // TEACHER CONTROLS
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Users size={24} className="text-indigo-400" />
                            Breakout Rooms
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            {isActive ? 'Session is Live' : 'Setup Groups'}
                        </p>
                    </div>
                    {isActive ? (
                        <Button color="danger" onPress={handleEnd} startContent={<Square size={16} />}>
                            End Session
                        </Button>
                    ) : (
                        <button onClick={onClose} className="text-white/50 hover:text-white"><Settings size={20} /></button>
                    )}
                </div>

                {/* Main Body */}
                <div className="flex gap-6">
                    {/* Left: Controls */}
                    <div className="w-1/3 space-y-4">
                        {!isActive && (
                            <div className="bg-white/5 p-4 rounded-xl space-y-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold">Room Count</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button onClick={() => setNumGroups(Math.max(2, numGroups - 1))} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white">-</button>
                                        <span className="text-xl font-bold text-white">{numGroups}</span>
                                        <button onClick={() => setNumGroups(Math.min(10, numGroups + 1))} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white">+</button>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-indigo-600 font-bold text-white"
                                    startContent={<Shuffle size={16} />}
                                    onPress={handleCreateRandom}
                                >
                                    Shuffle
                                </Button>
                            </div>
                        )}

                        {/* Room List / Monitor */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {isActive && (
                                <div
                                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${viewingGroup === 'ALL' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                    onClick={() => handleTeacherViewJoin('ALL')}
                                >
                                    <div className="font-bold text-white text-sm">Main Room (Overview)</div>
                                    <div className="text-xs text-zinc-500">See Everyone</div>
                                </div>
                            )}

                            {Object.entries(
                                Object.entries(assignments).reduce((acc, [id, grp]) => {
                                    if (!acc[grp]) acc[grp] = [];
                                    acc[grp].push(id);
                                    return acc;
                                }, {})
                            ).map(([groupId, members]) => (
                                <div
                                    key={groupId}
                                    className={`p-3 rounded-lg border transition-colors ${viewingGroup === groupId && isActive ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-transparent'}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white text-sm">{groupId}</span>
                                        {isActive && (
                                            <button
                                                onClick={() => handleTeacherViewJoin(groupId)}
                                                className="p-1.5 rounded-full bg-white/10 hover:bg-indigo-500 text-white transition-colors"
                                                title="Visit Room"
                                            >
                                                {viewingGroup === groupId ? <Mic size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {members.map(pid => {
                                            const p = participants.find(part => part.identity === pid);
                                            return (
                                                <div key={pid} className="text-[10px] bg-black/40 px-2 py-1 rounded text-zinc-300">
                                                    {p?.name || p?.identity || 'Student'}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Preview or Info */}
                    <div className="flex-1 bg-black/20 rounded-xl p-6 flex items-center justify-center border border-white/5">
                        {!isActive ? (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Ready to Start?</h3>
                                <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto">
                                    This will move students into separate rooms. You can jump between rooms to monitor progress.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-indigo-500/20"
                                    startContent={<Play size={20} />}
                                    onPress={handleStart}
                                    isDisabled={Object.keys(assignments).length === 0}
                                >
                                    Start Breakout Session
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h3 className="text-white font-bold mb-2">Session Active</h3>
                                <p className="text-zinc-400 text-sm">Use the sidebar to visit different rooms.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BreakoutSystem;
