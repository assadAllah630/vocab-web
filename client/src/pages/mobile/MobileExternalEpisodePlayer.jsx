import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api, { getProxyUrl } from '../../api';
import MobileMarkdownRenderer from '../../components/mobile/MobileMarkdownRenderer';
import AudioVisualizer from '../../components/mobile/AudioVisualizer';
import {
    ChevronLeft, Play, Pause, RotateCcw, RotateCw,
    Volume2, VolumeX, Wifi, AlertCircle, FileText, ExternalLink, Sparkles, Wand2,
    Maximize2, Minimize2, ChevronDown, Heart, Bookmark, MoreHorizontal,
    Download, Trash2, Loader2, Check
} from 'lucide-react';
import OfflineStorage from '../../services/OfflineStorage';

const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 2.0];

function MobileExternalEpisodePlayer() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const audioRef = useRef(null);

    const { episode, podcast } = location.state || {}; // Expecting episode/podcast in state

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [isFullScreenSheet, setIsFullScreenSheet] = useState(false);
    const [isScraping, setIsScraping] = useState(false);
    const [isFormatting, setIsFormatting] = useState(false);
    const [showFormatPrompt, setShowFormatPrompt] = useState(false);
    const [isLiked, setIsLiked] = useState(episode?.is_liked || false);
    const [isSaved, setIsSaved] = useState(episode?.is_saved || false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [localAudioUrl, setLocalAudioUrl] = useState(null);

    // Check offline status on mount
    useEffect(() => {
        const checkOffline = async () => {
            if (episode?.id) {
                const downloaded = await OfflineStorage.isDownloaded(episode.id);
                setIsDownloaded(downloaded);
                if (downloaded) {
                    const url = await OfflineStorage.getEpisodeUrl(episode.id);
                    if (url) {
                        setLocalAudioUrl(url);
                        console.log("Using offline audio source");
                    }
                }
            }
        };
        checkOffline();
    }, [episode?.id]);

    const handleDownload = async () => {
        if (!episode || isDownloading) return;
        setIsDownloading(true);
        try {
            const success = await OfflineStorage.saveEpisode(episode, episode.audio_url);
            if (success) {
                setIsDownloaded(true);
                const url = await OfflineStorage.getEpisodeUrl(episode.id);
                setLocalAudioUrl(url);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!episode) return;
        try {
            await OfflineStorage.deleteEpisode(episode.id);
            setIsDownloaded(false);
            setLocalAudioUrl(null);
        } catch (e) {
            console.error(e);
        }
    };

    // Initial transcript check
    const [transcriptText, setTranscriptText] = useState(
        episode?.transcript || episode?.description || ''
    );

    const toggleLike = async () => {
        try {
            const res = await api.post(`external-episodes/${episode?.id}/like/`);
            setIsLiked(res.data.is_liked);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSave = async () => {
        try {
            const res = await api.post(`external-episodes/${episode?.id}/save/`);
            setIsSaved(res.data.is_saved);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSmartScrape = async () => {
        if (!episode?.id || !episode?.link) return;
        setIsScraping(true);
        try {
            const res = await api.post(`external-episodes/${id}/scrape_transcript/`, {
                url: episode.link
            });
            if (res.data.transcript) {
                setTranscriptText(res.data.transcript);
                if (episode) episode.transcript = res.data.transcript;
                setShowFormatPrompt(true);
            }
        } catch (err) {
            console.error('Scrape failed:', err);
        } finally {
            setIsScraping(false);
        }
    };

    const handleAIFormat = async () => {
        if (!transcriptText || isFormatting) return;
        setIsFormatting(true);
        try {
            const response = await api.post('convert-text/', {
                text: transcriptText,
                source_type: 'podcast'
            }, { timeout: 60000 });

            if (response.data.success && response.data.markdown) {
                const formattedText = response.data.markdown;
                setTranscriptText(formattedText);
                try {
                    await api.post(`external-episodes/${episode.id}/update_transcript/`, {
                        transcript: formattedText
                    });
                } catch (saveErr) { console.error('Failed to save', saveErr); }
            }
        } catch (err) {
            console.error('AI Formatting failed:', err);
        } finally {
            setIsFormatting(false);
        }
    };

    // Audio handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Reset state when source changes
        setLoading(true);
        setError(null);

        const handleLoadedMetadata = () => {
            const d = audio.duration;
            setDuration(Number.isFinite(d) ? d : 0);
            setLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setLoading(false); // Ensure spinner stops if playing
        };

        const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
        const handleWaiting = () => setLoading(true);
        const handleCanPlay = () => setLoading(false);
        const handleError = (e) => {
            console.error("Audio error:", e);
            // Don't show error immediately for minor network glitches, but stop spinner
            setLoading(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        // Immediate check for race conditions
        if (audio.readyState >= 1) { // HAVE_METADATA
            handleLoadedMetadata();
        }
        if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
            setLoading(false);
        }

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [episode?.audio_url, localAudioUrl]); // Re-run if source changes
    // ... existing code ...

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(e => { console.error("Play failed", e); setError("Playback failed"); });
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const seek = useCallback((seconds) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
    }, [duration]);

    const handleProgressClick = useCallback((e) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const percentage = x / bounds.width;
        audio.currentTime = percentage * duration;
    }, [duration]);

    const cyclePlaybackRate = useCallback(() => {
        const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
        const nextIdx = (currentIdx + 1) % PLAYBACK_RATES.length;
        const newRate = PLAYBACK_RATES[nextIdx];
        setPlaybackRate(newRate);
        if (audioRef.current) audioRef.current.playbackRate = newRate;
    }, [playbackRate]);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds) || !Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!episode) return <div className="text-white p-10">Episode not found</div>;

    // Determine artwork URL for background
    const artworkUrl = episode.image_url || podcast?.artwork_url || '/podcast-placeholder.png';
    const proxyArtwork = getProxyUrl(artworkUrl);

    // Use Portal to break out of MobileLayout z-index constraints
    return createPortal(
        <div className="fixed inset-0 !z-[99999] overflow-hidden flex flex-col bg-black text-white font-sans">
            {/* 
              GLASSMORPHISM BACKGROUND 
              - Huge blurred image
              - Gradient overlay for text legibility
            */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-110"
                    style={{
                        backgroundImage: `url(${proxyArtwork})`,
                        filter: 'blur(80px) brightness(0.6)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
            </div>

            {/* Hidden Audio */}
            {/* Hidden Audio */}
            <audio ref={audioRef} src={localAudioUrl || episode.audio_url} preload="metadata" />

            {/* HEADER */}
            <div className="relative z-10 px-6 pt-12 pb-2 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition">
                    <ChevronLeft size={22} className="text-white" />
                </button>
                <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    {localAudioUrl ? (
                        <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-medium tracking-wide text-white/80 uppercase">Offline Ready</span>
                        </>
                    ) : (
                        <>
                            <Wifi size={12} className="text-green-400 animate-pulse" />
                            <span className="text-[10px] font-medium tracking-wide text-white/80 uppercase">Streaming</span>
                        </>
                    )}
                </div>
                <button className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition">
                    <MoreHorizontal size={22} className="text-white" />
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 pb-2">

                {/* Artwork Card with Shadow */}
                <div className="relative w-full aspect-square max-h-[350px] mb-8 group">
                    <div className="absolute inset-0 bg-indigo-500/30 rounded-3xl blur-2xl group-hover:bg-indigo-500/50 transition-all duration-500" />
                    <img
                        src={proxyArtwork}
                        alt="Artwork"
                        className="relative w-full h-full object-cover rounded-3xl shadow-2xl border border-white/10"
                        onError={(e) => { e.target.src = '/podcast-placeholder.png'; }}
                    />
                </div>

                {/* Metadata */}
                <div className="text-center w-full max-w-sm space-y-1 mb-2">
                    <h1 className="text-2xl font-bold leading-tight text-white line-clamp-2 drop-shadow-md">
                        {episode.title}
                    </h1>
                    <p className="text-base text-white/70 font-medium truncate">
                        {podcast?.name || 'Unknown Podcast'}
                    </p>
                </div>

                {/* VISUALIZER (Siri Waves) */}
                <div className="w-full h-24 mt-2 flex items-center justify-center overflow-hidden opacity-90">
                    <AudioVisualizer isPlaying={isPlaying} />
                </div>
            </div>

            {/* CONTROLS AREA (Glass Sheet) */}
            <div className="relative z-20 pb-12 px-6 pt-6 bg-gradient-to-t from-black via-black/90 to-transparent">

                {/* Progress Bar */}
                <div className="mb-8 group">
                    <div
                        className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-hidden relative"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="h-full bg-white rounded-full relative transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `${(duration ? (currentTime / duration) * 100 : 0)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-white/50 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-around mb-8 max-w-sm mx-auto w-full">
                    {/* Like Toggle */}
                    <button onClick={toggleLike} className="p-3 transition hover:scale-110">
                        <Heart size={24} className={`transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/60'}`} />
                    </button>

                    {/* Rewind */}
                    <button onClick={() => seek(-15)} className="p-4 rounded-full hover:bg-white/5 transition hover:scale-105">
                        <RotateCcw size={28} className="text-white" />
                    </button>

                    {/* Play/Pause (Big Glass Button) */}
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-300"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={32} fill="currentColor" />
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </button>

                    {/* Forward */}
                    <button onClick={() => seek(30)} className="p-4 rounded-full hover:bg-white/5 transition hover:scale-105">
                        <RotateCw size={28} className="text-white" />
                    </button>

                    {/* Save Toggle */}
                    <button onClick={toggleSave} className="p-3 transition hover:scale-110">
                        <Bookmark size={24} className={`transition-colors ${isSaved ? 'text-indigo-400 fill-indigo-400' : 'text-white/60'}`} />
                    </button>
                </div>

                {/* Secondary Controls (Speed, Info) */}
                <div className="flex items-center justify-center gap-8">
                    <button
                        onClick={cyclePlaybackRate}
                        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
                    >
                        {playbackRate}x
                    </button>

                    {/* Download Button */}
                    {isDownloaded ? (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                            <Trash2 size={16} />
                            <span className="text-xs font-semibold">Downloaded</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition border ${isDownloading
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                : 'bg-white/10 border-white/5 text-white/70 hover:bg-white/20'
                                }`}
                        >
                            {isDownloading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            <span className="text-xs font-semibold">
                                {isDownloading ? 'Downloading...' : 'Download'}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition border ${showInfo
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                            : 'bg-white/10 border-white/5 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        <FileText size={16} />
                        <span className="text-xs font-semibold">Transcript</span>
                    </button>
                </div>
            </div>

            {/* Transcript Sheet (Overlay) */}
            {showInfo && (
                <div
                    className={`fixed inset-x-0 bottom-0 z-50 bg-[#121214] rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col border-t border-white/10 ${isFullScreenSheet ? 'h-full rounded-none' : 'h-[70vh]'
                        }`}
                >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm">
                        <h3 className="font-bold text-lg text-white">Transcript</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setIsFullScreenSheet(!isFullScreenSheet)} className="p-2 bg-white/10 rounded-full">
                                {isFullScreenSheet ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                            <button onClick={() => setShowInfo(false)} className="p-2 bg-white/10 rounded-full">
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <MobileMarkdownRenderer content={transcriptText || 'No transcript available.'} />

                        {/* Auto-Format Prompt */}
                        {showFormatPrompt && !isFormatting && (
                            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10">
                                <p className="text-sm text-indigo-200 mb-3 font-medium">✨ Enhance this transcript with AI?</p>
                                <button onClick={handleAIFormat} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition">
                                    Auto-Format (AI)
                                </button>
                            </div>
                        )}

                        {/* Scrape Button */}
                        {episode.link && (
                            <div className="mt-8 space-y-3">
                                <button
                                    onClick={handleSmartScrape}
                                    disabled={isScraping}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium text-sm hover:bg-white/10 transition flex items-center justify-center gap-2"
                                >
                                    {isScraping ? <Sparkles className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                    {isScraping ? 'Extracting...' : 'Extract from Web'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}

export default MobileExternalEpisodePlayer;
