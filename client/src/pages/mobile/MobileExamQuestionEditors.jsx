import React, { useState } from 'react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Multiple Choice Editor ---
export const MCQEditor = ({ questions, onChange }) => {
    const addQuestion = () => {
        onChange([
            ...questions,
            { id: Date.now(), text: '', options: ['', '', '', ''], correct_index: 0 }
        ]);
    };

    const updateQuestion = (id, field, value) => {
        onChange(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (qId, optIdx, value) => {
        onChange(questions.map(q => {
            if (q.id !== qId) return q;
            const newOpts = [...q.options];
            newOpts[optIdx] = value;
            return { ...q, options: newOpts };
        }));
    };

    const removeQuestion = (id) => {
        onChange(questions.filter(q => q.id !== id));
    };

    return (
        <div className="space-y-6">
            {questions.map((q, idx) => (
                <div key={q.id} className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A]">
                    <div className="flex justify-between mb-3">
                        <span className="text-sm font-bold text-gray-400">Question {idx + 1}</span>
                        <button onClick={() => removeQuestion(q.id)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>

                    <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                        className="w-full bg-[#141416] border border-[#27272A] rounded-lg p-3 text-white mb-3 focus:border-indigo-500 outline-none"
                        placeholder="Enter your question here..."
                    />

                    <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                                <button
                                    onClick={() => updateQuestion(q.id, 'correct_index', optIdx)}
                                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${q.correct_index === optIdx
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-[#3F3F46]'
                                        }`}
                                >
                                    {q.correct_index === optIdx && <Check size={14} className="text-white" />}
                                </button>
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                    className="flex-1 bg-[#27272A] rounded-lg p-2 text-sm text-gray-200 focus:bg-[#3F3F46] outline-none transition-colors"
                                    placeholder={`Option ${optIdx + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={addQuestion}
                className="w-full py-3 bg-[#27272A] rounded-xl text-indigo-400 font-bold border border-dashed border-[#3F3F46] hover:bg-[#3F3F46] transition-colors"
            >
                + Add Question
            </button>
        </div>
    );
};

// --- Cloze (Fill-in-Blanks) Editor ---
export const ClozeEditor = ({ items, onChange }) => {
    // items here is simply a list of objects like { id, text, blanks: [] }
    // But for a simple UI, we might just let them write text and use [brackets] for blanks

    // Simplified: One text block per item, parsing brackets for blanks
    const addItem = () => {
        onChange([...items, { id: Date.now(), text: '', answer: '' }]); // answer is derived usually
    };

    // Better Approach for MVP: "Write sentence, highlight word to blank it" is complex.
    // Let's use simple [bracket] syntax: "The [cat] sat on the [mat]"

    const updateItem = (id, text) => {
        // Auto-extract answers from brackets
        const matches = [...text.matchAll(/\[(.*?)\]/g)];
        const answer = matches.length > 0 ? matches[0][1] : '';

        onChange(items.map(i => i.id === id ? { ...i, text, answer } : i));
    };

    const removeItem = (id) => onChange(items.filter(i => i.id !== id));

    return (
        <div className="space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl text-xs text-indigo-300">
                Tip: Use brackets to create blanks. <br />
                Example: "The <b>[cat]</b> sat on the mat."
            </div>

            {items.map((item, idx) => (
                <div key={item.id} className="flex gap-2 items-start">
                    <span className="mt-3 text-xs font-bold text-gray-500">{idx + 1}.</span>
                    <textarea
                        value={item.text}
                        onChange={(e) => updateItem(item.id, e.target.value)}
                        className="flex-1 bg-[#1C1C1F] border border-[#27272A] rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm min-h-[80px]"
                        placeholder="Type sentence here..."
                    />
                    <button onClick={() => removeItem(item.id)} className="mt-3 text-[#3F3F46] hover:text-red-400">
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="w-full py-3 mt-2 bg-[#27272A] rounded-xl text-indigo-400 font-bold border border-dashed border-[#3F3F46]"
            >
                + Add Sentence
            </button>
        </div>
    );
};

// --- Matching Editor ---
export const MatchingEditor = ({ pairs, onChange }) => {
    const addPair = () => {
        onChange([...pairs, { id: Date.now(), left: '', right: '' }]);
    };

    const updatePair = (id, side, value) => {
        onChange(pairs.map(p => p.id === id ? { ...p, [side]: value } : p));
    };

    const removePair = (id) => onChange(pairs.filter(p => p.id !== id));

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 px-1">
                <span className="text-xs font-bold text-gray-500">Left Side (Prompt)</span>
                <span className="text-xs font-bold text-gray-500">Right Side (Match)</span>
                <span className="w-8"></span>
            </div>

            {pairs.map((pair) => (
                <div key={pair.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input
                        value={pair.left}
                        onChange={(e) => updatePair(pair.id, 'left', e.target.value)}
                        className="bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                        placeholder="e.g. Dog"
                    />
                    <input
                        value={pair.right}
                        onChange={(e) => updatePair(pair.id, 'right', e.target.value)}
                        className="bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                        placeholder="e.g. Hund"
                    />
                    <button onClick={() => removePair(pair.id)} className="p-2 text-[#3F3F46] hover:text-red-400">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            <button
                onClick={addPair}
                className="w-full py-3 mt-4 bg-[#27272A] rounded-xl text-indigo-400 font-bold border border-dashed border-[#3F3F46]"
            >
                + Add Pair
            </button>
        </div>
    );
};
