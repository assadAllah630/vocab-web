import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon, BookOpenIcon,
    ChatBubbleLeftRightIcon, SpeakerWaveIcon,
    CheckCircleIcon,
    ChevronLeftIcon, PaperAirplaneIcon, BookmarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';


// --- Simulated Data ---

const MOCK_STORY = {
    title: "The Martian Garden",
    level: "B2",
    topic: "Sci-Fi",
    content: "Commander Lewis looked out at the **red landscape**. 'The soil here is rich in iron,' she noted, adjusting her **gloves**. 'But can it sustain life?' The **greenhouse** hummed softly behind her, a beacon of hope in the desolate wasteland.",
    vocabulary: ["red landscape", "gloves", "greenhouse"],
    image: "https://images.unsplash.com/photo-1614728853913-1e22ba6190fe?q=80&w=2070&auto=format&fit=crop" // Placeholder
};

const MOCK_EXAM = {
    question: "Select the correct synonym for 'Ephemeral':",
    options: ["Permanent", "Transient", "Tangible", "Eternal"],
    correctAnswer: "Transient"
};

// --- Desktop Components ---

const DesktopStoryViewer = () => {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [savedCount, setSavedCount] = useState(124);
    const [cursorPos, setCursorPos] = useState({ x: '90%', y: '90%' });
    const [cursorScale, setCursorScale] = useState(1);
    const [flyingWord, setFlyingWord] = useState(null);

    useEffect(() => {
        let timeouts = [];
        const runDemo = () => {
            setTooltipOpen(false);
            setCursorPos({ x: '90%', y: '90%' });
            setFlyingWord(null);

            // Step 1: Move Cursor to "greenhouse"
            timeouts.push(setTimeout(() => {
                setCursorPos({ x: '65%', y: '45%' });
            }, 1000));

            // Step 2: Click "greenhouse"
            timeouts.push(setTimeout(() => {
                setCursorScale(0.8);
            }, 2500));
            timeouts.push(setTimeout(() => {
                setCursorScale(1);
                setTooltipOpen(true);
            }, 2700));

            // Step 3: Move Cursor to "Save" button
            timeouts.push(setTimeout(() => {
                setCursorPos({ x: '68%', y: '42%' });
            }, 3500));

            // Step 4: Click "Save"
            timeouts.push(setTimeout(() => {
                setCursorScale(0.8);
            }, 4500));
            timeouts.push(setTimeout(() => {
                setCursorScale(1);
                setTooltipOpen(false);
                setFlyingWord({ x: '65%', y: '45%' });
            }, 4700));

            // Step 5: Word Flies to Counter
            timeouts.push(setTimeout(() => {
                setSavedCount(prev => prev + 1);
                setFlyingWord(null);
            }, 5500));
        };

        runDemo();
        const loopInterval = setInterval(runDemo, 8000);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(loopInterval);
        };
    }, []);

    return (
        <div className="w-full h-full bg-slate-900 text-white overflow-hidden flex flex-col rounded-xl border border-slate-700 shadow-2xl relative">
            {/* Fake Cursor */}
            <motion.div
                className="absolute z-50 pointer-events-none drop-shadow-xl text-white"
                animate={{ left: cursorPos.x, top: cursorPos.y, scale: cursorScale }}
                transition={{ duration: 1.5, ease: "easeInOut", scale: { duration: 0.1 } }}
            >
                <svg className="w-8 h-8 fill-current stroke-black stroke-1" viewBox="0 0 24 24">
                    <path d="M5.5 3.21l10.08 5.11c1.23.62 1.25 2.38.04 3.03l-3.3 1.78 3.32 6.55c.6.94-.37 2.1-1.37 1.6l-2.67-1.35-3.32-6.55-2.7 2.68c-.9.89-2.43.25-2.43-1.02v-11c0-1.28 1.4-1.9 2.35-1.42z" />
                </svg>
            </motion.div>

            {/* Flying Word Animation */}
            <AnimatePresence>
                {flyingWord && (
                    <motion.div
                        initial={{ left: flyingWord.x, top: flyingWord.y, opacity: 1, scale: 1 }}
                        animate={{ left: '90%', top: '5%', opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.8, ease: "easeIn" }}
                        className="absolute z-40 bg-indigo-500 text-white px-2 py-1 rounded text-xs font-bold pointer-events-none"
                    >
                        +1 greenhouse
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-4 flex items-center justify-between z-10 bg-slate-900/50 backdrop-blur-md border-b border-white/10">
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <HomeIcon className="h-5 w-5 text-slate-400" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-sm md:text-base">{MOCK_STORY.title}</h1>
                    <span className="text-[10px] md:text-xs text-white/60">{MOCK_STORY.level} • {MOCK_STORY.topic}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                    <BookOpenIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">{savedCount}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-1/2 bg-slate-800 relative overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-orange-900 to-slate-900 opacity-50 absolute inset-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold text-4xl">SCENE</div>
                </div>

                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto bg-white text-slate-900 relative">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 leading-tight">
                        The Arrival
                    </h2>

                    <div className="prose prose-sm prose-indigo max-w-none flex-1 text-slate-600 leading-relaxed relative">
                        <p>
                            Commander Lewis looked out at the <span className="bg-indigo-50 text-indigo-800 px-1 rounded font-semibold">red landscape</span>.
                            'The soil here is rich in iron,' she noted, adjusting her <span className="bg-indigo-50 text-indigo-800 px-1 rounded font-semibold">gloves</span>.
                            'But can it sustain life?' The
                            <span className="relative inline-block mx-1">
                                <span className="bg-indigo-100 text-indigo-800 px-1 rounded font-semibold cursor-pointer border-b-2 border-indigo-300">greenhouse</span>
                                <AnimatePresence>
                                    {tooltipOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-xl z-50 text-xs text-left"
                                        >
                                            <div className="font-bold text-sm mb-1">greenhouse</div>
                                            <div className="text-slate-300 italic mb-2">noun • /'grin.haʊs/</div>
                                            <button className="w-full bg-indigo-600 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1">
                                                <CheckCircleIcon className="w-3 h-3" />
                                                Save to Deck
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </span>
                            hummed softly behind her.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DesktopDialogueViewer = () => {
    // ... (Existing Desktop Dialogue Code - Simplified for brevity but keeping logic)
    const [messages, setMessages] = useState([
        { id: 1, role: 'Barista', content: "Bonjour! Que puis-je vous servir aujourd'hui?", translation: "Hello! What can I get for you today?" },
        { id: 2, role: 'You', content: "Bonjour. Je voudrais un grand café crème, s'il vous plaît.", translation: "Hello. I would like a large coffee with cream, please." }
    ]);

    return (
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl relative flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-700 text-sm">Dialogue Viewer</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === 'You' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                            <div className="text-[10px] opacity-70 mb-1 font-bold uppercase tracking-wider">{msg.role}</div>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DesktopExam = () => {
    // ... (Existing Desktop Exam Code)
    return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 rounded-xl border border-slate-200 shadow-xl">
            <div className="w-full max-w-md">
                <div className="mb-6 flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Question 5/10</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-6">{MOCK_EXAM.question}</h3>
                <div className="space-y-3">
                    {MOCK_EXAM.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700 cursor-pointer transition-all">
                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400">{String.fromCharCode(65 + idx)}</div>
                            <span className="font-medium flex-1">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DesktopGrammar = () => {
    // ... (Existing Desktop Grammar Code)
    return (
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl flex flex-col relative">
            <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-3 bg-white z-10">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <span className="opacity-50">Grammar</span><span>/</span><span className="text-slate-800">Tenses</span>
                </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Present Perfect</h1>
                <p className="text-slate-500 mb-6">Connection to the present.</p>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
                        <div className="w-4 h-4 bg-slate-900 rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                        <span>Past</span>
                        <span>Now</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Mobile Components (New) ---

const MobileStoryViewer = () => {
    const [scene, setScene] = useState(0);
    const [selectedWord, setSelectedWord] = useState(null);
    const [savedCount, setSavedCount] = useState(12);
    const [touchPos, setTouchPos] = useState({ x: '50%', y: '80%' });
    const [isTouching, setIsTouching] = useState(false);
    const [showSheet, setShowSheet] = useState(false);
    const [flyingWord, setFlyingWord] = useState(null);

    // Simulation Loop
    useEffect(() => {
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            // Reset
            setScene(0);
            setSelectedWord(null);
            setShowSheet(false);
            setTouchPos({ x: '80%', y: '80%' });

            // 1. Read Phase
            await wait(2000);

            // 2. Move to "greenhouse"
            setTouchPos({ x: '75%', y: '45%' }); // Approx word location
            await wait(1000);

            // 3. Tap Word
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);
            setSelectedWord('greenhouse');
            setShowSheet(true);

            // 4. Read Definition
            await wait(1500);

            // 5. Move to "Save" button in sheet
            setTouchPos({ x: '50%', y: '85%' });
            await wait(1000);

            // 6. Tap Save
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);
            setShowSheet(false);
            setFlyingWord({ x: '50%', y: '85%' }); // Start from button

            // 7. Animate Word Flying
            await wait(100);
            setSavedCount(prev => prev + 1);
            await wait(500);
            setFlyingWord(null);

            // 8. Swipe Gesture (Right to Left)
            await wait(1000);
            setTouchPos({ x: '90%', y: '50%' });
            await wait(500);
            setIsTouching(true);
            setTouchPos({ x: '10%', y: '50%' }); // Drag across
            await wait(800);
            setIsTouching(false);
            setScene(1); // Change Scene

            // 9. Read Scene 2
            await wait(3000);

            // Loop
            runSimulation();
        };

        runSimulation();
    }, []);

    const scenes = [
        {
            id: 0,
            image: "https://images.unsplash.com/photo-1614728853913-1e22ba6190fe?q=80&w=2070&auto=format&fit=crop",
            text: (
                <>
                    Commander Lewis looked out at the <span className="font-bold text-indigo-900 border-b-2 border-indigo-100">red landscape</span>.
                    'The soil here is rich in iron,' she noted. 'But can it sustain life?' The <span className={`font-bold px-1 rounded transition-colors ${selectedWord === 'greenhouse' ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-indigo-50'}`}>greenhouse</span> hummed softly behind her.
                </>
            )
        },
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
            text: (
                <>
                    Inside, the air was thick with humidity. Rows of <span className="font-bold text-indigo-900 border-b-2 border-indigo-100">hydroponic</span> trays stretched into the distance. It was a fragile <span className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded">ecosystem</span>, but it was theirs.
                </>
            )
        }
    ];

    return (
        <div className="w-full h-full bg-white flex flex-col relative overflow-hidden font-sans select-none">
            {/* Header / Bookmark */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                <BookOpenIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">{savedCount}</span>
            </div>

            {/* Scenes */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={scene}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex-1 flex flex-col h-full"
                >
                    {/* Image */}
                    <div className="h-[45%] w-full relative overflow-hidden">
                        <img src={scenes[scene].image} alt="Scene" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 p-6 -mt-12 relative z-10">
                        <div className="bg-white/80 backdrop-blur-sm p-1 rounded-full inline-block mb-4 border border-slate-100">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Sci-Fi • B2</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight font-serif">The Martian Garden</h2>
                        <p className="text-lg text-slate-700 leading-relaxed font-serif">
                            {scenes[scene].text}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Bottom Sheet Definition */}
            <AnimatePresence>
                {showSheet && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] z-40 p-6 border-t border-slate-100"
                    >
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">greenhouse</h3>
                                <p className="text-slate-500 italic">noun • /ˈɡriːn.haʊs/</p>
                            </div>
                            <button className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                                <SpeakerWaveIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                            A glass building in which plants are grown that need protection from cold weather.
                        </p>
                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <CheckCircleIcon className="w-5 h-5" />
                            Save to Collection
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Flying Word Animation */}
            <AnimatePresence>
                {flyingWord && (
                    <motion.div
                        initial={{ left: flyingWord.x, top: flyingWord.y, scale: 1, opacity: 1 }}
                        animate={{ left: '90%', top: '5%', scale: 0.2, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute z-50 pointer-events-none"
                    >
                        <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            +1 Word
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Touch Simulator */}
            <motion.div
                className="absolute z-50 pointer-events-none"
                animate={{
                    left: touchPos.x,
                    top: touchPos.y,
                    scale: isTouching ? 0.8 : 1
                }}
                transition={{
                    left: { duration: isTouching ? 0.8 : 1, ease: "easeInOut" }, // Faster when swiping
                    top: { duration: 1, ease: "easeInOut" },
                    scale: { duration: 0.1 }
                }}
            >
                <div className={`w-12 h-12 rounded-full border-2 border-white/50 bg-slate-900/20 backdrop-blur-sm shadow-xl flex items-center justify-center transition-colors ${isTouching ? 'bg-slate-900/40' : ''}`}>
                    <div className="w-3 h-3 bg-white/90 rounded-full shadow-lg"></div>
                </div>
            </motion.div>
        </div>
    );
};

const MobileDialogueViewer = () => (
    <div className="w-full h-full bg-slate-50 flex flex-col">
        {/* Mobile Chat Header */}
        <div className="bg-white p-4 shadow-sm flex items-center gap-3 z-10">
            <ChevronLeftIcon className="w-6 h-6 text-slate-400" />
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">B</div>
            <div>
                <h3 className="font-bold text-slate-900 text-sm">Barista</h3>
                <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                </p>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm max-w-[80%]">
                    <p className="text-sm text-slate-800">Bonjour! Que puis-je vous servir aujourd'hui?</p>
                </div>
            </div>
            <div className="flex justify-end">
                <div className="bg-indigo-600 p-3 rounded-2xl rounded-tr-none shadow-md max-w-[80%]">
                    <p className="text-sm text-white">Je voudrais un grand café, s'il vous plaît.</p>
                </div>
            </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <div className="flex-1 h-10 bg-slate-100 rounded-full px-4 flex items-center text-sm text-slate-400">
                Type a message...
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <PaperAirplaneIcon className="w-5 h-5" />
            </div>
        </div>
    </div>
);

const MobileExam = () => (
    <div className="w-full h-full bg-white flex flex-col p-6">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8">
            <div className="w-1/2 h-full bg-indigo-500 rounded-full"></div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Question 5</span>
            <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">{MOCK_EXAM.question}</h2>

            <div className="space-y-3">
                {MOCK_EXAM.options.map((opt, i) => (
                    <div key={i} className={`w-full p-4 rounded-xl border-2 font-bold text-lg flex items-center justify-between ${opt === 'Transient' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600'}`}>
                        {opt}
                        {opt === 'Transient' && <CheckCircleIconSolid className="w-6 h-6 text-indigo-600" />}
                    </div>
                ))}
            </div>
        </div>

        <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl">
            Check Answer
        </button>
    </div>
);

const MobileGrammar = () => (
    <div className="w-full h-full bg-slate-50 flex flex-col">
        <div className="p-6 pb-2">
            <h2 className="text-3xl font-bold text-slate-900">Grammar</h2>
            <p className="text-slate-500">Your pocket guide.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {['Present Perfect', 'Past Simple', 'Future Continuous'].map((topic, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800">{topic}</h3>
                        <p className="text-xs text-slate-400">3 rules • 5 examples</p>
                    </div>
                    <ChevronLeftIcon className="w-5 h-5 text-slate-300 rotate-180" />
                </div>
            ))}
        </div>
    </div>
);

// --- Exported Wrappers ---

export const SimulatedStoryViewer = () => (
    <>
        <div className="hidden lg:block h-full"><DesktopStoryViewer /></div>
        <div className="block lg:hidden h-full"><MobileStoryViewer /></div>
    </>
);

export const SimulatedDialogueViewer = () => (
    <>
        <div className="hidden lg:block h-full"><DesktopDialogueViewer /></div>
        <div className="block lg:hidden h-full"><MobileDialogueViewer /></div>
    </>
);

export const SimulatedExam = () => (
    <>
        <div className="hidden lg:block h-full"><DesktopExam /></div>
        <div className="block lg:hidden h-full"><MobileExam /></div>
    </>
);

export const SimulatedGrammar = () => (
    <>
        <div className="hidden lg:block h-full"><DesktopGrammar /></div>
        <div className="block lg:hidden h-full"><MobileGrammar /></div>
    </>
);
