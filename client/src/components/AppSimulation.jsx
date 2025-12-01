import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon, BookOpenIcon,
    ChatBubbleLeftRightIcon, SpeakerWaveIcon,
    CheckCircleIcon,
    ChevronLeftIcon, PaperAirplaneIcon, BookmarkIcon,
    SparklesIcon, BoltIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';


// --- Simulated Data ---

const MOCK_STORY = {
    title: "The Martian Garden",
    level: "B2",
    topic: "Sci-Fi",
    scenes: [
        {
            id: 1,
            text: "Commander Lewis looked out at the **red landscape**. 'The soil here is rich in iron,' she noted. 'But can it sustain life?'",
            image: "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?q=80&w=2664&auto=format&fit=crop", // Mars landscape
            highlights: ["red landscape"]
        },
        {
            id: 2,
            text: "The **greenhouse** hummed softly behind her. Inside, the air was thick with humidity. Rows of **hydroponic** trays stretched into the distance.",
            image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2832&auto=format&fit=crop", // Greenhouse
            highlights: ["greenhouse", "hydroponic"]
        },
        // Filler scenes for fast forward
        { id: 3, text: "She checked the nutrient levels...", image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=2670&auto=format&fit=crop" }, // Lab/Science
        { id: 4, text: "The plants were thriving...", image: "https://images.unsplash.com/photo-1592419044706-39796d40f98c?q=80&w=2779&auto=format&fit=crop" }, // Plants
        { id: 5, text: "Life on Mars was possible.", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" } // Space/Planet
    ]
};

const MOCK_EXAM = {
    question: "What does 'hydroponic' mean?",
    options: ["Growing plants in sand", "Growing plants in water", "Growing plants in space", "Growing plants in darkness"],
    correctAnswer: "Growing plants in water"
};

// --- Components ---

const StoryCreationView = ({ title, instruction, grammar, visualsOn, onGenerate }) => {
    return (
        <div className="w-full h-full bg-slate-50 flex flex-col justify-center p-8">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 space-y-6 max-w-md mx-auto w-full">
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">Create Story</h2>
                    <p className="text-slate-500 text-sm">AI-Powered Immersion</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Story Title</label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium min-h-[3rem] flex items-center">
                            {title || <span className="text-slate-300">Enter title...</span>}
                            {title && <span className="animate-pulse ml-0.5">|</span>}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Instruction / Level</label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium min-h-[3rem] flex items-center">
                            {instruction || <span className="text-slate-300">e.g. Sci-Fi, B2</span>}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Grammar Focus</label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium min-h-[3rem] flex items-center">
                            {grammar || <span className="text-slate-300">Select grammar...</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-bold text-slate-700">Visual Representation</span>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${visualsOn ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${visualsOn ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>

                <button
                    onClick={onGenerate}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 mt-4 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <SparklesIcon className="w-5 h-5" />
                    Generate Story
                </button>
            </div>
        </div>
    );
};

const BookPage = ({ content, image, pageNumber, isFlipping, zIndex, rotation }) => {
    return (
        <motion.div
            className="absolute inset-0 origin-left"
            style={{
                zIndex: zIndex,
                transformStyle: 'preserve-3d',
            }}
            animate={{ rotateY: rotation }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            {/* Front of Page */}
            <div className="absolute inset-0 backface-hidden w-full h-full bg-white flex shadow-2xl overflow-hidden rounded-r-xl" style={{ backfaceVisibility: 'hidden' }}>
                {/* Left Page: Text */}
                <div className="w-1/2 p-8 flex flex-col justify-center relative border-r border-slate-100 bg-[#faf9f6]">
                    {/* Spine Gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"></div>

                    <div className="absolute top-6 right-6">
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
                            <SpeakerWaveIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="prose prose-slate prose-lg leading-loose">
                        {content}
                    </div>
                    <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-serif italic">
                        {pageNumber * 2 - 1}
                    </span>
                </div>

                {/* Right Page: Image */}
                <div className="w-1/2 relative bg-slate-100">
                    <img src={image} alt="Scene" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent pointer-events-none"></div>
                    {/* Spine Gradient (Right side of spread) */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10"></div>

                    <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs font-serif italic drop-shadow-md z-20">
                        {pageNumber * 2}
                    </span>
                </div>
            </div>

            {/* Back of Page (for flipping effect) */}
            <div
                className="absolute inset-0 w-full h-full bg-slate-100 rounded-l-xl shadow-xl overflow-hidden flex"
                style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                }}
            >
                <div className="w-full h-full bg-[#faf9f6] border-r border-slate-200 relative">
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
                </div>
            </div>
        </motion.div>
    );
};

const StoryBookView = ({ sceneIndex, savedWords, isFlipping, flyingWord, onWordClick }) => {
    return (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center p-10 perspective-[1500px] overflow-hidden relative">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 to-slate-900"></div>

            {/* Saved Words Counter */}
            <div className="absolute top-8 right-8 z-50 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white shadow-xl transition-all duration-300 hover:bg-white/20">
                <BookOpenIcon className="w-5 h-5 text-indigo-300" />
                <span className="font-bold">{savedWords.length}</span>
            </div>

            {/* Flying Word Animation */}
            <AnimatePresence>
                {flyingWord && (
                    <motion.div
                        initial={{ left: flyingWord.x, top: flyingWord.y, opacity: 1, scale: 1 }}
                        animate={{ left: '90%', top: '5%', opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.8, ease: "easeIn" }}
                        className="absolute z-50 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold pointer-events-none shadow-lg shadow-indigo-500/50"
                    >
                        +1 {flyingWord.word}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative w-full max-w-5xl aspect-[16/9] shadow-2xl rounded-xl">
                {/* Page 2 (Next Scene) - Behind */}
                {sceneIndex < MOCK_STORY.scenes.length - 1 && (
                    <BookPage
                        content={<p className="text-lg leading-relaxed font-serif text-slate-800" dangerouslySetInnerHTML={{ __html: MOCK_STORY.scenes[sceneIndex + 1].text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-indigo-700 border-b-2 border-indigo-200">$1</span>') }} />}
                        image={MOCK_STORY.scenes[sceneIndex + 1].image}
                        pageNumber={sceneIndex + 2}
                        zIndex={5}
                        rotation={0}
                    />
                )}

                {/* Page 1 (Current Scene) - Flipping */}
                <BookPage
                    content={
                        <p className="text-lg leading-relaxed font-serif text-slate-800">
                            {MOCK_STORY.scenes[sceneIndex].text.split(' ').map((word, i) => {
                                const cleanWord = word.replace(/[^a-zA-Z]/g, "");
                                const isHighlight = MOCK_STORY.scenes[sceneIndex].highlights?.some(h => word.includes(h) || h.includes(cleanWord));

                                if (isHighlight) {
                                    return (
                                        <span
                                            key={i}
                                            onClick={(e) => onWordClick && onWordClick(e, cleanWord)}
                                            className="font-bold text-indigo-700 border-b-2 border-indigo-200 cursor-pointer hover:bg-indigo-50 transition-colors inline-block mr-1"
                                        >
                                            {word}
                                        </span>
                                    );
                                }
                                return word + " ";
                            })}
                        </p>
                    }
                    image={MOCK_STORY.scenes[sceneIndex].image}
                    pageNumber={sceneIndex + 1}
                    zIndex={10}
                    rotation={isFlipping ? -180 : 0}
                />
            </div>
        </div>
    );
};

const EndOptionsView = ({ onQuizStart }) => {
    const [countdown, setCountdown] = useState(8);

    useEffect(() => {
        // Countdown timer
        const interval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const circumference = 2 * Math.PI * 28; // radius = 28
    const offset = circumference - (countdown / 8) * circumference;

    return (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
            </div>

            {/* Countdown Timer - Prominent */}
            <div className="absolute top-6 right-6 z-20">
                <div className="relative w-16 h-16">
                    {/* Circular progress */}
                    <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                        <circle
                            cx="32" cy="32" r="28"
                            stroke="white"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                        {countdown}
                    </div>
                </div>
            </div>

            {/* Cards Grid - Responsive */}
            <div className="relative z-10 w-full max-w-md flex flex-col md:grid md:grid-cols-2 gap-4">
                {/* Practice Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="min-h-[140px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col justify-center hover:bg-white/15 transition-colors cursor-pointer"
                >
                    <BookOpenIcon className="w-8 h-8 text-white mb-3" />
                    <h3 className="text-xl font-bold text-white mb-1">Practice Words</h3>
                    <p className="text-sm text-slate-300">Review saved vocabulary</p>
                </motion.div>

                {/* Quiz Card - Highlighted */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.1 }}
                    className="min-h-[140px] bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/30 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden shadow-xl"
                >
                    {/* Pulsing ring effect */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border-4 border-white/50 rounded-2xl"
                    />
                    <div className="relative z-10">
                        <BoltIcon className="w-8 h-8 text-white mb-3" />
                        <h3 className="text-2xl font-bold text-white mb-1">AI Quiz</h3>
                        <p className="text-sm text-white/90 font-medium">Starting in {countdown}s...</p>
                    </div>
                </motion.div>
            </div>

            {/* Skip Button */}
            <button
                onClick={onQuizStart}
                className="mt-6 text-white/60 hover:text-white text-sm font-medium transition-colors relative z-10"
            >
                Skip wait →
            </button>
        </div>
    );
};

const QuizPreview = () => {
    return (
        <div className="w-full h-full bg-slate-50 flex flex-col justify-center p-8">
            <div className="max-w-md mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 block">Question 1 of 5</span>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{MOCK_EXAM.question}</h2>
                </motion.div>

                <div className="space-y-3">
                    {MOCK_EXAM.options.map((opt, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 + 0.2 }}
                            className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-bold text-lg text-left hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-[0.98]"
                        >
                            {opt}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Desktop Components (Wrapper) ---

const DesktopStoryViewer = () => {
    const [phase, setPhase] = useState('create'); // create, book, end, quiz
    const [sceneIndex, setSceneIndex] = useState(0);
    const [savedWords, setSavedWords] = useState([]);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flyingWord, setFlyingWord] = useState(null);

    // Creation State
    const [creationState, setCreationState] = useState({
        title: '',
        instruction: '',
        grammar: '',
        visualsOn: false
    });

    useEffect(() => {
        let isMounted = true;
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            // --- Phase 1: Creation ---
            setPhase('create');
            await wait(1000);

            // Type Title
            const title = "The Martian Garden";
            for (let i = 0; i <= title.length; i++) {
                if (!isMounted) return;
                setCreationState(prev => ({ ...prev, title: title.slice(0, i) }));
                await wait(50);
            }
            await wait(500);

            // Type Instruction
            const instruction = "Sci-Fi • B2";
            for (let i = 0; i <= instruction.length; i++) {
                if (!isMounted) return;
                setCreationState(prev => ({ ...prev, instruction: instruction.slice(0, i) }));
                await wait(50);
            }
            await wait(500);

            // Type Grammar
            const grammar = "Future Tense";
            for (let i = 0; i <= grammar.length; i++) {
                if (!isMounted) return;
                setCreationState(prev => ({ ...prev, grammar: grammar.slice(0, i) }));
                await wait(50);
            }
            await wait(800);

            // Toggle Visuals
            if (!isMounted) return;
            setCreationState(prev => ({ ...prev, visualsOn: true }));
            await wait(1000);

            // Click Generate
            setPhase('book');

            // --- Phase 2: Scene 1 ---
            await wait(3000); // Read Scene 1

            // --- Phase 3: Flip to Scene 2 ---
            if (!isMounted) return;
            setIsFlipping(true);
            await wait(800); // Wait for half flip
            if (!isMounted) return;
            setSceneIndex(1);
            setIsFlipping(false);

            // --- Phase 4: Word Interaction (Scene 2) ---
            await wait(1500);
            // Simulate click handled by UI (visual only here)
            // We'll trigger the flying word programmatically to simulate user action
            if (!isMounted) return;
            const word = "greenhouse";
            // Calculate fake position for demo
            setFlyingWord({ word, x: '40%', y: '40%' });
            setSavedWords(prev => [...prev, word]);

            await wait(1000);
            if (!isMounted) return;
            setFlyingWord(null);

            await wait(2000);

            // --- Phase 5: Fast Forward ---
            // Rapidly flip through remaining scenes
            for (let i = 2; i < MOCK_STORY.scenes.length; i++) {
                if (!isMounted) return;
                setSceneIndex(i);
                await wait(500); // Slower flip for better visibility
            }

            // --- Phase 6: End Options ---
            await wait(500);
            if (!isMounted) return;
            setPhase('end');

            // --- Phase 7: Quiz Start (Automated) ---
            await wait(3000);
            if (!isMounted) return;
            setPhase('quiz');

            // Loop back
            await wait(5000);
            if (isMounted) runSimulation();
        };

        runSimulation();

        return () => { isMounted = false; };
    }, []);

    return (
        <div className="w-full h-full bg-slate-900">
            <AnimatePresence mode="wait">
                {phase === 'create' && (
                    <motion.div key="create" className="w-full h-full" exit={{ opacity: 0 }}>
                        <StoryCreationView
                            {...creationState}
                            onGenerate={() => { }}
                        />
                    </motion.div>
                )}
                {phase === 'book' && (
                    <motion.div key="book" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <StoryBookView
                            sceneIndex={sceneIndex}
                            savedWords={savedWords}
                            isFlipping={isFlipping}
                            flyingWord={flyingWord}
                            onWordClick={(e, word) => {
                                // Interactive mode support
                                const rect = e.target.getBoundingClientRect();
                                setFlyingWord({ word, x: rect.left, y: rect.top });
                                setSavedWords(prev => [...prev, word]);
                                setTimeout(() => setFlyingWord(null), 1000);
                            }}
                        />
                    </motion.div>
                )}
                {phase === 'end' && (
                    <motion.div key="end" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <EndOptionsView onQuizStart={() => setPhase('quiz')} />
                    </motion.div>
                )}
                {phase === 'quiz' && (
                    <motion.div key="quiz" className="w-full h-full" initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
                        <QuizPreview />
                    </motion.div>
                )}
            </AnimatePresence>
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

const MobileStoryViewer = () => {
    const [phase, setPhase] = useState('create');
    const [sceneIndex, setSceneIndex] = useState(0);
    const [savedWords, setSavedWords] = useState([]);
    const [flyingWord, setFlyingWord] = useState(null);
    const [touchPos, setTouchPos] = useState({ x: '50%', y: '80%' });
    const [isTouching, setIsTouching] = useState(false);

    const [creationState, setCreationState] = useState({
        title: '',
        instruction: '',
        grammar: '',
        visualsOn: false
    });

    useEffect(() => {
        let isMounted = true;
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            // --- Phase 1: Creation ---
            setPhase('create');
            setTouchPos({ x: '50%', y: '80%' });
            await wait(1000);

            // Type Title
            const title = "The Martian Garden";
            for (let i = 0; i <= title.length; i++) {
                if (!isMounted) return;
                setCreationState(prev => ({ ...prev, title: title.slice(0, i) }));
                await wait(50);
            }
            await wait(500);

            // Type Instruction
            const instruction = "Sci-Fi • B2";
            for (let i = 0; i <= instruction.length; i++) {
                if (!isMounted) return;
                setCreationState(prev => ({ ...prev, instruction: instruction.slice(0, i) }));
                await wait(50);
            }
            await wait(500);

            // Toggle Visuals
            if (!isMounted) return;
            setCreationState(prev => ({ ...prev, visualsOn: true }));
            await wait(1000);

            // Click Generate
            setTouchPos({ x: '50%', y: '90%' }); // Move to button
            await wait(500);
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);
            setPhase('book');

            // --- Phase 2: Scene 1 ---
            await wait(3000);

            // --- Phase 3: Flip (Swipe) to Scene 2 ---
            if (!isMounted) return;
            setTouchPos({ x: '90%', y: '50%' });
            await wait(500);
            setIsTouching(true);
            await wait(200);
            setTouchPos({ x: '10%', y: '50%' }); // Swipe left
            await wait(500);
            setIsTouching(false);
            setSceneIndex(1);

            // --- Phase 4: Word Interaction ---
            await wait(1500);
            // Tap word
            setTouchPos({ x: '40%', y: '40%' });
            await wait(500);
            setIsTouching(true);
            await wait(200);
            setIsTouching(false);

            // Fly word
            if (!isMounted) return;
            setFlyingWord({ word: "greenhouse", x: '40%', y: '40%' });
            setSavedWords(prev => [...prev, "greenhouse"]);
            await wait(1000);
            setFlyingWord(null);

            // --- Phase 5: Fast Forward ---
            await wait(2000);
            for (let i = 2; i < MOCK_STORY.scenes.length; i++) {
                if (!isMounted) return;
                setSceneIndex(i);
                await wait(1200); // Slower for mobile visibility
            }

            // --- Phase 6: End Options ---
            await wait(500);
            setPhase('end');

            // --- Phase 7: Quiz (Automated) ---
            await wait(8000); // Extended to 8s for better UX
            if (!isMounted) return;
            setPhase('quiz');

            // Loop back
            await wait(5000);
            if (isMounted) runSimulation();
        };

        runSimulation();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="w-full h-full bg-slate-900 overflow-hidden relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
                    <HomeIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    <BookOpenIcon className="w-4 h-4 text-indigo-300" />
                    <span className="text-xs font-bold text-white">{savedWords.length}</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {phase === 'create' && (
                    <motion.div key="create" className="w-full h-full" exit={{ opacity: 0 }}>
                        <StoryCreationView {...creationState} onGenerate={() => { }} />
                    </motion.div>
                )}

                {phase === 'book' && (
                    <motion.div key="book" className="w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Image Top */}
                        <div className="h-1/2 relative">
                            <motion.img
                                key={sceneIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                                src={MOCK_STORY.scenes[sceneIndex].image}
                                className="w-full h-full object-cover"
                                alt="Scene"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        </div>

                        {/* Text Bottom */}
                        <div className="h-1/2 p-6 bg-slate-900 text-slate-200 overflow-y-auto relative">
                            <div className="prose prose-invert prose-sm">
                                <p className="text-lg leading-relaxed font-serif">
                                    {MOCK_STORY.scenes[sceneIndex].text.split(' ').map((word, i) => {
                                        const cleanWord = word.replace(/[^a-zA-Z]/g, "");
                                        const isHighlight = MOCK_STORY.scenes[sceneIndex].highlights?.some(h => word.includes(h) || h.includes(cleanWord));

                                        if (isHighlight) {
                                            return (
                                                <span key={i} className="text-indigo-400 font-bold border-b border-indigo-500/50 inline-block mr-1">
                                                    {word}
                                                </span>
                                            );
                                        }
                                        return word + " ";
                                    })}
                                </p>
                            </div>

                            {/* Audio Button */}
                            <button className="absolute top-6 right-6 p-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-900/50 text-white">
                                <SpeakerWaveIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 'end' && (
                    <motion.div key="end" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <EndOptionsView onQuizStart={() => setPhase('quiz')} />
                    </motion.div>
                )}

                {phase === 'quiz' && (
                    <motion.div key="quiz" className="w-full h-full" initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
                        <QuizPreview />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Flying Word Animation */}
            <AnimatePresence>
                {flyingWord && (
                    <motion.div
                        initial={{ left: flyingWord.x, top: flyingWord.y, opacity: 1, scale: 1 }}
                        animate={{ left: '85%', top: '20px', opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.8, ease: "easeIn" }}
                        className="absolute z-50 bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold pointer-events-none shadow-lg"
                    >
                        +1 {flyingWord.word}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fake Touch Cursor */}
            <motion.div
                className="absolute z-50 pointer-events-none"
                animate={{
                    left: touchPos.x,
                    top: touchPos.y,
                    scale: isTouching ? 0.8 : 1
                }}
                transition={{
                    left: { duration: isTouching ? 0.2 : 1, ease: "easeInOut" },
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

const MobileDialogueViewer = () => {
    const [phase, setPhase] = useState('create'); // create, chat
    const [topic, setTopic] = useState('');
    const [characters, setCharacters] = useState('');
    const [messages, setMessages] = useState([]);
    const [typing, setTyping] = useState(false);
    const [showReplyOptions, setShowReplyOptions] = useState(false);
    const [savedWords, setSavedWords] = useState([]);
    const [showTranslate, setShowTranslate] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [flyingWord, setFlyingWord] = useState(null);
    const [showExamButton, setShowExamButton] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const runSimulation = async () => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Phase 1: Creation
            setPhase('create');
            setTopic('');
            setCharacters('');
            setMessages([]);
            setSavedWords([]);
            setShowExamButton(false);

            await wait(1000); // Faster start
            // Type Topic
            const fullTopic = "Negotiating a price";
            for (let i = 0; i <= fullTopic.length; i++) {
                if (!isMounted) return;
                setTopic(fullTopic.slice(0, i));
                await wait(40); // Faster typing
            }

            await wait(800);
            // Type Characters
            const fullChars = "Buyer, Merchant";
            for (let i = 0; i <= fullChars.length; i++) {
                if (!isMounted) return;
                setCharacters(fullChars.slice(0, i));
                await wait(40); // Faster typing
            }

            await wait(1000); // Faster
            if (!isMounted) return;
            // Click Generate
            setPhase('chat');

            // Phase 2: Chat
            await wait(1000); // Faster
            if (!isMounted) return;
            setTyping(true);
            await wait(1200); // Faster typing indicator
            if (!isMounted) return;
            setTyping(false);
            setMessages([{
                id: 1,
                role: 'other',
                text: "Bonjour! Ce tapis est fait main. Très rare.",
                translation: "Hello! This rug is handmade. Very rare.",
                keywords: ['tapis', 'rare']
            }]);

            await wait(1000); // Faster
            if (!isMounted) return;
            // Simulate User Reading / Translation Click
            setShowTranslate(1);
            await wait(1200); // Faster

            if (!isMounted) return;
            // Simulate Word Save (New Step)
            setSavedWords(prev => [...prev, 'tapis']);
            setFlyingWord({ x: '20%', y: '30%' }); // Approx position
            await wait(800); // Faster animation wait
            setFlyingWord(null);

            await wait(1000); // Faster
            if (!isMounted) return;
            // Simulate User Reply Choice
            setShowReplyOptions(true);
            await wait(1500); // Faster - less time to read options
            if (!isMounted) return;
            setShowReplyOptions(false);

            // User Reply
            setMessages(prev => [...prev, {
                id: 2,
                role: 'self',
                text: "C'est beau, mais c'est un peu cher pour moi.",
                translation: "It's beautiful, but it's a bit expensive for me."
            }]);

            await wait(1000); // Faster
            if (!isMounted) return;
            setTyping(true);
            await wait(1200); // Faster
            if (!isMounted) return;
            setTyping(false);
            setMessages(prev => [...prev, {
                id: 3,
                role: 'other',
                text: "Je peux vous faire un prix. 200 euros?",
                translation: "I can give you a price. 200 euros?",
                keywords: ['prix', 'euros']
            }]);

            // End of Chat - Show Exam Button
            await wait(1000); // Faster
            if (!isMounted) return;
            setShowExamButton(true);

            // Wait before restarting
            await wait(5000);
            if (isMounted) runSimulation();
        };

        runSimulation();
    }, [isMounted]);

    return (
        <div className="w-full h-full bg-white flex flex-col relative overflow-hidden font-sans">
            {/* Flying Word Animation */}
            <AnimatePresence>
                {flyingWord && (
                    <motion.div
                        initial={{ left: flyingWord.x, top: flyingWord.y, scale: 1, opacity: 1 }}
                        animate={{ left: '85%', top: '60px', scale: 0.2, opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute z-50 pointer-events-none"
                    >
                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            +1 Word
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Saved Words Counter - Always Visible in Chat Phase */}
            {phase === 'chat' && (
                <div className="absolute top-16 right-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <BookOpenIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">{savedWords.length}</span>
                </div>
            )}

            {phase === 'create' ? (
                <div className="p-6 flex flex-col justify-center h-full bg-slate-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Topic</label>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium min-h-[3rem] flex items-center">
                                {topic}<span className="animate-pulse">|</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Characters</label>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium min-h-[3rem] flex items-center">
                                {characters}
                            </div>
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button className="flex-1 py-2 rounded-lg text-sm font-bold bg-white shadow-sm text-indigo-600 transition-all">Solo</button>
                            <button className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-600 transition-all">Partner</button>
                        </div>
                        <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 mt-4 flex items-center justify-center gap-2">
                            <SparklesIcon className="w-5 h-5" />
                            Generate Scenario
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* WhatsApp Header */}
                    <div className="bg-[#075E54] p-3 flex items-center gap-3 text-white shadow-md z-20">
                        <ChevronLeftIcon className="w-6 h-6" />
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                            M
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-base leading-tight">Merchant</h3>
                            <p className="text-[11px] opacity-80 flex items-center gap-1">
                                {typing ? 'typing...' : 'online'}
                            </p>
                        </div>
                        <div className="flex gap-4 pr-2">
                            <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
                            <div className="w-1 h-5 bg-white/30 rounded-full"></div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto relative z-10 pb-20">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.role === 'self' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-lg p-2 shadow-sm relative ${msg.role === 'self' ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'
                                        }`}>
                                        {/* Message Text */}
                                        <p className="text-sm text-slate-800 leading-relaxed px-1">
                                            {msg.text.split(' ').map((word, i) => {
                                                const cleanWord = word.replace(/[^a-zA-ZÀ-ÿ]/g, "");
                                                const isKeyword = msg.keywords?.some(k => cleanWord.toLowerCase().includes(k));
                                                const isSaved = savedWords.includes(cleanWord.toLowerCase());

                                                if (!isKeyword) return word + " ";

                                                return (
                                                    <span key={i} className={`
                                                                    inline-block px-1 rounded cursor-pointer transition-colors
                                                                    ${isSaved ? 'bg-green-200 text-green-800' : 'bg-indigo-50 text-indigo-700 border-b border-indigo-300'}
                                                                `}
                                                        onClick={() => setSavedWords(prev => [...prev, cleanWord.toLowerCase()])}
                                                    >
                                                        {word}
                                                    </span>
                                                )
                                            })}
                                        </p>

                                        {/* Translation Toggle */}
                                        {msg.role === 'other' && (
                                            <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between">
                                                {showTranslate === msg.id ? (
                                                    <motion.p
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="text-xs text-slate-500 italic"
                                                    >
                                                        {msg.translation}
                                                    </motion.p>
                                                ) : (
                                                    <button className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-1">
                                                        <span className="w-3 h-3 rounded-full border border-indigo-500 flex items-center justify-center text-[8px]">T</span>
                                                        Translate
                                                    </button>
                                                )}
                                                <span className="text-[10px] text-slate-400 ml-auto">10:0{msg.id} AM</span>
                                            </div>
                                        )}

                                        {msg.role === 'self' && (
                                            <div className="flex justify-end items-center gap-1 mt-1">
                                                <span className="text-[10px] text-slate-500">10:0{msg.id} AM</span>
                                                <CheckCircleIconSolid className="w-3 h-3 text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {typing && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </motion.div>
                        )}

                        {/* Exam Button Overlay */}
                        <AnimatePresence>
                            {showExamButton && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-10"
                                >
                                    <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 animate-bounce">
                                        <SparklesIcon className="w-5 h-5" />
                                        Take Quick Exam
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input / Reply Area - Fixed at bottom */}
                    <div className="sticky bottom-0 p-2 bg-[#F0F0F0] flex items-center gap-2 z-30 shadow-lg">
                        {showReplyOptions ? (
                            <div className="w-full space-y-2 p-2">
                                <p className="text-xs font-bold text-slate-500 uppercase text-center mb-1">AI Suggested Replies</p>
                                {[
                                    "Je vais le prendre.",
                                    "C'est beau, mais c'est un peu cher pour moi.",
                                    "Est-ce qu'il est ancien ?"
                                ].map((opt, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`w-full p-3 text-left text-sm rounded-xl border shadow-sm transition-colors ${i === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                                            }`}
                                    >
                                        {opt}
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="w-8 h-8 text-slate-500 flex items-center justify-center">
                                    <span className="text-xl">+</span>
                                </div>
                                <div className="flex-1 h-10 bg-white rounded-full px-4 flex items-center text-sm text-slate-400 shadow-sm">
                                    Type a message...
                                </div>
                                <div className="w-10 h-10 bg-[#075E54] rounded-full flex items-center justify-center text-white shadow-md">
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

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
