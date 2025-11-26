import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function QuizSelector() {
    const [useHLR, setUseHLR] = useState(false);

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-slate-900 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Practice Mode
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Select a mode to test your knowledge and improve your skills.
                </p>

                <div className="mt-8 flex justify-center">
                    <label className="inline-flex items-center cursor-pointer bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            checked={useHLR}
                            onChange={(e) => setUseHLR(e.target.checked)}
                        />
                        <span className="ml-3 text-slate-700 font-medium select-none">Use Smart Scheduling (HLR)</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                <QuizModeCard
                    title="Flashcards"
                    desc="Flip cards to learn meanings and test your recall."
                    icon="🎴"
                    color="bg-orange-50 text-orange-700 ring-orange-600/20"
                    link={`/quiz/play/flashcard?hlr=${useHLR}`}
                />
                <QuizModeCard
                    title="Translation"
                    desc="Choose the correct translation from multiple options."
                    icon="🔤"
                    color="bg-blue-50 text-blue-700 ring-blue-700/10"
                    link={`/quiz/play/translation?hlr=${useHLR}`}
                />
                <QuizModeCard
                    title="Writing"
                    desc="Type the correct word to practice spelling and recall."
                    icon="✍️"
                    color="bg-green-50 text-green-700 ring-green-600/20"
                    link={`/quiz/play/writing?hlr=${useHLR}`}
                />
                <QuizModeCard
                    title="Listening"
                    desc="Type what you hear to practice listening comprehension."
                    icon="🎧"
                    color="bg-purple-50 text-purple-700 ring-purple-600/20"
                    link={`/quiz/play/listening?hlr=${useHLR}`}
                />
                <QuizModeCard
                    title="Context Mode"
                    desc="Fill in the blank to master word usage in sentences."
                    icon="💬"
                    color="bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                    link={`/quiz/play/context?hlr=${useHLR}`}
                />
            </div>
        </div>
    );
}

function QuizModeCard({ title, desc, icon, color, link }) {
    return (
        <Link
            to={link}
            className={`relative flex flex-col gap-4 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ring-1 ring-inset ${color} bg-white`}
        >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color.split(' ')[0]} text-2xl`}>
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-semibold leading-7 text-slate-900">
                    {title}
                </h3>
                <p className="mt-2 text-base leading-7 text-slate-600">
                    {desc}
                </p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-sm font-semibold leading-6 text-slate-900">
                Start Now <span aria-hidden="true">→</span>
            </div>
        </Link>
    );
}

export default QuizSelector;
