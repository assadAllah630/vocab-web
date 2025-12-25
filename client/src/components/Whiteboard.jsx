import React, { useEffect, useState, useCallback, useRef, Component } from 'react';
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { Excalidraw, MainMenu, WelcomeScreen, Sidebar, Footer, LiveCollaborationTrigger } from "@excalidraw/excalidraw";
import { X, AlertCircle, Loader2 } from 'lucide-react';

// Error Boundary for Excalidraw
class WhiteboardErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Excalidraw Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
                    <div className="text-center p-8">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Whiteboard Error</h3>
                        <p className="text-gray-400 mb-4">Excalidraw failed to load.</p>
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
 * Professional Whiteboard powered by Excalidraw (100% FREE & Open Source)
 * Features: Infinite canvas, hand-drawn style, real-time collaboration
 */
const Whiteboard = ({ isOpen, onClose, isTeacher }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Sync state tracking
    const lastVersionRef = useRef(0);

    // --- BROADCAST LOGIC ---
    const broadcastUpdate = useCallback((elements, appState) => {
        if (!isOpen || !room || !localParticipant) return;

        const op = JSON.stringify({
            type: 'WB_SYNC',
            elements,
            appState: {
                viewBackgroundColor: appState.viewBackgroundColor,
                gridSize: appState.gridSize,
            }
        });

        room.localParticipant.publishData(
            new TextEncoder().encode(op),
            { kind: DataPacket_Kind.RELIABLE }
        );
    }, [isOpen, room, localParticipant]);

    // --- RECEIVE LOGIC ---
    useEffect(() => {
        if (!isOpen || !room || !excalidrawAPI) return;

        const handleData = (payload, participant) => {
            if (participant.identity === localParticipant.identity) return;

            try {
                const data = JSON.parse(new TextDecoder().decode(payload));
                if (data.type === 'WB_SYNC') {
                    excalidrawAPI.updateScene({
                        elements: data.elements,
                        appState: data.appState,
                        commitToHistory: false
                    });
                }
            } catch (e) { }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [isOpen, room, excalidrawAPI, localParticipant]);

    if (!isOpen) return null;

    return (
        <WhiteboardErrorBoundary onClose={onClose}>
            <div className="fixed inset-0 z-[60] animate-in fade-in duration-200 flex flex-col pt-16">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" />

                {/* Main Editor Container */}
                <div className="flex-grow w-full h-[calc(100dvh-64px)] relative bg-[#191919] border-t border-white/10 overflow-hidden">
                    <div className="w-full h-full">
                        <Excalidraw
                            excalidrawAPI={(api) => {
                                setExcalidrawAPI(api);
                                setIsLoaded(true);
                            }}
                            theme="dark"
                            onChange={(elements, appState) => {
                                // Only broadcast if it's a "real" change (v > lastV)
                                // Excalidraw elements have versions
                                const currentVersion = elements.reduce((acc, el) => acc + el.version, 0);
                                if (currentVersion > lastVersionRef.current) {
                                    lastVersionRef.current = currentVersion;
                                    broadcastUpdate(elements, appState);
                                }
                            }}
                        >
                            <MainMenu>
                                <MainMenu.DefaultItems.SaveAsImage />
                                <MainMenu.DefaultItems.ClearCanvas />
                                <MainMenu.Separator />
                                <MainMenu.DefaultItems.ChangeCanvasBackground />
                            </MainMenu>
                            <WelcomeScreen />
                        </Excalidraw>
                    </div>

                    {/* Custom Close Button (Top Right) */}
                    <div className="absolute top-4 right-4 z-[1000]">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 active:scale-95 transition-all shadow-xl backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </WhiteboardErrorBoundary>
    );
};

export default Whiteboard;
