import React, { createContext, useState, useEffect, useContext } from 'react';

const ExamContext = createContext();

export const useExam = () => useContext(ExamContext);

export const ExamProvider = ({ children }) => {
    const [activeExam, setActiveExam] = useState(null);
    const [examAnswers, setExamAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isExamActive, setIsExamActive] = useState(false);
    const [showExamResults, setShowExamResults] = useState(false);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isExamActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsExamActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0 && isExamActive) {
            setIsExamActive(false);
        }
        return () => clearInterval(interval);
    }, [isExamActive, timeLeft]);

    const startExam = (exam, duration) => {
        setActiveExam(exam);
        setTimeLeft(duration);
        setIsExamActive(true);
        setExamAnswers({});
        setShowExamResults(false);
    };

    const updateAnswer = (questionId, value) => {
        setExamAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const endExam = () => {
        setIsExamActive(false);
        setShowExamResults(true);
    };

    const clearExam = () => {
        setActiveExam(null);
        setExamAnswers({});
        setIsExamActive(false);
        setShowExamResults(false);
        setTimeLeft(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <ExamContext.Provider value={{
            activeExam,
            examAnswers,
            timeLeft,
            isExamActive,
            showExamResults,
            startExam,
            updateAnswer,
            endExam,
            clearExam,
            formatTime,
            setExamAnswers, // Exposed for bulk updates if needed
            setShowExamResults
        }}>
            {children}
        </ExamContext.Provider>
    );
};
