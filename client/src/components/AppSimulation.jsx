import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon, BookOpenIcon,
    ChatBubbleLeftRightIcon, SpeakerWaveIcon,
    CheckCircleIcon,
    ChevronLeftIcon, PaperAirplaneIcon, BookmarkIcon,
    SparklesIcon, BoltIcon, MicrophoneIcon, PlayIcon, PauseIcon, LanguageIcon,
    PencilSquareIcon, CpuChipIcon
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
            setSceneIndex(0);
            setSavedWords([]);
            setCreationState({ title: '', instruction: '', grammar: '', visualsOn: false });
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
            if (!isMounted) return;
            const word = "greenhouse";
            setFlyingWord({ word, x: '40%', y: '40%' });
            setSavedWords(prev => [...prev, word]);

            await wait(1000);
            if (!isMounted) return;
            setFlyingWord(null);

            await wait(2000);

            // --- Phase 5: Flip to Scene 3 (No Fast Forward) ---
            if (!isMounted) return;
            setIsFlipping(true);
            await wait(800);
            if (!isMounted) return;
            setSceneIndex(2);
            setIsFlipping(false);

            await wait(3000); // Read Scene 3

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
    const [activeStep, setActiveStep] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Simulation loop
    useEffect(() => {
        let isMounted = true;
        const loop = async () => {
            if (!isMounted) return;
            // Step 0: Reset
            setActiveStep(0);
            await new Promise(r => setTimeout(r, 1000));
            if (!isMounted) return;

            // Step 1: AI Speaks
            setIsPlaying(true);
            await new Promise(r => setTimeout(r, 1500));
            if (!isMounted) return;
            setIsPlaying(false);
            setActiveStep(1); // AI Message visible

            // Step 2: User Records
            await new Promise(r => setTimeout(r, 1000));
            if (!isMounted) return;
            setIsRecording(true);
            await new Promise(r => setTimeout(r, 2000)); // Recording...
            if (!isMounted) return;
            setIsRecording(false);
            setActiveStep(2); // User Message visible

            // Step 3: Feedback
            await new Promise(r => setTimeout(r, 500));
            if (!isMounted) return;
            setActiveStep(3); // Feedback visible

            // Step 4: AI Responds
            await new Promise(r => setTimeout(r, 1500));
            if (!isMounted) return;
            setIsPlaying(true);
            await new Promise(r => setTimeout(r, 1500));
            if (!isMounted) return;
            setIsPlaying(false);
            setActiveStep(4); // Final state

            // Loop
            await new Promise(r => setTimeout(r, 5000));
            if (isMounted) loop();
        };
        loop();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="w-full h-full bg-slate-50 flex rounded-xl overflow-hidden border border-slate-200 shadow-2xl">
            {/* Left: Chat Interface */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 z-10">
                    <div>
                        <h3 className="font-bold text-slate-800">Le Petit Café</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Online • Paris, France
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
                        B2 Intermediate
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 space-y-6 overflow-hidden bg-slate-50/50 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {/* AI Message 1 */}
                    <AnimatePresence>
                        {activeStep >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, x: -10 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                className="flex gap-4 max-w-[90%]"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm overflow-hidden">
                                    <span className="text-lg">👩‍🎨</span>
                                </div>
                                <div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-800">
                                        <p className="font-medium">Bonjour! Vous avez choisi?</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 ml-1">
                                        <button className="text-slate-400 hover:text-indigo-600 transition-colors"><SpeakerWaveIcon className="w-4 h-4" /></button>
                                        <span className="text-[10px] text-slate-400 font-medium cursor-pointer hover:text-indigo-600">Translate</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* User Message */}
                    <AnimatePresence>
                        {activeStep >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, x: 10 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                className="flex flex-col items-end self-end ml-auto max-w-[90%]"
                            >
                                <div className="flex gap-4 flex-row-reverse">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                                        <span className="text-white font-bold text-xs">YOU</span>
                                    </div>
                                    <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none shadow-md text-white">
                                        <p className="font-medium">Oui, un croissant s'il vous plaît.</p>
                                    </div>
                                </div>

                                {/* Feedback Badge */}
                                {activeStep >= 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-2 mr-14 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-green-100 shadow-sm"
                                    >
                                        <CheckCircleIconSolid className="w-4 h-4" />
                                        Pronunciation: 98%
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI Message 2 */}
                    <AnimatePresence>
                        {activeStep >= 4 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, x: -10 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                className="flex gap-4 max-w-[90%]"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm overflow-hidden">
                                    <span className="text-lg">👩‍🎨</span>
                                </div>
                                <div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-800">
                                        <p className="font-medium">Très bien. Sur place ou à emporter?</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="h-20 bg-white border-t border-slate-100 px-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer">
                        <LanguageIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 h-12 bg-slate-50 rounded-full border border-slate-200 flex items-center px-4 text-slate-400 text-sm">
                        {isRecording ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-slate-700 font-medium">Listening...</span>
                                <div className="flex gap-0.5 items-end h-4 ml-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [4, 16, 4] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                            className="w-1 bg-red-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            "Type or speak..."
                        )}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                        <MicrophoneIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Right: Context Panel (Desktop Only) */}
            <div className="w-64 bg-white border-l border-slate-100 flex flex-col">
                <div className="p-5 border-b border-slate-100">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-1">Vocabulary</h4>
                    <p className="text-xs text-slate-400">Key words for this lesson</p>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {[
                        { word: "choisi", trans: "chosen", type: "verb" },
                        { word: "croissant", trans: "pastry", type: "noun" },
                        { word: "sur place", trans: "for here", type: "phrase" },
                        { word: "à emporter", trans: "to go", type: "phrase" }
                    ].map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.word}</span>
                                <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">{item.type}</span>
                            </div>
                            <div className="text-xs text-slate-500">{item.trans}</div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Lesson Progress</span>
                        <span className="text-xs font-bold text-indigo-600">45%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-[45%] rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DesktopExam = () => {
    const [phase, setPhase] = useState('form'); // form, agent, exam
    const [formState, setFormState] = useState({ topic: '', level: '', types: [] });
    const [agentLogs, setAgentLogs] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            if (!isMounted) return;

            // --- Phase 1: Form Filling ---
            setPhase('form');
            setFormState({ topic: '', level: '', types: [] });
            setAgentLogs([]);
            setSelectedOption(null);
            setShowResult(false);

            await wait(1000);

            // Type Topic
            const topic = "Space Exploration";
            for (let i = 0; i <= topic.length; i++) {
                if (!isMounted) return;
                setFormState(prev => ({ ...prev, topic: topic.slice(0, i) }));
                await wait(50);
            }
            await wait(500);

            // Select Level
            if (!isMounted) return;
            setFormState(prev => ({ ...prev, level: 'B2' }));
            await wait(500);

            // Select Types
            if (!isMounted) return;
            setFormState(prev => ({ ...prev, types: ['Multiple Choice'] }));
            await wait(800);

            // Click Generate
            if (!isMounted) return;
            setPhase('agent');

            // --- Phase 2: Agent Generation ---
            const logs = [
                "Analyzing topic 'Space Exploration'...",
                "Identifying key vocabulary (B2)...",
                "Structuring exam blueprint...",
                "Generating questions...",
                "Finalizing exam..."
            ];

            for (const log of logs) {
                if (!isMounted) return;
                setAgentLogs(prev => [...prev, log]);
                await wait(800);
            }

            // --- Phase 3: Taking Exam ---
            if (!isMounted) return;
            setPhase('exam');
            await wait(1500);

            // Select Option
            if (!isMounted) return;
            setSelectedOption(1); // Option B
            await wait(500);
            setShowResult(true);

            // --- Reset ---
            await wait(4000);
            if (isMounted) runSimulation();
        };

        runSimulation();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center p-6 rounded-xl border border-slate-200 shadow-xl relative overflow-hidden">
            <AnimatePresence mode="wait">
                {phase === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-5"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <PencilSquareIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">New Exam</h3>
                                <p className="text-xs text-slate-500">Generate a custom test</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Topic</label>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium h-12 flex items-center">
                                    {formState.topic || <span className="text-slate-300">Enter topic...</span>}
                                    {phase === 'form' && formState.topic.length < "Space Exploration".length && <span className="animate-pulse ml-0.5">|</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Level</label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium h-12 flex items-center justify-between">
                                        {formState.level || <span className="text-slate-300">Select...</span>}
                                        <ChevronLeftIcon className="w-4 h-4 -rotate-90 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Type</label>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium h-12 flex items-center">
                                        {formState.types.length > 0 ? "Mixed" : <span className="text-slate-300">Any</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 mt-2 flex items-center justify-center gap-2">
                            <SparklesIcon className="w-5 h-5" />
                            Generate Exam
                        </button>
                    </motion.div>
                )}

                {phase === 'agent' && (
                    <motion.div
                        key="agent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-6 text-slate-300 font-mono text-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"></div>
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <CpuChipIcon className="w-6 h-6 text-indigo-400" />
                            <span className="font-bold text-white">AI Agent Working</span>
                        </div>
                        <div className="space-y-3">
                            {agentLogs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2"
                                >
                                    <span className="text-indigo-500">➜</span>
                                    <span>{log}</span>
                                </motion.div>
                            ))}
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-2 h-4 bg-indigo-500"
                            />
                        </div>
                    </motion.div>
                )}

                {phase === 'exam' && (
                    <motion.div
                        key="exam"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Question 1/5</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-6 leading-relaxed">
                            The astronaut <span className="border-b-2 border-indigo-200 px-2 text-indigo-600 font-mono bg-indigo-50 mx-1">_____</span> the hatch to enter the station.
                        </h3>

                        <div className="space-y-3">
                            {["opened", "opening", "opens", "open"].map((opt, idx) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = idx === 1; // "opening" is wrong, "opened" (0) is correct? Let's say 0 is correct.
                                // Let's make 0 the correct answer.
                                const isCorrectAnswer = idx === 0;

                                let stateClass = "border-slate-200 hover:border-indigo-200 hover:bg-slate-50";
                                if (showResult && isCorrectAnswer) stateClass = "border-green-500 bg-green-50 text-green-700";
                                if (showResult && isSelected && !isCorrectAnswer) stateClass = "border-red-500 bg-red-50 text-red-700";
                                if (isSelected && !showResult) stateClass = "border-indigo-500 bg-indigo-50 text-indigo-700";

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${stateClass}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${showResult && isCorrectAnswer ? "border-green-500 bg-green-500 text-white" :
                                            showResult && isSelected && !isCorrectAnswer ? "border-red-500 bg-red-500 text-white" :
                                                isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 text-slate-400"
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="font-medium flex-1">{opt}</span>
                                        {showResult && isCorrectAnswer && <CheckCircleIconSolid className="w-5 h-5 text-green-500" />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const DesktopGrammar = () => {
    const [activeTopic, setActiveTopic] = useState('Present Perfect');
    const [isLoading, setIsLoading] = useState(false);

    // Simulate topic switch
    useEffect(() => {
        const interval = setInterval(() => {
            setIsLoading(true);
            setTimeout(() => {
                setActiveTopic(prev => prev === 'Present Perfect' ? 'Conditionals' : 'Present Perfect');
                setIsLoading(false);
            }, 800);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl flex">
            {/* Sidebar */}
            <div className="w-48 border-r border-slate-100 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                        <span>Grammar</span>
                    </div>
                </div>
                <div className="p-2 space-y-1">
                    {['Present Simple', 'Present Perfect', 'Past Continuous', 'Conditionals', 'Future Perfect'].map(topic => (
                        <div
                            key={topic}
                            className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${activeTopic === topic
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {topic}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative bg-white">
                {/* Header */}
                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>B2</span>
                        <ChevronLeftIcon className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-800 font-medium">{activeTopic}</span>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1">
                        <SparklesIcon className="w-3 h-3" />
                        Explain with AI
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10"
                            >
                                <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-sm text-slate-400 font-medium animate-pulse">Generating lesson...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{activeTopic}</h1>
                                    <p className="text-slate-600 leading-relaxed">
                                        {activeTopic === 'Present Perfect'
                                            ? "Connects the past with the present. Use it for actions that happened at an unspecified time or have consequences now."
                                            : "Describes the result of something that might happen (in the present or future) or might have happened but didn't (in the past)."
                                        }
                                    </p>
                                </div>

                                {/* Timeline / Diagram Simulation */}
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Timeline</h4>
                                    <div className="flex items-center gap-4 relative h-8">
                                        {/* Line */}
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2"></div>

                                        {activeTopic === 'Present Perfect' ? (
                                            <>
                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                                                    <span className="text-[10px] font-bold text-slate-400">Past</span>
                                                </div>
                                                <div className="flex-1"></div>
                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className="w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-indigo-100"></div>
                                                    <span className="text-[10px] font-bold text-indigo-600">Action</span>
                                                </div>
                                                <div className="flex-1"></div>
                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                                                    <span className="text-[10px] font-bold text-slate-800">Now</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                                                    <span className="text-[10px] font-bold text-slate-800">If...</span>
                                                </div>
                                                <div className="flex-1 border-t-2 border-dashed border-indigo-300 relative">
                                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-indigo-400 font-medium">Condition</span>
                                                </div>
                                                <div className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className="w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-indigo-100"></div>
                                                    <span className="text-[10px] font-bold text-indigo-600">Result</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Examples */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Examples</h4>
                                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex gap-3 text-green-800 text-sm">
                                        <CheckCircleIconSolid className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <p>
                                            {activeTopic === 'Present Perfect'
                                                ? <span>I <span className="font-bold border-b border-green-300">have visited</span> Paris three times.</span>
                                                : <span>If it <span className="font-bold border-b border-green-300">rains</span>, I will stay home.</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

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

const MobileExam = () => {
    const [phase, setPhase] = useState('form'); // form, agent, exam
    const [formState, setFormState] = useState({ topic: '' });
    const [agentLogs, setAgentLogs] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const runSimulation = async () => {
            if (!isMounted) return;

            // --- Phase 1: Form Filling ---
            setPhase('form');
            setFormState({ topic: '' });
            setAgentLogs([]);
            setSelectedOption(null);
            setShowResult(false);

            await wait(1000);

            // Type Topic
            const topic = "Space B2";
            for (let i = 0; i <= topic.length; i++) {
                if (!isMounted) return;
                setFormState(prev => ({ ...prev, topic: topic.slice(0, i) }));
                await wait(80);
            }
            await wait(500);

            // Click Generate
            if (!isMounted) return;
            setPhase('agent');

            // --- Phase 2: Agent Generation ---
            const logs = [
                "Analyzing...",
                "Building Exam...",
                "Ready!"
            ];

            for (const log of logs) {
                if (!isMounted) return;
                setAgentLogs(prev => [...prev, log]);
                await wait(800);
            }

            // --- Phase 3: Taking Exam ---
            if (!isMounted) return;
            setPhase('exam');
            await wait(1000);

            // Select Option
            if (!isMounted) return;
            setSelectedOption(1); // Option B
            await wait(500);
            setShowResult(true);

            // --- Reset ---
            await wait(4000);
            if (isMounted) runSimulation();
        };

        runSimulation();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
                {phase === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full flex flex-col justify-center p-6 space-y-6"
                    >
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <PencilSquareIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Create Exam</h3>
                            <p className="text-sm text-slate-500">What do you want to test?</p>
                        </div>

                        <div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-800 font-medium text-lg shadow-sm flex items-center justify-center min-h-[3.5rem]">
                                {formState.topic || <span className="text-slate-300">e.g. History C1</span>}
                                {phase === 'form' && formState.topic.length < "Space B2".length && <span className="animate-pulse ml-0.5">|</span>}
                            </div>
                        </div>

                        <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                            <SparklesIcon className="w-5 h-5" />
                            Generate
                        </button>
                    </motion.div>
                )}

                {phase === 'agent' && (
                    <motion.div
                        key="agent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-300 font-mono text-sm relative"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 to-slate-900"></div>

                        <div className="relative z-10 w-full max-w-xs space-y-6">
                            <div className="flex justify-center">
                                <CpuChipIcon className="w-12 h-12 text-indigo-400 animate-pulse" />
                            </div>

                            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                {agentLogs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2 items-center"
                                    >
                                        <span className="text-indigo-500 text-xs">➜</span>
                                        <span>{log}</span>
                                    </motion.div>
                                ))}
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-2 h-4 bg-indigo-500"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {phase === 'exam' && (
                    <motion.div
                        key="exam"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full h-full bg-white flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Q1 / 5</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900 leading-relaxed text-center">
                                The astronaut <br />
                                <span className="border-b-2 border-indigo-200 px-2 text-indigo-600 font-mono bg-indigo-50 mx-1 inline-block my-2">_____</span> <br />
                                the hatch.
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {["opened", "opening", "opens", "open"].map((opt, idx) => {
                                const isSelected = selectedOption === idx;
                                const isCorrect = idx === 1; // Visual fix: make 2nd option correct for demo flow if needed, but logic says 0. Let's stick to 0 as correct.
                                // Actually, let's make 0 correct.
                                const isCorrectAnswer = idx === 0;

                                let stateClass = "border-slate-100 bg-white text-slate-600";
                                if (showResult && isCorrectAnswer) stateClass = "border-green-500 bg-green-50 text-green-700";
                                if (showResult && isSelected && !isCorrectAnswer) stateClass = "border-red-500 bg-red-50 text-red-700";
                                if (isSelected && !showResult) stateClass = "border-indigo-500 bg-indigo-50 text-indigo-700";

                                return (
                                    <div
                                        key={idx}
                                        className={`w-full p-4 rounded-xl border-2 font-bold text-lg flex items-center justify-between transition-all ${stateClass}`}
                                    >
                                        {opt}
                                        {showResult && isCorrectAnswer && <CheckCircleIconSolid className="w-6 h-6 text-green-500" />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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
