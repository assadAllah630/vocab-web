import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, RotateCcw } from 'lucide-react';

function MobileVocabPractice({ assignment, onComplete }) {
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [progress, setProgress] = useState({});
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (assignment?.metadata?.vocab_words) {
            setWords(assignment.metadata.vocab_words);
            // Initialize progress tracking
            const initialProgress = {};
            assignment.metadata.vocab_words.forEach(w => {
                initialProgress[w.id] = { correct: 0, wrong: 0 };
            });
            setProgress(initialProgress);
        }
    }, [assignment]);

    const handleCorrect = () => {
        const wordId = words[currentIndex].id;
        const newProgress = {
            ...progress,
            [wordId]: {
                ...progress[wordId],
                correct: progress[wordId].correct + 1
            }
        };
        setProgress(newProgress);

        // Check if mastery reached
        const masteryTarget = assignment.metadata.mastery_target === 'master' ? 3 : 1;
        const allMastered = words.every(w => newProgress[w.id].correct >= masteryTarget);

        if (allMastered) {
            setIsComplete(true);
        } else {
            nextWord();
        }
    };

    const handleWrong = () => {
        const wordId = words[currentIndex].id;
        setProgress({
            ...progress,
            [wordId]: {
                ...progress[wordId],
                wrong: progress[wordId].wrong + 1
            }
        });
        nextWord();
    };

    const nextWord = () => {
        setShowAnswer(false);
        setCurrentIndex((currentIndex + 1) % words.length);
    };

    const handleFinish = () => {
        if (onComplete) {
            // Calculate stats
            const totalCorrect = Object.values(progress).reduce((sum, p) => sum + p.correct, 0);
            const totalWrong = Object.values(progress).reduce((sum, p) => sum + p.wrong, 0);
            const accuracy = totalCorrect / (totalCorrect + totalWrong) * 100;

            onComplete({
                mastered_count: words.filter(w => progress[w.id].correct >= (assignment.metadata.mastery_target === 'master' ? 3 : 1)).length,
                total: words.length,
                accuracy: Math.round(accuracy)
            });
        }
    };

    if (words.length === 0) {
        return <div className="p-5 text-white">Loading words...</div>;
    }

    if (isComplete) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-5">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">All Words Mastered!</h2>
                    <p className="text-gray-400 mb-6">Great job! You've completed this assignment.</p>
                    <button
                        onClick={handleFinish}
                        className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-white"
                    >
                        Finish Assignment
                    </button>
                </motion.div>
            </div>
        );
    }

    const currentWord = words[currentIndex];
    const wordProgress = progress[currentWord.id];

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Progress Bar */}
            <div className="p-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Word {currentIndex + 1} of {words.length}</span>
                    <span>{wordProgress.correct}/{assignment.metadata.mastery_target === 'master' ? 3 : 1} correct</span>
                </div>
                <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${(currentIndex / words.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Flashcard */}
            <div className="flex-1 flex items-center justify-center p-5">
                <motion.div
                    key={currentIndex}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: showAnswer ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md aspect-[3/4] relative"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 flex items-center justify-center cursor-pointer"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <h1 className="text-4xl font-bold text-white text-center">
                            {currentWord.word}
                        </h1>
                    </div>
                    <div
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 flex items-center justify-center cursor-pointer"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <h1 className="text-3xl font-bold text-white text-center">
                            {currentWord.translation}
                        </h1>
                    </div>
                </motion.div>
            </div>

            {/* Action Buttons */}
            {showAnswer && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-5 flex gap-3"
                >
                    <button
                        onClick={handleWrong}
                        className="flex-1 py-4 bg-red-600 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                    >
                        <X size={20} />
                        Wrong
                    </button>
                    <button
                        onClick={handleCorrect}
                        className="flex-1 py-4 bg-green-600 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={20} />
                        Correct
                    </button>
                </motion.div>
            )}

            {!showAnswer && (
                <div className="p-5">
                    <button
                        onClick={() => setShowAnswer(true)}
                        className="w-full py-4 bg-[#27272A] rounded-xl font-bold text-white"
                    >
                        Show Answer
                    </button>
                </div>
            )}
        </div>
    );
}

export default MobileVocabPractice;
