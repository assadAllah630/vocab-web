import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

const PodcastDemo = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + 0.5;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800 max-w-md w-full mx-auto relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                            <SpeakerWaveIcon className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Daily German Briefing</h3>
                            <p className="text-slate-400 text-xs">Episode 1 • 5 min</p>
                        </div>
                    </div>
                </div>

                {/* Visualizer */}
                <div className="h-24 flex items-center justify-center gap-0.5 sm:gap-1 mb-6">
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                height: isPlaying ? [10, 20 + (i % 5) * 8, 10] : 10,
                                opacity: isPlaying ? 1 : 0.3
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                delay: i * 0.05,
                                ease: "easeInOut"
                            }}
                            className="w-1 sm:w-1.5 bg-gradient-to-t from-rose-600 to-rose-400 rounded-full"
                            style={{ height: '10px' }}
                        />
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-12 h-12 rounded-full bg-white text-rose-600 flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-1" />}
                    </button>
                    <div className="flex-1">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-rose-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                        0:{Math.floor(progress / 100 * 30).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PodcastDemo;
