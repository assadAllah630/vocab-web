/**
 * MobileGameBuilder - Teacher interface for creating game sessions
 * 
 * Features:
 * - Mode selection (Velocity, Streamline, Face-Off, etc.)
 * - Content source selection (Exam, Vocab, Custom)
 * - Settings configuration
 * - Launch game session
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Zap, GitBranch, Users2,
    Target, Lock, BookOpen, List, PenTool, Settings,
    Clock, Shuffle, Sparkles, Play, Save
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';

const GAME_MODES = [
    {
        id: 'velocity',
        name: 'Velocity',
        description: 'Speed matching - race to connect pairs',
        icon: Zap,
        color: 'from-amber-500 to-orange-600',
    },
    {
        id: 'streamline',
        name: 'Streamline',
        description: 'Sentence ordering - arrange words correctly',
        icon: GitBranch,
        color: 'from-cyan-500 to-blue-600',
    },
    {
        id: 'faceoff',
        name: 'Face-Off',
        description: '1v1 True/False battles',
        icon: Users2,
        color: 'from-red-500 to-pink-600',
    },
    {
        id: 'synergy',
        name: 'Synergy',
        description: 'Team co-op quiz mode',
        icon: Target,
        color: 'from-green-500 to-emerald-600',
    },
    {
        id: 'discovery',
        name: 'Discovery',
        description: 'Cloze puzzles and decryption',
        icon: Lock,
        color: 'from-purple-500 to-violet-600',
    },
];

const CONTENT_SOURCES = [
    { id: 'exam', name: 'From Exam', icon: BookOpen, description: 'Use exam template questions' },
    { id: 'vocab_list', name: 'From Vocab', icon: List, description: 'Use vocabulary word pairs' },
    { id: 'custom', name: 'Custom', icon: PenTool, description: 'Create questions on the fly' },
];

function MobileGameBuilder() {
    const navigate = useNavigate();
    const location = useLocation();
    const classroomId = location.state?.classroom_id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [selectedMode, setSelectedMode] = useState(null);
    const [contentSource, setContentSource] = useState(null);
    const [contentId, setContentId] = useState(null);
    const [exams, setExams] = useState([]);
    const [settings, setSettings] = useState({
        time_limit: 60,
        shuffle_questions: true,
        show_answers: true,
        power_ups: false,
    });

    useEffect(() => {
        if (contentSource === 'exam') {
            loadExams();
        }
    }, [contentSource]);

    const loadExams = async () => {
        try {
            const res = await api.get('exams/?is_template=true');
            setExams(res.data);
        } catch (e) {
            console.error('Failed to load exams', e);
        }
    };

    const handleLaunchGame = async () => {
        if (!classroomId || !selectedMode) {
            alert('Please complete all required fields');
            return;
        }

        setLoading(true);
        try {
            // 1. Create or use existing config
            const configRes = await api.post('game-configs/', {
                name: name || `${selectedMode} Game`,
                mode: selectedMode,
                content_source: contentSource || 'exam',
                content_id: contentId,
                settings: settings,
            });

            // 2. Create session
            const sessionRes = await api.post('game-sessions/', {
                classroom_id: classroomId,
                config_id: configRes.data.id,
            });

            // 3. Navigate to lobby
            navigate(`/m/game/lobby/${sessionRes.data.id}`, {
                state: { join_code: sessionRes.data.join_code }
            });
        } catch (e) {
            console.error('Failed to create game', e);
            alert('Failed to create game session');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1_Mode = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Choose Game Mode</h2>
            <div className="space-y-3">
                {GAME_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;
                    return (
                        <motion.button
                            key={mode.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedMode(mode.id)}
                            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${isSelected
                                    ? 'border-white bg-gradient-to-r ' + mode.color
                                    : 'border-[#27272A] bg-[#1C1C1F]'
                                }`}
                        >
                            <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-[#27272A]'}`}>
                                <Icon size={24} className={isSelected ? 'text-white' : 'text-gray-400'} />
                            </div>
                            <div className="text-left">
                                <h3 className={`font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                    {mode.name}
                                </h3>
                                <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                    {mode.description}
                                </p>
                            </div>
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto w-6 h-6 rounded-full bg-white flex items-center justify-center"
                                >
                                    <Zap size={14} className="text-indigo-600" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep2_Content = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Select Content</h2>

            {/* Content Source */}
            <div className="grid grid-cols-3 gap-2">
                {CONTENT_SOURCES.map((source) => {
                    const Icon = source.icon;
                    const isSelected = contentSource === source.id;
                    return (
                        <button
                            key={source.id}
                            onClick={() => setContentSource(source.id)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${isSelected
                                    ? 'border-indigo-500 bg-indigo-500/20'
                                    : 'border-[#27272A] bg-[#1C1C1F]'
                                }`}
                        >
                            <Icon size={20} className={`mx-auto mb-1 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`} />
                            <span className={`text-xs ${isSelected ? 'text-indigo-300' : 'text-gray-400'}`}>
                                {source.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Exam Selector */}
            {contentSource === 'exam' && (
                <div className="space-y-2">
                    <label className="block text-sm text-gray-400">Select Exam Template</label>
                    {exams.length === 0 ? (
                        <p className="text-gray-500 text-sm py-2">No exam templates available</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {exams.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => setContentId(exam.id)}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${contentId === exam.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-[#1C1C1F] text-gray-300 hover:bg-[#27272A]'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{exam.topic}</div>
                                    <div className="text-xs opacity-70">
                                        {exam.questions?.length || 0} questions
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {contentSource === 'custom' && (
                <p className="text-gray-400 text-sm p-3 bg-[#1C1C1F] rounded-xl">
                    Custom questions will be added during the game session.
                </p>
            )}
        </div>
    );

    const renderStep3_Settings = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Game Settings</h2>

            {/* Game Name */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">Game Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Friday Vocab Challenge"
                    className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
            </div>

            {/* Time Limit */}
            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    <Clock size={14} className="inline mr-2" />
                    Time per Question (seconds)
                </label>
                <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={settings.time_limit}
                    onChange={(e) => setSettings({ ...settings, time_limit: parseInt(e.target.value) })}
                    className="w-full"
                />
                <div className="text-center text-indigo-400 font-bold">{settings.time_limit}s</div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-[#1C1C1F] rounded-xl">
                    <span className="flex items-center gap-2 text-gray-300">
                        <Shuffle size={18} />
                        Shuffle Questions
                    </span>
                    <input
                        type="checkbox"
                        checked={settings.shuffle_questions}
                        onChange={(e) => setSettings({ ...settings, shuffle_questions: e.target.checked })}
                        className="w-5 h-5 rounded"
                    />
                </label>
                <label className="flex items-center justify-between p-3 bg-[#1C1C1F] rounded-xl">
                    <span className="flex items-center gap-2 text-gray-300">
                        <Sparkles size={18} />
                        Enable Power-ups
                    </span>
                    <input
                        type="checkbox"
                        checked={settings.power_ups}
                        onChange={(e) => setSettings({ ...settings, power_ups: e.target.checked })}
                        className="w-5 h-5 rounded"
                    />
                </label>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0B]/95 backdrop-blur-sm z-10 p-4 border-b border-[#27272A]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 bg-[#1C1C1F] rounded-lg">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg">Create Game</h1>
                            <p className="text-xs text-gray-400">Step {step} of 3</p>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-indigo-500' : 'bg-[#27272A]'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {step === 1 && renderStep1_Mode()}
                        {step === 2 && renderStep2_Content()}
                        {step === 3 && renderStep3_Settings()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0B] border-t border-[#27272A]">
                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !selectedMode}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 ${(step === 1 && !selectedMode)
                                ? 'bg-[#27272A] text-gray-500'
                                : 'bg-indigo-600 text-white'
                            }`}
                    >
                        Continue
                        <ChevronRight size={20} />
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleLaunchGame}
                            disabled={loading}
                            className="py-4 bg-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Play size={20} />
                                    Launch
                                </>
                            )}
                        </button>
                        <button
                            onClick={async () => {
                                // Just save config without launching
                                try {
                                    await api.post('game-configs/', {
                                        name: name || `${selectedMode} Template`,
                                        mode: selectedMode,
                                        content_source: contentSource || 'exam',
                                        content_id: contentId,
                                        settings: settings,
                                    });
                                    alert('Template saved!');
                                    navigate(-1);
                                } catch (e) {
                                    alert('Failed to save');
                                }
                            }}
                            className="py-4 bg-[#27272A] rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Save Template
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MobileGameBuilder;
