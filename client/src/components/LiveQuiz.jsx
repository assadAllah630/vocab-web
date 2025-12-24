import React, { useEffect, useState } from 'react';
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { X, CheckCircle, BarChart2, HelpCircle, Sparkles, Loader2, Plus, BrainCircuit } from 'lucide-react';
import { Button, Card, Tabs, Tab, Slider, Textarea } from '@heroui/react';
import { generateQuiz } from '../api';

const LiveQuiz = ({ isOpen, onClose, classLevel = 'B1', targetLanguage = 'German' }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // "TEACHER" or "STUDENT" - simplified detection
    const canCreate = true;

    // View Mode: 'create' | 'voting' | 'results'
    const [viewMode, setViewMode] = useState('create');

    // Teacher State
    const [creationTab, setCreationTab] = useState('manual'); // 'manual' | 'ai'

    // Manual State
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    // AI State
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuizzes, setGeneratedQuizzes] = useState([]);

    // Active Poll State
    const [activePoll, setActivePoll] = useState(null);
    const [myVote, setMyVote] = useState(null);
    const [results, setResults] = useState({}); // { optionIndex: count }

    useEffect(() => {
        if (!room) return;

        const handleData = (payload, participant) => {
            const data = JSON.parse(new TextDecoder().decode(payload));

            if (data.type === 'POLL_START') {
                setActivePoll(data.poll);
                setResults({});
                setMyVote(null);
                setViewMode('voting');
            } else if (data.type === 'POLL_VOTE') {
                setResults(prev => ({
                    ...prev,
                    [data.optionIndex]: (prev[data.optionIndex] || 0) + 1
                }));
            } else if (data.type === 'POLL_END') {
                setActivePoll(null); // Or keep showing results with a "Ended" tag
            }
        };

        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [room, localParticipant]);

    const handleAiGenerate = async () => {
        if (!aiTopic.trim()) return;
        setIsGenerating(true);
        try {
            const res = await generateQuiz({
                topic: aiTopic,
                count: aiCount,
                level: classLevel,
                target_language: targetLanguage
            });
            // Result is array of { question, options, answer }
            setGeneratedQuizzes(res.data);
        } catch (error) {
            console.error("AI Gen Failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const postGeneratedQuiz = (quizItem) => {
        startPoll(quizItem.question, quizItem.options);
        // Remove from list after posting? Or keep history?
        setGeneratedQuizzes(prev => prev.filter(q => q !== quizItem));
    };

    const startPoll = (qText = question, opts = options) => {
        if (!qText.trim()) return;
        const validOptions = opts.filter(o => o.trim());
        if (validOptions.length < 2) return;

        const pollData = {
            question: qText,
            options: validOptions,
            id: Date.now()
        };

        const payload = JSON.stringify({ type: 'POLL_START', poll: pollData });
        room.localParticipant.publishData(
            new TextEncoder().encode(payload),
            DataPacket_Kind.RELIABLE
        );

        setActivePoll(pollData); // Local update
        setViewMode('voting');
    };

    const submitVote = (index) => {
        if (myVote !== null) return;
        setMyVote(index);

        const payload = JSON.stringify({ type: 'POLL_VOTE', optionIndex: index });
        room.localParticipant.publishData(
            new TextEncoder().encode(payload),
            DataPacket_Kind.RELIABLE
        );

        // Optimistic update
        setResults(prev => ({
            ...prev,
            [index]: (prev[index] || 0) + 1
        }));
    };

    const updateOption = (idx, val) => {
        const newOpts = [...options];
        newOpts[idx] = val;
        setOptions(newOpts);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-zinc-900 border border-white/10 p-6 shadow-2xl relative overflow-hidden">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        {activePoll ? <BarChart2 size={24} /> : <HelpCircle size={24} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {activePoll ? 'Live Poll' : 'Quick Quiz'}
                        </h3>
                        {activePoll && <span className="text-xs text-green-400 font-bold uppercase tracking-wider animate-pulse">● Active</span>}
                    </div>
                </div>

                {/* Content */}
                {activePoll ? (
                    // VOTING / RESULTS VIEW
                    <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white mb-2">{activePoll.question}</h4>
                        <div className="space-y-2">
                            {activePoll.options.map((opt, i) => {
                                const count = results[i] || 0;
                                const total = Object.values(results).reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                                const isSelected = myVote === i;

                                return (
                                    <div key={i} className="relative">
                                        <button
                                            disabled={myVote !== null}
                                            onClick={() => submitVote(i)}
                                            className={`w-full relative z-10 text-left p-3 rounded-xl border transition-all flex justify-between items-center ${isSelected
                                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                                : 'bg-white/5 border-white/5 text-gray-200 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="font-medium">{opt}</span>
                                            {isSelected && <CheckCircle size={16} />}
                                        </button>

                                        {/* Result Bar Overlay */}
                                        {(myVote !== null) && (
                                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 transition-all duration-500"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <span>{percent}% ({count})</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // CREATION VIEW
                    <div className="flex flex-col h-full">
                        <div className="flex gap-4 border-b border-white/10 mb-4 pb-2">
                            <button
                                onClick={() => setCreationTab('manual')}
                                className={`text-sm font-bold pb-2 border-b-2 transition-colors ${creationTab === 'manual' ? 'text-white border-indigo-500' : 'text-zinc-500 border-transparent'}`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setCreationTab('ai')}
                                className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${creationTab === 'ai' ? 'text-indigo-400 border-indigo-500' : 'text-zinc-500 border-transparent'}`}
                            >
                                <Sparkles size={14} /> AI Helper
                            </button>
                        </div>

                        {creationTab === 'manual' ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                    placeholder="Ask a question..."
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="space-y-2">
                                    {options.map((opt, i) => (
                                        <input
                                            key={i}
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={e => updateOption(i, e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        />
                                    ))}
                                    {options.length < 4 && (
                                        <button
                                            onClick={() => setOptions([...options, ''])}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add Option
                                        </button>
                                    )}
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-white shadow-lg mt-4"
                                    onPress={() => startPoll()}
                                    isDisabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                                >
                                    Launch Poll
                                </Button>
                            </div>
                        ) : (
                            // AI HELPER TAB
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-4 rounded-xl border border-indigo-500/30">
                                    <label className="text-xs text-indigo-300 font-semibold mb-1 block">What should the quiz cover?</label>
                                    <Textarea
                                        placeholder="e.g. 'Food vocabulary for beginners' or 'Past tense verbs'"
                                        value={aiTopic}
                                        onChange={e => setAiTopic(e.target.value)}
                                        className="w-full mb-3 bg-black/40 border-white/10 text-white"
                                        minRows={2}
                                    />

                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs text-zinc-400">Questions: {aiCount}</span>
                                        <input
                                            type="range" min="1" max="5"
                                            value={aiCount}
                                            onChange={e => setAiCount(parseInt(e.target.value))}
                                            className="accent-indigo-500"
                                        />
                                    </div>

                                    <Button
                                        className="w-full bg-indigo-600 font-bold text-white shadow-lg"
                                        onPress={handleAiGenerate}
                                        isLoading={isGenerating}
                                        isDisabled={!aiTopic.trim()}
                                    >
                                        {isGenerating ? 'Generating...' : <><BrainCircuit size={18} /> Generate Questions</>}
                                    </Button>
                                </div>

                                {/* Generated Cards */}
                                {generatedQuizzes.length > 0 && (
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                        {generatedQuizzes.map((q, idx) => (
                                            <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-indigo-500/50 transition-colors group">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-white line-clamp-2">{q.question}</p>
                                                        <p className="text-xs text-zinc-500 mt-1">{q.options.length} options • Answer: {q.answer}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white min-w-0 px-3 h-8"
                                                        onPress={() => postGeneratedQuiz(q)}
                                                    >
                                                        Post
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default LiveQuiz;
