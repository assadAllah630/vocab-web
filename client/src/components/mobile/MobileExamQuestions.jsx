import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

// Mobile-optimized Cloze Question (Fill in the blanks)
export const MobileClozeQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section || !section.text) return null;
    const parts = section.text.split(/\[blank(?:\s+\d+)?\]/g);
    const blanks = section.blanks || [];

    return (
        <div className="space-y-4">
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#1C1C1F' }}>
                <p className="text-sm" style={{ color: '#A1A1AA' }}>
                    {section.instruction || 'Fill in the blanks with the correct words.'}
                </p>
            </div>

            <div className="text-base leading-relaxed" style={{ color: '#FAFAFA' }}>
                {parts.map((part, index) => {
                    const blank = blanks[index];
                    if (index < parts.length - 1 && blank) {
                        const userAnswer = answers[blank.id] || '';
                        const isCorrect = userAnswer.toLowerCase() === blank.answer.toLowerCase();

                        return (
                            <React.Fragment key={index}>
                                <span>{part}</span>
                                <span className="inline-block mx-1 my-1">
                                    <select
                                        className="px-3 py-2 rounded-lg text-sm font-medium outline-none transition-all"
                                        style={{
                                            backgroundColor: showResults
                                                ? isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                                                : '#27272A',
                                            border: `1px solid ${showResults
                                                ? isCorrect ? '#22C55E' : '#EF4444'
                                                : '#3F3F46'}`,
                                            color: showResults
                                                ? isCorrect ? '#22C55E' : '#EF4444'
                                                : '#FAFAFA'
                                        }}
                                        onChange={(e) => onAnswer(blank.id, e.target.value)}
                                        value={userAnswer}
                                        disabled={showResults}
                                    >
                                        <option value="">Select...</option>
                                        {(blank.options || []).map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {showResults && !isCorrect && (
                                        <span className="block text-xs mt-1" style={{ color: '#22C55E' }}>
                                            ✓ {blank.answer}
                                        </span>
                                    )}
                                </span>
                            </React.Fragment>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>
        </div>
    );
};

// Mobile-optimized Multiple Choice Question
export const MobileMultipleChoiceQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section) return null;
    const questions = section.questions || [];

    return (
        <div className="space-y-6">
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#1C1C1F' }}>
                <p className="text-sm" style={{ color: '#A1A1AA' }}>
                    {section.instruction || 'Choose the correct answer for each question.'}
                </p>
            </div>

            {questions.map((q, qIndex) => {
                const questionId = q.id || `mc-${qIndex}`;
                const userAnswer = answers[questionId];

                return (
                    <motion.div
                        key={qIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: qIndex * 0.05 }}
                        className="space-y-3"
                    >
                        <p className="font-medium text-base" style={{ color: '#FAFAFA' }}>
                            {qIndex + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                            {(q.options || []).map((opt, optIndex) => {
                                const isSelected = userAnswer === opt;
                                const correctVal = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_index;
                                const correctText = typeof correctVal === 'number' ? q.options[correctVal] : correctVal;
                                const isCorrect = correctText === opt;

                                return (
                                    <motion.button
                                        key={optIndex}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => !showResults && onAnswer(questionId, opt)}
                                        className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                                        style={{
                                            backgroundColor: showResults
                                                ? isCorrect ? 'rgba(34, 197, 94, 0.15)' : isSelected ? 'rgba(239, 68, 68, 0.15)' : '#1C1C1F'
                                                : isSelected ? 'rgba(99, 102, 241, 0.2)' : '#1C1C1F',
                                            border: `1px solid ${showResults
                                                ? isCorrect ? '#22C55E' : isSelected ? '#EF4444' : '#27272A'
                                                : isSelected ? '#6366F1' : '#27272A'}`
                                        }}
                                        disabled={showResults}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: showResults
                                                    ? isCorrect ? '#22C55E' : isSelected ? '#EF4444' : '#27272A'
                                                    : isSelected ? '#6366F1' : '#27272A',
                                                border: isSelected || (showResults && isCorrect) ? 'none' : '2px solid #3F3F46'
                                            }}
                                        >
                                            {showResults && isCorrect && <Check size={14} color="#FFFFFF" />}
                                            {showResults && isSelected && !isCorrect && <X size={14} color="#FFFFFF" />}
                                            {!showResults && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <span
                                            className="flex-1 text-sm"
                                            style={{
                                                color: showResults && isCorrect ? '#22C55E' : showResults && isSelected ? '#EF4444' : '#FAFAFA'
                                            }}
                                        >
                                            {opt}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// Mobile-optimized Matching Question
export const MobileMatchingQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section) return null;
    const pairs = section.pairs || [];

    return (
        <div className="space-y-4">
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#1C1C1F' }}>
                <p className="text-sm" style={{ color: '#A1A1AA' }}>
                    {section.instruction || 'Match each item on the left with its corresponding item on the right.'}
                </p>
            </div>

            <div className="space-y-3">
                {pairs.map((pair, index) => {
                    const questionId = pair.id || `match-${index}`;
                    const userAnswer = answers[questionId] || '';
                    const isCorrect = userAnswer === pair.right;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl p-4"
                            style={{
                                backgroundColor: '#141416',
                                border: `1px solid ${showResults ? (isCorrect ? '#22C55E' : '#EF4444') : '#27272A'}`
                            }}
                        >
                            <div className="font-medium mb-3" style={{ color: '#FAFAFA' }}>
                                {pair.left}
                            </div>
                            <select
                                className="w-full px-4 py-3 rounded-lg text-sm font-medium outline-none transition-all"
                                style={{
                                    backgroundColor: showResults
                                        ? isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                                        : '#27272A',
                                    border: `1px solid ${showResults
                                        ? isCorrect ? '#22C55E' : '#EF4444'
                                        : '#3F3F46'}`,
                                    color: showResults
                                        ? isCorrect ? '#22C55E' : '#EF4444'
                                        : '#FAFAFA'
                                }}
                                onChange={(e) => onAnswer(questionId, e.target.value)}
                                value={userAnswer}
                                disabled={showResults}
                            >
                                <option value="">Select match...</option>
                                {pairs.map((p, i) => (
                                    <option key={i} value={p.right}>{p.right}</option>
                                ))}
                            </select>
                            {showResults && !isCorrect && (
                                <div className="mt-2 text-xs" style={{ color: '#22C55E' }}>
                                    ✓ Correct: {pair.right}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

// Mobile-optimized Reading Comprehension Question
export const MobileReadingQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section) return null;
    const questions = section.questions || [];

    return (
        <div className="space-y-6">
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#1C1C1F' }}>
                <p className="text-sm" style={{ color: '#A1A1AA' }}>
                    {section.instruction || 'Read the text and answer the questions below.'}
                </p>
            </div>

            {/* Reading Text */}
            <div
                className="p-5 rounded-xl text-sm leading-relaxed"
                style={{
                    backgroundColor: '#141416',
                    border: '1px solid #27272A',
                    color: '#E4E4E7'
                }}
            >
                {section.text || 'No text provided.'}
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {questions.map((q, qIndex) => {
                    const questionId = q.id || `read-${qIndex}`;
                    const userAnswer = answers[questionId];

                    return (
                        <motion.div
                            key={qIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: qIndex * 0.05 }}
                            className="space-y-3"
                        >
                            <p className="font-medium text-base" style={{ color: '#FAFAFA' }}>
                                {qIndex + 1}. {q.question}
                            </p>
                            <div className="space-y-2">
                                {(q.options || []).map((opt, optIndex) => {
                                    const isSelected = userAnswer === opt;
                                    const correctVal = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_index;
                                    const correctText = typeof correctVal === 'number' ? q.options[correctVal] : correctVal;
                                    const isCorrect = correctText === opt;

                                    return (
                                        <motion.button
                                            key={optIndex}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => !showResults && onAnswer(questionId, opt)}
                                            className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                                            style={{
                                                backgroundColor: showResults
                                                    ? isCorrect ? 'rgba(34, 197, 94, 0.15)' : isSelected ? 'rgba(239, 68, 68, 0.15)' : '#1C1C1F'
                                                    : isSelected ? 'rgba(99, 102, 241, 0.2)' : '#1C1C1F',
                                                border: `1px solid ${showResults
                                                    ? isCorrect ? '#22C55E' : isSelected ? '#EF4444' : '#27272A'
                                                    : isSelected ? '#6366F1' : '#27272A'}`
                                            }}
                                            disabled={showResults}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: showResults
                                                        ? isCorrect ? '#22C55E' : isSelected ? '#EF4444' : '#27272A'
                                                        : isSelected ? '#6366F1' : '#27272A',
                                                    border: isSelected || (showResults && isCorrect) ? 'none' : '2px solid #3F3F46'
                                                }}
                                            >
                                                {showResults && isCorrect && <Check size={14} color="#FFFFFF" />}
                                                {showResults && isSelected && !isCorrect && <X size={14} color="#FFFFFF" />}
                                                {!showResults && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <span
                                                className="flex-1 text-sm"
                                                style={{
                                                    color: showResults && isCorrect ? '#22C55E' : showResults && isSelected ? '#EF4444' : '#FAFAFA'
                                                }}
                                            >
                                                {opt}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
