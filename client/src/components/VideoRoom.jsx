import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    LiveKitRoom,
    VideoConference,
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, AlertCircle, ChevronLeft, Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, MonitorUp, MonitorOff, PenTool, BarChart2, Users } from 'lucide-react';
import { getSessionToken } from '../api';
import VideoChat from './VideoChat';
import Whiteboard from './Whiteboard';
import LiveQuiz from './LiveQuiz';
import BreakoutSystem from './BreakoutSystem';
import ReactionSystem from './ReactionSystem';
import DesktopControls from './DesktopControls';
import MobileControls from './MobileControls';



/**
 * Inner Component - Consumes LiveKit Context
 * Handles Layout, Tools, and Filtering
 */
const VideoRoomContent = ({ onLeave, isTeacher }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Tools State
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isBreakoutOpen, setIsBreakoutOpen] = useState(false);
    const [breakoutFilter, setBreakoutFilter] = useState('ALL'); // 'ALL' or groupId

    // Track Filtering for Breakouts - NOW SAFE (Inside Context)
    const tracks = useTracks(
        [
            { source: "camera", withPlaceholder: true },
            { source: "screen_share", withPlaceholder: false },
        ]
    );

    // Better: Lift `visibleIdentities` state here
    const [visibleIdentities, setVisibleIdentities] = useState(null); // null = all

    const finalTracks = useMemo(() => {
        if (!visibleIdentities) return tracks;
        return tracks.filter(t => visibleIdentities.includes(t.participant.identity));
    }, [tracks, visibleIdentities]);

    return (
        <>
            {/* Standard or Filtered Grid */}
            <GridLayout tracks={finalTracks}>
                <ParticipantTile />
            </GridLayout>

            <RoomAudioRenderer />

            {/* Custom Overlay Controls */}
            {/* Custom Overlay Controls */}
            <DesktopControls
                onLeave={onLeave}
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
                isTeacher={isTeacher}
                toggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
                toggleQuiz={() => setIsQuizOpen(!isQuizOpen)}
                toggleBreakout={() => setIsBreakoutOpen(!isBreakoutOpen)}
            />

            <MobileControls
                onLeave={onLeave}
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
                isTeacher={isTeacher}
                toggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
                toggleQuiz={() => setIsQuizOpen(!isQuizOpen)}
                toggleBreakout={() => setIsBreakoutOpen(!isBreakoutOpen)}
            />

            {/* Overlays */}
            <VideoChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            <Whiteboard isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />
            <LiveQuiz isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />

            <BreakoutSystem
                isOpen={isBreakoutOpen}
                onClose={() => setIsBreakoutOpen(false)}
                isTeacher={isTeacher}
                setVisibleIdentities={setVisibleIdentities}
            />

            {/* Reactions & Engagement */}
            <ReactionSystem isTeacher={isTeacher} />
        </>
    );
};

/**
 * VideoRoom Component - Connects to Livekit for live video sessions
 */
const VideoRoom = ({ sessionId, sessionTitle, onLeave, isTeacher = false }) => {
    const [token, setToken] = useState("");
    const [serverUrl, setServerUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchToken();
    }, [sessionId]);

    const fetchToken = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSessionToken(sessionId);
            setToken(response.data.token);
            setServerUrl(response.data.server_url);
        } catch (err) {
            console.error('Failed to get session token:', err);
            setError(err.response?.data?.error || 'Failed to connect to video service');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#111]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-400">Connecting to secure room...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#111] p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
                <p className="text-zinc-400 text-center mb-6">{error}</p>
                <button
                    onClick={onLeave}
                    className="px-6 py-2 bg-zinc-800 text-white rounded-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#111]">
            {/* Custom Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-3">
                    <button
                        onClick={onLeave}
                        className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="font-bold text-white text-sm">{sessionTitle}</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-white/70">Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* LiveKit Room */}
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={serverUrl}
                connect={true}
                data-lk-theme="default"
                style={{ height: '100vh' }}
                onDisconnected={onLeave}
            >
                <VideoRoomContent onLeave={onLeave} isTeacher={isTeacher} />
            </LiveKitRoom>
        </div>
    );
};

export default VideoRoom;
