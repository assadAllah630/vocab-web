import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeftIcon, ArrowRightIcon, HomeIcon, BookOpenIcon, PhotoIcon,
    UserCircleIcon, ChatBubbleLeftRightIcon, PlayIcon, ArrowPathIcon, LanguageIcon,
    CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, SpeakerWaveIcon,
    PaperAirplaneIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, XCircleIcon as XCircleIconSolid } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import confetti from 'canvas-confetti';

// --- Simulated Data ---

const MOCK_STORY = {
    title: "The Martian Garden",
    level: "B2",
    topic: "Sci-Fi",
    content: "Commander Lewis looked out at the **red landscape**. 'The soil here is rich in iron,' she noted, adjusting her **gloves**. 'But can it sustain life?' The **greenhouse** hummed softly behind her, a beacon of hope in the desolate wasteland.",
    vocabulary: ["red landscape", "gloves", "greenhouse"],
    image: "/assets/martian_garden.png"
};

const MOCK_EXAM = {
    question: "Select the correct synonym for 'Ephemeral':",
    options: ["Permanent", "Transient", "Tangible", "Eternal"],
    correctAnswer: "Transient"
};

const MOCK_GRAMMAR = {
    title: "Past Simple vs. Present Perfect",
    level: "B1",
    category: "Tenses",
    content: `
We use the **Past Simple** for finished actions in the past.
We use the **Present Perfect** for actions that have a connection to the present.

\`\`\`javascript
// Past Simple (finished time)
I lived in London in 2010.

// Present Perfect (unfinished time / life experience)
I have lived in London for 5 years.
\`\`\`
    `
};

// --- Simulated Components ---

