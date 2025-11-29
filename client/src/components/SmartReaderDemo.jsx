import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBarIcon, BookOpenIcon, BoltIcon } from '@heroicons/react/24/solid';

const DEMO_TEXT = "The serendipity of finding a quiet café in the bustling city was a welcome respite. The aroma of freshly ground beans permeated the air, creating an ephemeral moment of peace.";

const ANALYZED_WORDS = [
    { word: "serendipity", type: "noun", level: "C2", color: "text-purple-600", bg: "bg-purple-100" },
    { word: "bustling", type: "adj", level: "B2", color: "text-blue-600", bg: "bg-blue-100" },
    { word: "respite", type: "noun", level: "C1", color: "text-green-600", bg: "bg-green-100" },
    { word: "permeated", type: "verb", level: "C2", color: "text-red-600", bg: "bg-red-100" },
    { word: "ephemeral", type: "adj", level: "C2", color: "text-orange-600", bg: "bg-orange-100" },
];

const SmartReaderDemo = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);

    useEffect(() => {
        const loop = setInterval(() => {
            resetDemo();
        }, 8000);

        resetDemo(); // Start immediately

        return () => clearInterval(loop);
    }, []);

    const resetDemo = () => {
        setIsScanning(false);
        setScanned(false);
        setStatsVisible(false);

        // Start Scan
        setTimeout(() => setIsScanning(true), 1000);

        // End Scan & Show Results
        setTimeout(() => {
            setIsScanning(false);
            setScanned(true);
        }, 3000);

        // Show Stats
        setTimeout(() => setStatsVisible(true), 3500);
    };



    return (
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-700 text-sm">Smart Reader</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1 relative">
                <p className="text-lg leading-relaxed text-slate-700 font-serif">
                    {scanned ? (
                        <>
                            The <span className="px-1 rounded font-bold text-purple-600 bg-purple-100">serendipity</span> of finding a quiet café in the <span className="px-1 rounded font-bold text-blue-600 bg-blue-100">bustling</span> city was a welcome <span className="px-1 rounded font-bold text-green-600 bg-green-100">respite</span>. The aroma of freshly ground beans <span className="px-1 rounded font-bold text-red-600 bg-red-100">permeated</span> the air, creating an <span className="px-1 rounded font-bold text-orange-600 bg-orange-100">ephemeral</span> moment of peace.
                        </>
                    ) : (
                        DEMO_TEXT
                    )}
                </p>

                {/* Scanning Beam */}
                {isScanning && (
                    <motion.div
                        initial={{ top: 0, opacity: 0 }}
                        animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2, ease: "linear" }}
                        className="absolute left-0 right-0 h-12 bg-gradient-to-b from-indigo-500/20 to-transparent border-t-2 border-indigo-500 pointer-events-none z-10"
                    />
                )}
            </div>

            {/* Stats Card (Popup) */}
            <AnimatePresence>
                {statsVisible && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-4 right-4 left-4 bg-slate-900 text-white p-4 rounded-xl shadow-xl z-20"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                    <BoltIcon className="w-5 h-5 text-yellow-400" />
                                    Analysis Complete
                                </h4>
                                <p className="text-slate-400 text-xs">Readability: C1 (Advanced)</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-indigo-400">85%</div>
                                <div className="text-[10px] uppercase tracking-wide text-slate-500">Known Words</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-800 p-2 rounded text-center">
                                <div className="text-xs text-slate-500">New Words</div>
                                <div className="font-bold text-white">5</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded text-center">
                                <div className="text-xs text-slate-500">Idioms</div>
                                <div className="font-bold text-white">2</div>
                            </div>
                            <div className="bg-slate-800 p-2 rounded text-center">
                                <div className="text-xs text-slate-500">Time</div>
                                <div className="font-bold text-white">45s</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartReaderDemo;
