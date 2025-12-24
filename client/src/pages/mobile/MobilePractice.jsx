import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Layers,         // Review
    Brain,          // Quiz
    Gamepad2,       // Games
    BookOpen,       // Reader
    Headphones,     // Podcast
    Mic,            // Speak
    PenTool,        // Write
    FileText,       // Grammar
    Sparkles,       // AI
    ChevronRight,
    Search,
    Users
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

function MobilePractice() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    // Defined Hierarchy based on UX Vision
    const skillSections = [
        {
            id: 'review',
            title: '🧠 Review',
            tools: [
                { id: 'flashcards', title: t('flashcards'), desc: 'Spaced repetition', icon: Layers, path: '/m/practice/flashcard?hlr=true', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { id: 'quiz', title: t('quiz'), desc: 'Test knowledge', icon: Brain, path: '/m/exam', color: 'text-violet-400', bg: 'bg-violet-500/10' }
            ]
        },
        {
            id: 'play',
            title: '🎮 Play',
            tools: [
                { id: 'arcade', title: t('games'), desc: 'Memory, Speed, etc.', icon: Gamepad2, path: '/m/games', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
            ]
        },
        {
            id: 'speak',
            title: '🗣️ Speak',
            tools: [
                { id: 'studio', title: 'Podcast Studio', desc: 'Record & Create', icon: Mic, path: '/m/podcast-studio', color: 'text-pink-400', bg: 'bg-pink-500/10' },
                { id: 'live', title: 'Live Class', desc: 'Join sessions', icon: Users, path: '/m/sessions', color: 'text-red-400', bg: 'bg-red-500/10' },
                { id: 'podcasts', title: 'Listen', desc: 'AI Podcasts', icon: Headphones, path: '/m/podcast-library', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' }
            ]
        },
        {
            id: 'read',
            title: '📖 Read',
            tools: [
                { id: 'reader', title: 'Smart Reader', desc: 'Analyze text', icon: BookOpen, path: '/m/reader', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { id: 'library', title: 'Content Library', desc: 'Saved stories', icon: FileText, path: '/m/ai/library', color: 'text-orange-400', bg: 'bg-orange-500/10' }
            ]
        },
        {
            id: 'write',
            title: '✍️ Write',
            tools: [
                { id: 'grammar', title: t('grammar'), desc: 'Rules & Drills', icon: PenTool, path: '/m/grammar', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { id: 'ai-gen', title: 'AI Generator', desc: 'Create lessons', icon: Sparkles, path: '/m/ai', color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
            ]
        }
    ];

    // Filter tools based on search
    const filteredSections = skillSections.map(section => ({
        ...section,
        tools: section.tools.filter(tool =>
            tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.desc.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => section.tools.length > 0);

    return (
        <div className="min-h-screen bg-[#09090B] pb-24">
            {/* Header */}
            <div className="px-5 pt-14 pb-4 sticky top-0 z-10 bg-[#09090B]/95 backdrop-blur-md border-b border-[#27272A]">
                <h1 className="text-2xl font-bold text-white mb-4">{t('practice')}</h1>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Content Groups */}
            <div className="px-5 pt-6 space-y-8">
                {filteredSections.map(section => (
                    <div key={section.id}>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                            {section.title}
                        </h2>
                        <div className="grid gap-3">
                            {section.tools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => navigate(tool.path)}
                                    className="bg-[#141416] border border-[#27272A] p-4 rounded-xl flex items-center gap-4 hover:bg-[#1C1C1F] active:scale-[0.98] transition-all"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.bg}`}>
                                        <tool.icon size={24} className={tool.color} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-bold text-white text-base">{tool.title}</h3>
                                        <p className="text-sm text-gray-500">{tool.desc}</p>
                                    </div>
                                    <ChevronRight className="text-gray-600" size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredSections.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No tools found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MobilePractice;