const SimulatedStoryViewer = () => {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [savedCount, setSavedCount] = useState(124);
    const [cursorPos, setCursorPos] = useState({ x: '90%', y: '90%' });
    const [cursorScale, setCursorScale] = useState(1);
    const [flyingWord, setFlyingWord] = useState(null);

    useEffect(() => {
        let timeouts = [];
        const runDemo = () => {
            // Reset
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
                    <img
                        src={MOCK_STORY.image}
                        alt="Story Scene"
                        className="w-full h-full object-cover opacity-80"
                    />
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

const SimulatedDialogueViewer = () => {
    const [step, setStep] = useState('input'); // input, generating, viewing
    const [formState, setFormState] = useState({
        topic: '',
        level: '',
        grammar: '',
        visuals: false
    });
    const [messages, setMessages] = useState([]);
    const [showTranslate, setShowTranslate] = useState(false);

    useEffect(() => {
        let timeouts = [];

        const runDemo = () => {
            // Reset
            setStep('input');
            setFormState({ topic: '', level: '', grammar: '', visuals: false });
            setMessages([]);
            setShowTranslate(false);

            // --- INPUT PHASE ---

            // 1. Type Topic
            timeouts.push(setTimeout(() => {
                const text = "Ordering coffee in Paris";
                let i = 0;
                const interval = setInterval(() => {
                    setFormState(prev => ({ ...prev, topic: text.substring(0, i + 1) }));
                    i++;
                    if (i === text.length) clearInterval(interval);
                }, 50);
            }, 1000));

            // 2. Select Level
            timeouts.push(setTimeout(() => {
                setFormState(prev => ({ ...prev, level: 'B1' }));
            }, 2500));

            // 3. Type Grammar
            timeouts.push(setTimeout(() => {
                const text = "Polite requests (Conditionals)";
                let i = 0;
                const interval = setInterval(() => {
                    setFormState(prev => ({ ...prev, grammar: text.substring(0, i + 1) }));
                    i++;
                    if (i === text.length) clearInterval(interval);
                }, 40);
            }, 3000));

            // 4. Toggle Visuals
            timeouts.push(setTimeout(() => {
                setFormState(prev => ({ ...prev, visuals: true }));
            }, 5000));

            // 5. Click Generate
            timeouts.push(setTimeout(() => {
                setStep('generating');
            }, 6000));

            // --- VIEWING PHASE ---

            // 6. Show Viewer
            timeouts.push(setTimeout(() => {
                setStep('viewing');
            }, 7500));

            // 7. Show Messages One by One
            const conversation = [
                { id: 1, role: 'Barista', content: "Bonjour! Que puis-je vous servir aujourd'hui?", translation: "Hello! What can I get for you today?" },
                { id: 2, role: 'You', content: "Bonjour. Je voudrais un grand café crème, s'il vous plaît.", translation: "Hello. I would like a large coffee with cream, please." },
                { id: 3, role: 'Barista', content: "Très bien. Sur place ou à emporter?", translation: "Very good. For here or to go?" },
                { id: 4, role: 'You', content: "Sur place, merci.", translation: "For here, thank you." }
            ];

            conversation.forEach((msg, index) => {
                timeouts.push(setTimeout(() => {
                    setMessages(prev => [...prev, msg]);
                }, 8000 + (index * 1500)));
            });

            // 8. Toggle Translations
            timeouts.push(setTimeout(() => {
                setShowTranslate(true);
            }, 14000));

        };

        runDemo();
        const loop = setInterval(runDemo, 18000); // 18s loop

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(loop);
        };
    }, []);

    return (
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-700 text-sm">
                        {step === 'input' ? 'Dialogue Creator' : 'Dialogue Viewer'}
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden bg-slate-50/50">
                <AnimatePresence mode="wait">
                    {step === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 space-y-5"
                        >
                            {/* Topic Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Topic</label>
                                <div className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 shadow-sm h-10 flex items-center">
                                    {formState.topic}
                                    <span className="animate-pulse text-indigo-500">|</span>
                                </div>
                            </div>

                            {/* Level Selection */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Level</label>
                                <div className="flex gap-2">
                                    {['A1', 'A2', 'B1', 'B2'].map(l => (
                                        <div key={l} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${formState.level === l ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                                            {l}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Grammar Focus */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Grammar Focus</label>
                                <div className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 shadow-sm h-10 flex items-center">
                                    {formState.grammar}
                                </div>
                            </div>

                            {/* Visuals Toggle */}
                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-2">
                                    <PhotoIcon className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-900">Generate Visuals</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full transition-colors relative ${formState.visuals ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formState.visuals ? 'translate-x-4' : ''}`} />
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="pt-2">
                                <button className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                                    <SparklesIcon className="w-4 h-4" />
                                    Generate Dialogue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10"
                        >
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-medium text-slate-500 animate-pulse">Creating your conversation...</p>
                        </motion.div>
                    )}

                    {step === 'viewing' && (
                        <motion.div
                            key="viewing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Viewer Header */}
                            <div className="bg-white p-3 border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Ordering Coffee</h3>
                                    <p className="text-[10px] text-slate-500">B1 • Polite Requests</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1.5 hover:bg-slate-100 rounded-full text-indigo-600" title="Play Audio">
                                        <SpeakerWaveIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        className={`p-1.5 rounded-full transition-colors ${showTranslate ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`}
                                        title="Show Translation"
                                    >
                                        <LanguageIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'You' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === 'You'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                            }`}>
                                            <div className="text-[10px] opacity-70 mb-1 font-bold uppercase tracking-wider">{msg.role}</div>
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                            <AnimatePresence>
                                                {showTranslate && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        className={`text-xs mt-2 pt-2 border-t ${msg.role === 'You' ? 'border-indigo-500/30 text-indigo-100' : 'border-slate-100 text-slate-500'}`}
                                                    >
                                                        {msg.translation}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Practice Footer */}
                            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                                <button className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                                    Practice with Friend
                                </button>
                                <button className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                    Practice Solo
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const SimulatedExam = () => {
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const handleSelect = (opt) => {
        if (showResult) return;
        setSelected(opt);

        if (opt === MOCK_EXAM.correctAnswer) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            });
        }

        setTimeout(() => setShowResult(true), 500);
    };

    return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 rounded-xl border border-slate-200 shadow-xl">
            <div className="w-full max-w-md">
                <div className="mb-6 flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                        Question 5/10
                    </span>
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-6">
                    {MOCK_EXAM.question}
                </h3>

                <div className="space-y-3">
                    {MOCK_EXAM.options.map((opt, idx) => {
                        const isSelected = selected === opt;
                        const isCorrect = opt === MOCK_EXAM.correctAnswer;

                        let itemClass = "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ";
                        if (showResult) {
                            if (isCorrect) itemClass += "bg-green-50 border-green-500 text-green-700";
                            else if (isSelected) itemClass += "bg-red-50 border-red-500 text-red-700";
                            else itemClass += "border-slate-100 opacity-50";
                        } else {
                            if (isSelected) itemClass += "border-indigo-500 bg-indigo-50 text-indigo-700";
                            else itemClass += "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700";
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => handleSelect(opt)}
                                className={itemClass}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${showResult && isCorrect ? 'border-green-500 bg-green-500 text-white' :
                                    showResult && isSelected ? 'border-red-500 bg-red-500 text-white' :
                                        isSelected ? 'border-indigo-500 bg-indigo-500 text-white' :
                                            'border-slate-300 text-slate-400'
                                    }`}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="font-medium flex-1">{opt}</span>
                                {showResult && isCorrect && <CheckCircleIconSolid className="w-5 h-5 text-green-500" />}
                                {showResult && isSelected && !isCorrect && <XCircleIconSolid className="w-5 h-5 text-red-500" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const SimulatedGrammar = () => {
    const [step, setStep] = useState('input'); // input, generating, viewing
    const [topic, setTopic] = useState("");
    const [showExamples, setShowExamples] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        let timeouts = [];
        const runDemo = () => {
            setStep('input');
            setTopic("");
            setShowExamples(false);

            // 1. Type Topic
            timeouts.push(setTimeout(() => {
                const text = "Present Perfect vs Past Simple";
                let i = 0;
                const interval = setInterval(() => {
                    setTopic(text.substring(0, i + 1));
                    i++;
                    if (i === text.length) clearInterval(interval);
                }, 50);
            }, 1000));

            // 2. Click Generate
            timeouts.push(setTimeout(() => {
                setStep('generating');
            }, 3500));

            // 3. Show Content
            timeouts.push(setTimeout(() => {
                setStep('viewing');
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
            }, 5000));

            // 4. Auto Scroll Down to show buttons
            timeouts.push(setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: 400,
                        behavior: 'smooth'
                    });
                }
            }, 8000));

            // 5. Click "Generate Examples" and Scroll to bottom
            timeouts.push(setTimeout(() => {
                setShowExamples(true);
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTo({
                            top: scrollRef.current.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 500);
            }, 11000));
        };

        runDemo();
        const loop = setInterval(runDemo, 18000);

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(loop);
        };
    }, []);

    return (
        <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl flex flex-col relative">
            {/* Notion-like Header */}
            <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-3 bg-white z-10">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <span className="opacity-50">Grammar</span>
                    <span>/</span>
                    <span className="text-slate-800">Tenses</span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-white">
                <AnimatePresence mode="wait">
                    {step === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8"
                        >
                            <div className="w-full max-w-md space-y-4">
                                <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">What do you want to learn?</h2>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={topic}
                                        readOnly
                                        placeholder="e.g. Conditionals, Passive Voice..."
                                        className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg focus:border-indigo-500 focus:ring-0 transition-all outline-none text-slate-800 placeholder:text-slate-300"
                                    />
                                    <SparklesIcon className="w-6 h-6 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                                <div className="flex justify-center pt-4">
                                    <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transform active:scale-95 transition-all">
                                        <SparklesIcon className="w-5 h-5" />
                                        Explain with AI
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20"
                        >
                            <div className="flex gap-2 mb-4">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 bg-indigo-500 rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 bg-purple-500 rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 bg-pink-500 rounded-full" />
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">Organizing your notes...</p>
                        </motion.div>
                    )}

                    {step === 'viewing' && (
                        <motion.div
                            key="viewing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full overflow-y-auto p-8 custom-scrollbar"
                            ref={scrollRef}
                        >
                            {/* Title Area */}
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold uppercase tracking-wider">B1 Intermediate</span>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">Verbs</span>
                                </div>
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">Present Perfect vs. Past Simple</h1>
                                <p className="text-lg text-slate-500">Understanding the connection to the present.</p>
                            </div>

                            {/* Content Blocks */}
                            <div className="space-y-8">
                                {/* Timeline Graph */}
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 tracking-wider">Timeline Visualization</h3>
                                    <div className="relative h-24 flex items-center">
                                        {/* Line */}
                                        <div className="absolute left-0 right-0 h-1 bg-slate-200 top-1/2 -translate-y-1/2 rounded-full"></div>

                                        {/* Past Simple Point */}
                                        <div className="absolute left-[20%] top-1/2 -translate-y-1/2 flex flex-col items-center group">
                                            <div className="w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-md z-10"></div>
                                            <div className="mt-3 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Past Simple</div>
                                            <div className="text-[10px] text-slate-400 mt-1">Finished Time</div>
                                        </div>

                                        {/* Present Perfect Range */}
                                        <div className="absolute left-[40%] right-[10%] top-1/2 -translate-y-1/2 h-16 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center">
                                            <div className="text-xs font-bold text-indigo-600">Present Perfect Connection</div>
                                        </div>

                                        {/* Now Point */}
                                        <div className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center">
                                            <div className="w-4 h-4 bg-slate-900 rounded-full border-4 border-white shadow-md z-10"></div>
                                            <div className="mt-3 text-xs font-bold text-slate-900">NOW</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Table */}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Comparison</h3>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="p-4">Feature</th>
                                                    <th className="p-4 text-red-600">Past Simple</th>
                                                    <th className="p-4 text-indigo-600">Present Perfect</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="p-4 font-medium text-slate-700">Time</td>
                                                    <td className="p-4 text-slate-600">Finished (yesterday)</td>
                                                    <td className="p-4 text-slate-600">Unfinished / Indefinite</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-4 font-medium text-slate-700">Focus</td>
                                                    <td className="p-4 text-slate-600">When it happened</td>
                                                    <td className="p-4 text-slate-600">Result in present</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setShowExamples(true)}
                                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${showExamples ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                        Generate Examples
                                    </button>
                                    <button className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-indigo-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        Test Me
                                    </button>
                                </div>

                                {/* Generated Examples (Conditional) */}
                                <AnimatePresence>
                                    {showExamples && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 overflow-hidden"
                                        >
                                            <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                                <SparklesIcon className="w-4 h-4" />
                                                AI Generated Examples
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex gap-3 items-start">
                                                    <span className="bg-white text-indigo-600 font-bold px-2 py-0.5 rounded text-xs border border-indigo-100 mt-0.5">PP</span>
                                                    <p className="text-sm text-indigo-800">I <span className="font-bold">have lost</span> my keys. (I can't find them now)</p>
                                                </li>
                                                <li className="flex gap-3 items-start">
                                                    <span className="bg-white text-red-500 font-bold px-2 py-0.5 rounded text-xs border border-red-100 mt-0.5">PS</span>
                                                    <p className="text-sm text-slate-700">I <span className="font-bold">lost</span> my keys yesterday. (But I found them later)</p>
                                                </li>
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const AppSimulation = () => {
    const [activeTab, setActiveTab] = useState('story');

    const tabs = [
        { id: 'story', label: 'Story Mode', icon: BookOpenIcon },
        { id: 'chat', label: 'AI Chat', icon: ChatBubbleLeftRightIcon },
        { id: 'exam', label: 'Smart Exam', icon: CheckCircleIcon },
        { id: 'grammar', label: 'Grammar', icon: LanguageIcon },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative aspect-[16/10] md:aspect-[16/9] w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        {activeTab === 'story' && <SimulatedStoryViewer />}
                        {activeTab === 'chat' && <SimulatedDialogueViewer />}
                        {activeTab === 'exam' && <SimulatedExam />}
                        {activeTab === 'grammar' && <SimulatedGrammar />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export { SimulatedStoryViewer, SimulatedDialogueViewer, SimulatedExam, SimulatedGrammar };
export default AppSimulation;
