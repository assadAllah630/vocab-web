import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    MessageSquare, MoreVertical, Hand,
    MonitorUp, MonitorOff, PenTool, BarChart2, Users,
    X, Settings
} from 'lucide-react';
import { useLocalParticipant, useMediaDeviceSelect } from "@livekit/components-react"; // Updated import

/**
 * MobileControls - Premium Glassmorphism UI for Mobile
 */
const MobileControls = ({
    onLeave,
    isChatOpen,
    setIsChatOpen,
    toggleWhiteboard,
    toggleQuiz,
    toggleBreakout
}) => {
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [view, setView] = useState('main'); // 'main' | 'settings'

    // Reset view when closing
    React.useEffect(() => {
        if (!isMoreOpen) setView('main');
    }, [isMoreOpen]);

    // Haptic helper
    const vibrate = () => {
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const toggleMic = async () => {
        vibrate();
        if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        }
    };

    const toggleCam = async () => {
        vibrate();
        if (localParticipant) {
            await localParticipant.setCameraEnabled(!isCameraEnabled);
        }
    };

    const toggleHand = () => {
        vibrate();
        // TODO: Connect to actual LiveKit metadata/ReactionSystem if needed
        // For now, local state visual feedback
        setIsHandRaised(!isHandRaised);
    };

    const toggleScreenShare = async () => {
        vibrate();
        if (localParticipant) {
            try {
                await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: false });
                setIsMoreOpen(false);
            } catch (e) {
                console.error("Error toggling screen share:", e);
            }
        }
    };

    const handleChatToggle = () => {
        vibrate();
        setIsChatOpen(!isChatOpen);
    };

    const handleMoreToggle = () => {
        vibrate();
        setIsMoreOpen(true);
    };

    return (
        <>
            {/* Bottom Glass Capsule */}
            <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
                <div className="h-16 bg-black/80 backdrop-blur-2xl rounded-full flex justify-between items-center px-1 border border-white/10 shadow-2xl safe-area-bottom">

                    <ControlButton
                        icon={isMicrophoneEnabled ? Mic : MicOff}
                        isActive={isMicrophoneEnabled}
                        label="Mic"
                        onClick={toggleMic}
                        activeColor="bg-white/10 text-white"
                        inactiveColor="bg-red-500/20 text-red-500"
                    />

                    <ControlButton
                        icon={isCameraEnabled ? Video : VideoOff}
                        isActive={isCameraEnabled}
                        label="Cam"
                        onClick={toggleCam}
                        activeColor="bg-white/10 text-white"
                        inactiveColor="bg-red-500/20 text-red-500"
                    />

                    <ControlButton
                        icon={Hand}
                        isActive={isHandRaised}
                        label="Raise"
                        onClick={toggleHand}
                        activeColor="bg-yellow-500/20 text-yellow-500"
                        inactiveColor="bg-transparent text-white/70"
                    />

                    <ControlButton
                        icon={MessageSquare}
                        isActive={isChatOpen}
                        label="Chat"
                        onClick={handleChatToggle}
                        activeColor="bg-indigo-500/20 text-indigo-400"
                        inactiveColor="bg-transparent text-white/70"
                    />

                    <ControlButton
                        icon={MoreVertical}
                        isActive={false}
                        label="More"
                        onClick={handleMoreToggle}
                    />

                    <button
                        onClick={() => { vibrate(); onLeave(); }}
                        className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/40 active:scale-90 transition-transform ml-1"
                    >
                        <PhoneOff size={20} />
                    </button>
                </div>
            </div>

            {/* "More" Bottom Sheet Overlay */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#18181b] border-t border-white/10 rounded-t-3xl p-6 md:hidden max-h-[80vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                            {view === 'main' ? (
                                <>
                                    <div className="grid grid-cols-4 gap-4 mb-8">
                                        <SheetItem
                                            icon={PenTool}
                                            label="Whiteboard"
                                            onClick={() => { vibrate(); toggleWhiteboard(); setIsMoreOpen(false); }}
                                            color="bg-purple-500/20 text-purple-400"
                                        />
                                        <SheetItem
                                            icon={BarChart2}
                                            label="Quiz"
                                            onClick={() => { vibrate(); toggleQuiz(); setIsMoreOpen(false); }}
                                            color="bg-emerald-500/20 text-emerald-400"
                                        />
                                        <SheetItem
                                            icon={Users}
                                            label="Breakout"
                                            onClick={() => { vibrate(); toggleBreakout(); setIsMoreOpen(false); }}
                                            color="bg-blue-500/20 text-blue-400"
                                        />
                                        <SheetItem
                                            icon={isScreenShareEnabled ? MonitorOff : MonitorUp}
                                            label={isScreenShareEnabled ? "Stop Share" : "Share"}
                                            onClick={toggleScreenShare}
                                            color={isScreenShareEnabled ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}
                                        />
                                    </div>

                                    <button
                                        onClick={() => { vibrate(); setView('settings'); }}
                                        className="w-full py-4 rounded-xl bg-white/5 text-white font-medium flex items-center justify-center gap-2 active:bg-white/10"
                                    >
                                        <Settings size={20} />
                                        Audio & Video Settings
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <button
                                            onClick={() => setView('main')}
                                            className="p-2 -ml-2 rounded-full active:bg-white/10"
                                        >
                                            <X size={20} className="text-white/70" />
                                        </button>
                                        <h3 className="text-lg font-semibold text-white">Device Settings</h3>
                                    </div>

                                    <DeviceSelector kind="audioinput" label="Microphone" icon={Mic} />
                                    <DeviceSelector kind="videoinput" label="Camera" icon={Video} />
                                    <DeviceSelector kind="audiooutput" label="Speaker" icon={MoreVertical} />
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

const DeviceSelector = ({ kind, label, icon: Icon }) => {
    const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wider">
                <Icon size={14} />
                {label}
            </div>
            <div className="space-y-2">
                {devices.map((device) => (
                    <button
                        key={device.deviceId}
                        onClick={() => setActiveMediaDevice(device.deviceId)}
                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${activeDeviceId === device.deviceId
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-white/5 text-white/80 border border-transparent active:bg-white/10'
                            }`}
                    >
                        <span className="truncate text-sm">{device.label || `${label} ${device.deviceId.slice(0, 4)}...`}</span>
                        {activeDeviceId === device.deviceId && (
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ControlButton = ({ icon: Icon, isActive, onClick, activeColor, inactiveColor = "bg-transparent text-white/70" }) => (
    <button
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isActive ? activeColor : inactiveColor}`}
    >
        <Icon size={22} strokeWidth={2} />
    </button>
);

const SheetItem = ({ icon: Icon, label, onClick, color }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform active:scale-95 group-active:scale-95`}>
            <Icon size={26} />
        </div>
        <span className="text-xs text-white/60 font-medium">{label}</span>
    </button>
);

export default MobileControls;
