import React, { useEffect, useState, useCallback, Component } from 'react';
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';

// Error Boundary for tldraw
class WhiteboardErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Whiteboard Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
                    <div className="text-center p-8">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Whiteboard Error</h3>
                        <p className="text-gray-400 mb-4">Something went wrong loading the whiteboard.</p>
                        <button
                            onClick={this.props.onClose}
                            className="px-6 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                        >
                            Close
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * Professional Whiteboard powered by tldraw
 * Features: Infinite canvas, shapes, sticky notes, multiplayer sync
 */
const Whiteboard = ({ isOpen, onClose }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const [isLoaded, setIsLoaded] = useState(false);

    // Store persistence key (unique per session to avoid mixing rooms)
    const persistenceKey = room ? `whiteboard-${room.name}` : 'whiteboard-local';

    if (!isOpen) return null;

    return (
        <WhiteboardErrorBoundary onClose={onClose}>
            <div className="fixed inset-0 z-[60] animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" />

                {/* Main Editor Container */}
                <div className="absolute inset-0 flex flex-col">
                    <div className="relative w-full h-full bg-[#101011]">
                        {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#101011]">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            </div>
                        )}
                        <Tldraw
                            persistenceKey={persistenceKey}
                            hideUi={false}
                            overrides={uiOverrides}
                            components={{
                                HelpMenu: null,
                                MainMenu: null,
                                NavigationPanel: null,
                                DebugMenu: null,
                                PageMenu: null,
                                SharePanel: null,
                            }}
                            onMount={(editor) => {
                                setIsLoaded(true);
                                try {
                                    editor.user.updateUserPreferences({
                                        colorScheme: 'dark',
                                    });
                                } catch (e) {
                                    console.warn("Could not set dark mode:", e);
                                }
                            }}
                        >
                            <WhiteboardSync room={room} localParticipant={localParticipant} />
                            <CustomToolbar onClose={onClose} />
                        </Tldraw>
                    </div>
                </div>
            </div>
        </WhiteboardErrorBoundary>
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
