import React, { useEffect, useState, useCallback } from 'react';
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { X, Save } from 'lucide-react';

/**
 * Professional Whiteboard powered by tldraw
 * Features: Infinite canvas, shapes, sticky notes, multiplayer sync
 */
const Whiteboard = ({ isOpen, onClose }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // Store persistence key (unique per session to avoid mixing rooms)
    const persistenceKey = room ? `whiteboard-${room.name}` : 'whiteboard-local';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" />

            {/* Main Editor Container */}
            <div className="absolute inset-0 flex flex-col">
                <div className="relative w-full h-full bg-[#101011]">
                    <Tldraw
                        persistenceKey={persistenceKey}
                        darkMode={true}
                        hideUi={false} // We will customize via overrides
                        overrides={uiOverrides}
                        components={{
                            HelpMenu: null,
                            MainMenu: null,
                            NavigationPanel: null,
                            DebugMenu: null,
                            PageMenu: null, // Keep it simple, one page
                            SharePanel: null,
                        }}
                        onMount={(editor) => {
                            // Initial setup can go here
                            editor.user.updateUserPreferences({
                                colorScheme: 'dark',
                            });
                        }}
                    >
                        <WhiteboardSync room={room} localParticipant={localParticipant} />
                        <CustomToolbar onClose={onClose} />
                    </Tldraw>
                </div>
            </div>
        </div>
    );
};

// --- Sync Logic Component ---
const WhiteboardSync = ({ room, localParticipant }) => {
    const editor = useEditor();
    const [isSynced, setIsSynced] = useState(false);

    // 1. Listen for local changes and broadcast
    useEffect(() => {
        if (!room || !editor) return;

        const cleanup = editor.store.listen((update) => {
            // Filter out ephemeral changes if needed
            // For now, naive broadcast of 'changes' object
            if (update.source === 'user') {
                const changes = update.changes; // added, updated, removed

                // Op: { type: 'UPDATE', payload: changes }
                const op = JSON.stringify({
                    type: 'WB_UPDATE',
                    payload: changes
                });

                room.localParticipant.publishData(
                    new TextEncoder().encode(op),
                    DataPacket_Kind.RELIABLE
                );
            }
        });

        return cleanup;
    }, [editor, room]);

    // 2. Listen for remote changes
    useEffect(() => {
        if (!room || !editor) return;

        const handleData = (payload, participant) => {
            if (participant.identity === localParticipant.identity) return;

            try {
                const data = JSON.parse(new TextDecoder().decode(payload));
                if (data.type === 'WB_UPDATE') {
                    // Apply remote changes to store
                    // store.mergeRemoteChanges(changes)
                    // Note: tldraw's mergeRemoteChanges expects specific format
                    // We might need to transform the raw 'changes' object back to what tldraw expects
                    // Or iterate and put.

                    const { added, updated, removed } = data.payload;

                    editor.store.mergeRemoteChanges(() => {
                        if (added) Object.values(added).forEach(r => editor.store.put([r]));
                        if (updated) Object.values(updated).forEach(r => editor.store.put([r[1]])); // [from, to]
                        if (removed) Object.values(removed).forEach(r => editor.store.remove([r.id]));
                    });
                }
            } catch (e) {
                console.error("WB Sync Error", e);
            }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [editor, room, localParticipant]);

    return null;
};

// --- Custom UI Components ---

const CustomToolbar = ({ onClose }) => {
    return (
        <div className="absolute top-4 right-4 z-[300] flex gap-2">
            <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 active:scale-95 transition-all"
            >
                <X size={20} />
            </button>
        </div>
    );
};

// UI Overrides to clean up the interface ("Zen Mode")
const uiOverrides = {
    actions: (editor, actions) => {
        // Remove unwanted actions if needed
        return actions;
    },
    tools: (editor, tools) => {
        // Customize tools
        return tools;
    },
};

export default Whiteboard;
