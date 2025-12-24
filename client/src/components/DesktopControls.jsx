import React from 'react';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    MessageSquare, MonitorUp, MonitorOff,
    PenTool, BarChart2, Users, Hand
} from 'lucide-react';
import { useLocalParticipant } from "@livekit/components-react";

/**
 * DesktopControls - Desktop specific controls for the video room
 */
const DesktopControls = ({
    onLeave,
    isChatOpen,
    setIsChatOpen,
    isTeacher = false,
    toggleWhiteboard,
    toggleQuiz,
    toggleBreakout,
    isHandRaised,
    toggleHand
}) => {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

    const toggleMic = async () => {
        if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        }
    };

    const toggleCam = async () => {
        if (localParticipant) {
            await localParticipant.setCameraEnabled(!isCameraEnabled);
        }
    };

    const toggleScreenShare = () => {
        if (localParticipant) {
            localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: false })
                .catch(e => console.error("Error toggling screen share:", e));
        }
    };

    return (
        <div className="fixed bottom-8 left-0 right-0 z-50 hidden md:flex justify-center items-center gap-6 pointer-events-none">
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto">

                {/* Hand Raise */}
                <button
                    onClick={toggleHand}
                    className={`p-4 rounded-full transition-all ${isHandRaised ? 'bg-yellow-500 text-black animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    title={isHandRaised ? "Lower Hand" : "Raise Hand"}
                >
                    <Hand size={24} className={isHandRaised ? "fill-current" : ""} />
                </button>

                <div className="h-8 w-[1px] bg-white/10 mx-2" />

                <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all ${isMicrophoneEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    title={isMicrophoneEnabled ? "Mute" : "Unmute"}
                >
                    {isMicrophoneEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                <button
                    onClick={toggleCam}
                    className={`p-4 rounded-full transition-all ${isCameraEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                    {isCameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>

                {/* Screen Share - Teacher only */}
                {isTeacher && (
                    <button
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-full transition-all ${isScreenShareEnabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 hover:bg-white/10 text-white'}`}
                        title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
                    >
                        {isScreenShareEnabled ? <MonitorOff size={24} /> : <MonitorUp size={24} />}
                    </button>
                )}

                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`p-4 rounded-full transition-all ${isChatOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    title="Chat"
                >
                    <MessageSquare size={24} />
                </button>

                {/* Teacher-only Classroom Tools */}
                {isTeacher && (
                    <>
                        <div className="h-8 w-[1px] bg-white/10 mx-2" />

                        <button
                            onClick={toggleWhiteboard}
                            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-indigo-300"
                            title="Open Whiteboard"
                        >
                            <PenTool size={24} />
                        </button>

                        <button
                            onClick={toggleQuiz}
                            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-indigo-300"
                            title="Live Quiz / Exam"
                        >
                            <BarChart2 size={24} />
                        </button>

                        <button
                            onClick={toggleBreakout}
                            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-indigo-300"
                            title="Breakout Groups"
                        >
                            <Users size={24} />
                        </button>
                    </>
                )}

                <div className="h-8 w-[1px] bg-white/10 mx-2" />

                <button
                    onClick={onLeave}
                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/40"
                    title="End Call"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};

export default DesktopControls;
