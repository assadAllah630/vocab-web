import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon, BookOpenIcon, UserCircleIcon,
    ChartBarIcon, BoltIcon, CheckCircleIcon,
    FireIcon, TrophyIcon
} from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const MobileHeroDashboardPreview = () => {
    const [screen, setScreen] = useState('dashboard'); // dashboard, quiz, success
    const [streak, setStreak] = useState(12);
    const [touchPos, setTouchPos] = useState({ x: '50%', y: '50%' });
    const [isTouching, setIsTouching] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    // Simulation Loop
    useEffect(() => {
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            // Reset
            setScreen('dashboard');
            setStreak(12);
            setSelectedOption(null);
            setTouchPos({ x: '80%', y: '80%' }); // Start somewhere neutral

            // 1. Idle on Dashboard
            await wait(1500);

            // 2. Move to "Continue Learning" button
            setTouchPos({ x: '50%', y: '45%' }); // Approx button location
            await wait(1000);

            // 3. Tap Button
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);
            setScreen('quiz');

            // 4. Quiz Screen - Read Question
            await wait(1500);

            // 5. Move to Correct Option (Option B: Short-lived)
            setTouchPos({ x: '50%', y: '55%' }); // Option B location
            await wait(1000);

            // 6. Tap Option
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);
            setSelectedOption('Short-lived');

            // 7. Success & Transition
            await wait(500);
            setScreen('success');

            // 8. Move to "Continue" on Success Screen
            await wait(1000);
            setTouchPos({ x: '50%', y: '85%' });
            await wait(1000);

            // 9. Tap Continue
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);
            setStreak(13);
            setScreen('dashboard');

            // 10. Loop
            await wait(3000);
            runSimulation();
        };

        runSimulation();
    }, []);

    return (
        <div className="relative w-[300px] h-[600px] mx-auto bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden select-none">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 w-full h-8 bg-slate-900/90 backdrop-blur-md z-20 flex justify-between items-center px-6 pt-2">
                <span className="text-[10px] font-bold text-white">9:41</span>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                    <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
            </div>

            {/* App Content */}
            <div className="w-full h-full bg-slate-50 relative pt-8 pb-16">
                <AnimatePresence mode="wait">
                    {screen === 'dashboard' && (
                        <DashboardScreen key="dashboard" streak={streak} />
                    )}
                    {screen === 'quiz' && (
                        <QuizScreen key="quiz" selectedOption={selectedOption} />
                    )}
                    {screen === 'success' && (
                        <SuccessScreen key="success" />
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 w-full h-16 bg-white border-t border-slate-100 flex justify-around items-center px-2 z-20">
                <NavIcon icon={HomeIcon} active={screen === 'dashboard'} />
                <NavIcon icon={BookOpenIcon} />
                <NavIcon icon={ChartBarIcon} />
                <NavIcon icon={UserCircleIcon} />
            </div>

            {/* Touch Simulator */}
            <motion.div
                className="absolute z-50 pointer-events-none"
                animate={{
                    left: touchPos.x,
                    top: touchPos.y,
                    scale: isTouching ? 0.8 : 1
                }}
                transition={{
                    left: { duration: 1, ease: "easeInOut" },
                    top: { duration: 1, ease: "easeInOut" },
                    scale: { duration: 0.1 }
                }}
            >
                <div className={`w-12 h-12 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-sm shadow-xl flex items-center justify-center transition-colors ${isTouching ? 'bg-white/40' : ''}`}>
                    <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                </div>
            </motion.div>
        </div>
    );
};

// Sub-components

const DashboardScreen = ({ streak }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 h-full flex flex-col"
    >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                <span className="font-bold text-slate-900">VocabMaster</span>
            </div>
            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                <FireIcon className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-600">{streak}</span>
            </div>
        </div>

        {/* Daily Goal Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h2 className="text-lg font-bold mb-1 relative z-10">Daily Goal</h2>
            <p className="text-indigo-100 text-xs mb-4 relative z-10">Keep your streak alive!</p>
            <div className="flex items-center gap-3 relative z-10">
                <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-white rounded-full"></div>
                </div>
                <span className="text-xs font-bold">15/20</span>
            </div>
        </div>

        {/* Continue Learning */}
        <h3 className="font-bold text-slate-800 mb-3">Continue Learning</h3>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <BookOpenIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">Unit 3: Synonyms</h4>
                <p className="text-xs text-slate-500">Lesson 2 • 5 min</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <ChevronRightIcon className="w-4 h-4" />
            </div>
        </div>
    </motion.div>
);

const QuizScreen = ({ selectedOption }) => {
    const options = [
        { id: 'Lasting', label: 'Lasting' },
        { id: 'Short-lived', label: 'Short-lived' },
        { id: 'Heavy', label: 'Heavy' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 h-full flex flex-col"
        >
            <div className="w-full h-1 bg-slate-100 rounded-full mb-8 overflow-hidden">
                <div className="w-1/2 h-full bg-indigo-500 rounded-full"></div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Select the synonym</h2>
            <div className="text-sm text-slate-500 font-medium mb-8 bg-slate-100 inline-block px-3 py-1 rounded-lg self-start">
                Word: <span className="text-slate-900 font-bold">Ephemeral</span>
            </div>

            <div className="space-y-3">
                {options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isCorrect = opt.id === 'Short-lived';

                    let bgClass = 'bg-white border-slate-200';
                    let textClass = 'text-slate-700';

                    if (isSelected) {
                        bgClass = isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
                        textClass = isCorrect ? 'text-green-700' : 'text-red-700';
                    }

                    return (
                        <div
                            key={opt.id}
                            className={`w-full p-4 border-2 rounded-xl font-bold text-sm transition-all flex justify-between items-center ${bgClass} ${textClass}`}
                        >
                            {opt.label}
                            {isSelected && isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

const SuccessScreen = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="h-full flex flex-col items-center justify-center p-6 text-center"
    >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <TrophyIcon className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Lesson Complete!</h2>
        <p className="text-slate-500 mb-8">You're on fire! 🔥</p>

        <div className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-indigo-200">
            Continue
        </div>
    </motion.div>
);

const NavIcon = ({ icon: Icon, active }) => (
    <div className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        <Icon className="w-6 h-6" />
        {active && <div className="w-1 h-1 bg-indigo-600 rounded-full"></div>}
    </div>
);

export default MobileHeroDashboardPreview;
