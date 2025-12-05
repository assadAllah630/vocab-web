import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const MobileExamPlay = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#09090B] p-4">
            <button
                onClick={() => navigate('/m/exam')}
                className="flex items-center gap-2 text-[#A1A1AA] mb-6"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                Back
            </button>
            <h1 className="text-2xl font-bold text-white mb-4">Play Exam</h1>
            <p className="text-[#71717A]">Exam play mode coming soon...</p>
        </div>
    );
};

export default MobileExamPlay;
