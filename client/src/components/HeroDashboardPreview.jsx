import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon, BookOpenIcon, ChatBubbleLeftRightIcon,
    ChartBarIcon, Cog6ToothIcon, BellIcon,
    SparklesIcon, PlusIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { CursorArrowRaysIcon } from '@heroicons/react/24/solid';

const HeroDashboardPreview = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [stats, setStats] = useState({ streak: 12, words: 843, accuracy: 94 });
    const [cursorPos, setCursorPos] = useState({ x: '50%', y: '50%' });
    const [cursorClick, setCursorClick] = useState(false);

    // Simulation Script
    useEffect(() => {
        const runSimulation = async () => {
            // Reset State
            setActiveTab('dashboard');
            setInputValue('');
            setIsGenerating(false);
            setShowResult(false);
            setShowToast(false);
            setStats({ streak: 12, words: 843, accuracy: 94 });
            setCursorPos({ x: '80%', y: '80%' }); // Start bottom right

            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // 1. Move to Sidebar "AI Generator" (using ChatBubble icon for demo)
            await wait(1000);
            setCursorPos({ x: '15%', y: '45%' }); // Approx sidebar location

            // 2. Click Sidebar
            await wait(1000);
            setCursorClick(true);
            await wait(200);
            setCursorClick(false);
            setActiveTab('ai-gen');

            // 3. Move to Input
            await wait(800);
            setCursorPos({ x: '50%', y: '40%' }); // Input field location

            // 4. Click Input
            await wait(500);
            setCursorClick(true);
            await wait(200);
            setCursorClick(false);

            // 5. Type "Serendipity"
            const word = "Serendipity";
            for (let i = 0; i <= word.length; i++) {
                setInputValue(word.slice(0, i));
                await wait(100 + Math.random() * 50);
            }

            // 6. Move to Generate Button
            await wait(500);
            setCursorPos({ x: '85%', y: '40%' }); // Button location

            // 7. Click Generate
            await wait(600);
            setCursorClick(true);
            await wait(200);
            setCursorClick(false);
            setIsGenerating(true);

            // 8. Generating Animation
            await wait(1500);
            setIsGenerating(false);
            setShowResult(true);

            // 9. Move to "Add to Library" (Simulated)
            await wait(1000);
            setCursorPos({ x: '85%', y: '75%' }); // Add button location

            // 10. Click Add
            await wait(500);
            setCursorClick(true);
            await wait(200);
            setCursorClick(false);
            setShowToast(true);

            // 11. Update Stats (Growth)
            await wait(500);
            setStats(prev => ({ ...prev, words: 844, accuracy: 95 }));

            // 12. Move back to Dashboard
            await wait(1500);
            setCursorPos({ x: '15%', y: '35%' }); // Dashboard link

            // 13. Click Dashboard
            await wait(800);
            setCursorClick(true);
            await wait(200);
            setCursorClick(false);
            setActiveTab('dashboard');
            setShowToast(false);

            // Loop
            await wait(3000);
            runSimulation();
        };

        runSimulation();
    }, []);

    return (
        <div className="relative w-full max-w-6xl mx-auto">
            {/* Main Window - Flat & Clean */}
            <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Mock Browser Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-4 bg-white border border-slate-200 rounded-md h-6 flex items-center px-3 text-xs text-slate-400 font-mono">
                        vocabmaster.app/dashboard
                    </div>
                </div>

                {/* App Layout */}
                <div className="flex h-[600px] bg-slate-50">
                    {/* Sidebar */}
                    <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col hidden md:flex">
                        <div className="flex items-center gap-2 mb-8 px-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">V</div>
                            <span className="font-bold text-slate-900 text-lg">VocabMaster</span>
                        </div>
                        <div className="space-y-1">
                            <SidebarItem icon={HomeIcon} label="Dashboard" active={activeTab === 'dashboard'} />
                            <SidebarItem icon={BookOpenIcon} label="My Library" />
                            <SidebarItem icon={SparklesIcon} label="AI Generator" active={activeTab === 'ai-gen'} />
                            <SidebarItem icon={ChartBarIcon} label="Analytics" />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        {/* Header */}
                        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                            <h2 className="font-bold text-slate-800 text-lg">
                                {activeTab === 'dashboard' ? 'Dashboard' : 'AI Word Generator'}
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">A</div>
                            </div>
                        </header>

                        {/* Dynamic Content */}
                        <div className="p-8 flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {activeTab === 'dashboard' ? (
                                    <DashboardView key="dashboard" stats={stats} />
                                ) : (
                                    <AIGeneratorView
                                        key="ai-gen"
                                        inputValue={inputValue}
                                        isGenerating={isGenerating}
                                        showResult={showResult}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Toast Notification */}
                            <AnimatePresence>
                                {showToast && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                                        className="absolute bottom-8 left-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50"
                                    >
                                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                        <span className="font-medium">Word added to library!</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Fake Cursor Overlay */}
                <motion.div
                    animate={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        scale: cursorClick ? 0.9 : 1
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 150,
                        damping: 25,
                        mass: 0.5
                    }}
                    className="absolute z-50 pointer-events-none -ml-3 -mt-3"
                >
                    <div className={`relative transition-transform duration-100 ${cursorClick ? 'scale-90' : ''}`}>
                        <CursorArrowRaysIcon className="w-8 h-8 text-slate-900 drop-shadow-xl" />
                        {cursorClick && (
                            <div className="absolute top-0 left-0 w-8 h-8 bg-slate-400/30 rounded-full animate-ping" />
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Sub-Components

const SidebarItem = ({ icon: Icon, label, active }) => (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>
        <Icon className="w-5 h-5" />
        {label}
    </div>
);

const DashboardView = ({ stats }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col"
    >
        <div className="grid grid-cols-3 gap-6 mb-8">
            <StatCard label="Daily Streak" value={`${stats.streak} Days`} color="orange" />
            <StatCard label="Words Learned" value={stats.words} color="indigo" />
            <StatCard label="Accuracy" value={`${stats.accuracy}%`} color="green" />
        </div>
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Learning Progress</h3>
            <div className="h-48 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 90, stats.words > 843 ? 95 : 70].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex-1 rounded-t-lg ${i === 6 ? 'bg-indigo-500' : 'bg-indigo-100'}`}
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

const AIGeneratorView = ({ inputValue, isGenerating, showResult }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="h-full flex flex-col max-w-2xl mx-auto justify-center"
    >
        <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">What do you want to learn?</h3>
            <p className="text-slate-500">Enter a word, topic, or phrase.</p>
        </div>

        <div className="relative mb-8">
            <div className="w-full h-14 bg-white border border-slate-300 rounded-xl px-4 flex items-center shadow-sm">
                <span className="text-lg text-slate-800">{inputValue}</span>
                {inputValue.length < 11 && <span className="w-0.5 h-6 bg-indigo-500 animate-pulse ml-1" />}
            </div>
            <div className="absolute top-2 right-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                {isGenerating ? <SparklesIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                Generate
            </div>
        </div>

        <AnimatePresence>
            {showResult && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-lg"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-3xl font-bold text-slate-900 mb-1">Serendipity</h4>
                            <span className="text-slate-500 italic">noun • /ˌser.ənˈdɪp.ə.ti/</span>
                        </div>
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">C2 Advanced</div>
                    </div>
                    <p className="text-slate-700 text-lg leading-relaxed mb-6">
                        The occurrence and development of events by chance in a happy or beneficial way.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                        <p className="text-slate-600 italic">"We found the perfect restaurant by pure <span className="font-bold text-indigo-600">serendipity</span>."</p>
                    </div>
                    <div className="flex justify-end">
                        <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                            <PlusIcon className="w-4 h-4" />
                            Add to Library
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

const StatCard = ({ label, value, color }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className={`text-${color}-500 text-xs font-bold uppercase tracking-wider mb-1`}>{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
);

export default HeroDashboardPreview;
