import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, BookOpen, PenTool, Mic, Brain,
    Settings, Bell, Key, ChevronRight, Plus,
    Layout, Database, ExternalLink, User,
    FileText, GraduationCap, Headphones
} from 'lucide-react';
import { Button, Card, Chip, Avatar, Tooltip } from '@heroui/react';
import MobileContentLibrary from './MobileContentLibrary';

/**
 * MobileTeacherWorkspace
 * A professional "Studio" for teachers to manage materials, 
 * generators, and classroom settings.
 */
const MobileTeacherWorkspace = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('library');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const studioTools = [
        { id: 'story', title: 'Story Lab', desc: 'Generate AI Stories', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', path: '/m/ai/story' },
        { id: 'exam', title: 'Exam Builder', desc: 'Create AI or Manual Exams', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/m/exam/create' },
        { id: 'podcast', title: 'Podcast Studio', desc: 'Voice-over & Scripts', icon: Mic, color: 'text-pink-400', bg: 'bg-pink-500/10', path: '/m/podcast-studio' },
        { id: 'grammar', title: 'Grammar Lab', desc: 'Rules & Practice', icon: Brain, color: 'text-green-400', bg: 'bg-green-500/10', path: '/m/grammar/generate' },
    ];

    const utilityTools = [
        { title: 'Reader Tool', desc: 'Format & Save Web Content', icon: FileText, path: '/m/reader' },
        { title: 'External Podcasts', desc: 'RSS & Curation', icon: ExternalLink, path: '/m/podcasts/external' },
    ];

    const settingsLinks = [
        { title: 'AI Gateway', icon: Key, path: '/m/ai-gateway' },
        { title: 'Notifications', icon: Bell, path: '/m/notifications' },
        { title: 'Studio Profile', icon: User, path: '/m/teacher/profile' },
    ];

    return (
        <div className="min-h-screen bg-[#09090B] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden pb-24">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 pt-12 pb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Teacher Studio
                        </h1>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={12} className="text-indigo-500" />
                            Command Center & Materials
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 px-6 space-y-8">

                {/* 1. Quick Generators Grid */}
                <section>
                    <SectionHeader title="Studio Tools" count={studioTools.length} />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {studioTools.map(tool => (
                            <ToolCard key={tool.id} tool={tool} onClick={() => navigate(tool.path)} />
                        ))}
                    </div>
                </section>

                {/* 2. Library / Materials Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <SectionHeader title="My Materials" />
                        <div className="flex bg-[#1C1C1F] rounded-lg p-1 border border-white/5">
                            {['library', 'podcast', 'exams'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#141416]/50 rounded-2xl border border-white/5 overflow-hidden min-h-[400px]">
                        {activeTab === 'library' ? (
                            <MobileContentLibrary teacherMode={true} />
                        ) : activeTab === 'podcast' ? (
                            <div className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                                    <Headphones size={32} />
                                </div>
                                <h3 className="font-black text-lg">Podcast Scripts</h3>
                                <p className="text-gray-500 text-xs">Manage your AI-generated radio shows and scripts.</p>
                                <Button
                                    className="bg-indigo-600 font-black text-white"
                                    onPress={() => navigate('/m/podcast-studio')}
                                >
                                    OPEN STUDIO
                                </Button>
                            </div>
                        ) : (
                            <div className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <GraduationCap className="text-gray-600" size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400">Exams Hub</p>
                                    <p className="text-xs text-gray-500 mt-1">Visit the Exam Builder to create or edit tests.</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    className="bg-indigo-600/20 text-indigo-400 font-bold"
                                    onClick={() => navigate('/m/exam/create')}
                                >
                                    Open Exam Builder
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Utilities & External */}
                <section className="space-y-4">
                    <SectionHeader title="Utilities" />
                    <div className="space-y-3">
                        {utilityTools.map(tool => (
                            <UtilityRow key={tool.title} {...tool} />
                        ))}
                    </div>
                </section>

                {/* 4. Infrastructure & Settings */}
                <section className="space-y-4">
                    <SectionHeader title="Workspace Setup" />
                    <div className="grid grid-cols-3 gap-3">
                        {settingsLinks.map(link => (
                            <motion.button
                                key={link.title}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(link.path)}
                                className="bg-[#1C1C1F] border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2"
                            >
                                <link.icon size={20} className="text-indigo-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{link.title.split(' ')[0]}</span>
                            </motion.button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

const SectionHeader = ({ title, count }) => (
    <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-white/90">{title}</h2>
        {count !== undefined && (
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-black">
                {count}
            </span>
        )}
    </div>
);

const ToolCard = ({ tool, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="bg-[#1C1C1F] border border-[#27272A] p-4 rounded-2xl flex flex-col items-start gap-3 group hover:border-indigo-500/50 transition-colors"
    >
        <div className={`p-2 rounded-xl ${tool.bg} ${tool.color}`}>
            <tool.icon size={20} />
        </div>
        <div className="text-left">
            <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{tool.title}</h4>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{tool.desc}</p>
        </div>
    </motion.button>
);

const UtilityRow = ({ title, desc, icon: Icon, path }) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(path)}
            className="w-full flex items-center justify-between p-4 bg-[#141416] border border-white/5 rounded-2xl hover:bg-[#1C1C1F] transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon size={20} className="text-gray-400" />
                </div>
                <div className="text-left">
                    <h4 className="font-bold text-sm text-white">{title}</h4>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                </div>
            </div>
            <ChevronRight size={16} className="text-gray-700" />
        </button>
    );
};

export default MobileTeacherWorkspace;
