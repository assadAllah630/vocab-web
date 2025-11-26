import React from 'react';

function Logo({ className = "h-8 w-8", textClassName = "text-xl" }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${className}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3/4 h-3/4">
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.477V5.25c0-.142.018-.282.054-.422a9.75 9.75 0 00-9 0c.036.14.054.28.054.422v15.386z" />
                </svg>
            </div>
            <span className={`font-bold text-slate-900 tracking-tight ${textClassName}`}>
                VocabMaster
            </span>
        </div>
    );
}

export default Logo;
