import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Laptop, Globe, Users } from 'lucide-react';

const MobileTeacherLanding = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#09090B] pb-24 text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20" />
                <div className="relative p-6 pt-12 text-center">
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Become a <br />VocabMaster Teacher
                    </h1>
                    <p className="text-gray-400 text-lg mb-8 max-w-sm mx-auto">
                        Join our exclusive community of elite language educators. Teach your way, from anywhere.
                    </p>
                    <button
                        onClick={() => navigate('/teacher-login')}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        Start Application <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Features */}
            <div className="px-6 space-y-8 mt-8">
                <Feature
                    icon={Laptop}
                    title="Digital Classroom"
                    desc="Powerful tools to manage students, assignments, and live sessions effortlessly."
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                />
                <Feature
                    icon={Globe}
                    title="Global Reach"
                    desc="Connect with motivated students from around the world who are eager to learn."
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                />
                <Feature
                    icon={Users}
                    title="Smart Analytics"
                    desc="Track student progress with AI-driven insights and detailed performance reports."
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                />
            </div>

            {/* Requirements */}
            <div className="mt-12 px-6">
                <h3 className="text-xl font-bold mb-6">Requirements</h3>
                <div className="space-y-4">
                    <Requirement text="Professional Teaching Experience" />
                    <Requirement text="Native or C2 Level Proficiency" />
                    <Requirement text="Stable Internet Connection" />
                    <Requirement text="Introduction Video" />
                </div>
            </div>

            {/* Footer CTA */}
            <div className="mt-12 px-6 pb-6 text-center">
                <p className="text-gray-500 text-sm mb-4">Ready to inspire?</p>
                <button
                    onClick={() => navigate('/teacher-login')}
                    className="w-full bg-[#1C1C1F] border border-[#27272A] text-white font-medium py-3 rounded-xl hover:bg-[#27272A] transition-colors"
                >
                    Apply Now
                </button>
            </div>
        </div>
    );
};

const Feature = ({ icon: Icon, title, desc, color, bg }) => (
    <div className="flex gap-4">
        <div className={`${bg} ${color} p-3 rounded-xl h-fit`}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

const Requirement = ({ text }) => (
    <div className="flex items-center gap-3">
        <div className="bg-green-500/10 p-1 rounded-full">
            <Check size={14} className="text-green-500" />
        </div>
        <span className="text-gray-300 font-medium">{text}</span>
    </div>
);

export default MobileTeacherLanding;
