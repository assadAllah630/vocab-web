import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const ClozeQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section || !section.text) return null;
    const parts = section.text.split(/\[blank(?:\s+\d+)?\]/g);
    const blanks = section.blanks || [];

    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Fill in the blanks</h3>
            <p className="text-slate-600 mb-6">{section.instruction || 'Fill in the blanks with the correct words.'}</p>

            <div className="leading-loose text-lg text-slate-800">
                {parts.map((part, index) => {
                    const blank = blanks[index];
                    if (index < parts.length - 1 && blank) {
                        const userAnswer = answers[blank.id] || '';
                        const isCorrect = userAnswer.toLowerCase() === blank.answer.toLowerCase();

                        return (
                            <React.Fragment key={index}>
                                {part}
                                <span className="inline-flex flex-col align-middle mx-2">
                                    <select
                                        className={`px-3 py-1 border rounded-md outline-none transition-colors ${showResults
                                            ? isCorrect
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-slate-300 bg-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                                            }`}
                                        onChange={(e) => onAnswer(blank.id, e.target.value)}
                                        value={userAnswer}
                                        disabled={showResults}
                                    >
                                        <option value="">---</option>
                                        {(blank.options || []).map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {showResults && !isCorrect && (
                                        <span className="text-xs text-green-600 font-bold mt-1">
                                            {blank.answer}
                                        </span>
                                    )}
                                </span>
                            </React.Fragment>
                        );
                    }
                    return <React.Fragment key={index}>{part}</React.Fragment>;
                })}
            </div>
        </div>
    );
};

export const MultipleChoiceQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section) return null;
    const questions = section.questions || [];

    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Multiple Choice</h3>
            <p className="text-slate-600 mb-6">{section.instruction || 'Choose the correct answer for each question.'}</p>

            <div className="space-y-8">
                {questions.map((q, qIndex) => {
                    const questionId = q.id || `mc-${qIndex}`;
                    const userAnswer = answers[questionId];

                    return (
                        <div key={qIndex} className="space-y-3">
                            <p className="font-medium text-slate-900">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2 ml-4">
                                {(q.options || []).map((opt, optIndex) => {
                                    const isSelected = userAnswer === opt;
                                    const correctVal = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_index;
                                    const correctText = typeof correctVal === 'number' ? q.options[correctVal] : correctVal;
                                    const isCorrect = correctText === opt;

                                    let itemClass = "flex items-center gap-3 p-2 rounded-lg transition-colors ";
                                    if (showResults) {
                                        if (isCorrect) itemClass += "bg-green-100 border border-green-200";
                                        else if (isSelected) itemClass += "bg-red-100 border border-red-200";
                                        else itemClass += "opacity-50";
                                    } else {
                                        itemClass += "cursor-pointer hover:bg-slate-50";
                                    }

                                    return (
                                        <label key={optIndex} className={itemClass}>
                                            <input
                                                type="radio"
                                                name={questionId}
                                                className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                                                onChange={() => onAnswer(questionId, opt)}
                                                checked={isSelected}
                                                disabled={showResults}
                                            />
                                            <span className={`flex-1 ${showResults && isCorrect ? 'text-green-800 font-bold' :
                                                showResults && isSelected ? 'text-red-800' : 'text-slate-700'
                                                }`}>
                                                {opt}
                                            </span>
                                            {showResults && isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                                            {showResults && isSelected && !isCorrect && <XCircleIcon className="w-5 h-5 text-red-600" />}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const MatchingQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section) return null;
    const pairs = section.pairs || [];

    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Matching</h3>
            <p className="text-slate-600 mb-6">{section.instruction || 'Match each item on the left with its corresponding item on the right.'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {pairs.map((pair, index) => {
                    const questionId = pair.id || `match-${index}`;
                    const userAnswer = answers[questionId] || '';
                    const isCorrect = userAnswer === pair.right;

                    return (
                        <React.Fragment key={index}>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center">
                                <span className="font-medium text-slate-700">{pair.left}</span>
                            </div>
                            <div className="flex flex-col">
                                <select
                                    className={`w-full p-3 border rounded-lg outline-none transition-colors ${showResults
                                        ? isCorrect
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-300 bg-white focus:ring-2 focus:ring-primary-500'
                                        }`}
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
                                    <span className="text-xs text-green-600 font-bold mt-1 px-1">
                                        Correct: {pair.right}
                                    </span>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export const ReadingQuestion = ({ section, onAnswer, answers, showResults }) => {
    if (!section) return null;
    const questions = section.questions || [];

    return (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Reading Comprehension</h3>
            <p className="text-slate-600 mb-6">{section.instruction || 'Read the text and answer the questions below.'}</p>

            <div className="prose prose-slate max-w-none mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                {section.text || 'No text provided.'}
            </div>

            <div className="space-y-8">
                {questions.map((q, qIndex) => {
                    const questionId = q.id || `read-${qIndex}`;
                    const userAnswer = answers[questionId];

                    return (
                        <div key={qIndex} className="space-y-3">
                            <p className="font-medium text-slate-900">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2 ml-4">
                                {(q.options || []).map((opt, optIndex) => {
                                    const isSelected = userAnswer === opt;
                                    const correctVal = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_index;
                                    const correctText = typeof correctVal === 'number' ? q.options[correctVal] : correctVal;
                                    const isCorrect = correctText === opt;

                                    let itemClass = "flex items-center gap-3 p-2 rounded-lg transition-colors ";
                                    if (showResults) {
                                        if (isCorrect) itemClass += "bg-green-100 border border-green-200";
                                        else if (isSelected) itemClass += "bg-red-100 border border-red-200";
                                        else itemClass += "opacity-50";
                                    } else {
                                        itemClass += "cursor-pointer hover:bg-slate-50";
                                    }

                                    return (
                                        <label key={optIndex} className={itemClass}>
                                            <input
                                                type="radio"
                                                name={questionId}
                                                className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                                                onChange={() => onAnswer(questionId, opt)}
                                                checked={isSelected}
                                                disabled={showResults}
                                            />
                                            <span className={`flex-1 ${showResults && isCorrect ? 'text-green-800 font-bold' :
                                                showResults && isSelected ? 'text-red-800' : 'text-slate-700'
                                                }`}>
                                                {opt}
                                            </span>
                                            {showResults && isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                                            {showResults && isSelected && !isCorrect && <XCircleIcon className="w-5 h-5 text-red-600" />}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

