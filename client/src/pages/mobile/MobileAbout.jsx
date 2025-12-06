import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, Heart, Github, Twitter, Globe } from 'lucide-react';

const MobileAbout = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="sticky top-0 z-20 px-4 py-4 flex items-center gap-4"
                style={{
                    backgroundColor: 'rgba(10, 10, 11, 0.9)',
                    backdropFilter: 'blur(10px)',
                    paddingTop: 'env(safe-area-inset-top, 16px)'
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-xl"
                    style={{ backgroundColor: '#18181B' }}
                >
                    <ArrowLeft size={20} style={{ color: '#A1A1AA' }} />
                </button>
                <h1 className="text-lg font-semibold" style={{ color: '#FAFAFA' }}>
                    About
                </h1>
            </div>

            <div className="px-5 pt-6">
                {/* Logo & Name */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <div
                        className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                    >
                        <span className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>V</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#FAFAFA' }}>
                        VocabMaster
                    </h2>
                    <p className="text-sm" style={{ color: '#71717A' }}>
                        Version 1.0.0
                    </p>
                </motion.div>

                {/* Description */}
                <div
                    className="rounded-xl p-5 mb-6"
                    style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                >
                    <p className="text-sm leading-relaxed" style={{ color: '#A1A1AA' }}>
                        VocabMaster is an AI-powered vocabulary learning app that uses spaced repetition
                        (HLR algorithm) to help you learn new words effectively. Generate stories,
                        flashcards, exams, and more to master any language.
                    </p>
                </div>

                {/* Features */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium mb-3" style={{ color: '#71717A' }}>
                        Features
                    </h3>
                    <div className="space-y-2">
                        {[
                            '🧠 AI-powered vocabulary generation',
                            '📚 Spaced repetition (HLR) for effective learning',
                            '📖 Stories, articles, and dialogues',
                            '🎮 Fun games to practice words',
                            '📝 Exams and flashcards',
                            '📊 Progress tracking and analytics'
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="px-4 py-3 rounded-xl text-sm"
                                style={{ backgroundColor: '#141416', color: '#FAFAFA' }}
                            >
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Built With Love */}
                <div className="text-center py-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-sm" style={{ color: '#71717A' }}>Built with</span>
                        <Heart size={16} style={{ color: '#EF4444' }} fill="#EF4444" />
                        <span className="text-sm" style={{ color: '#71717A' }}>using React & Django</span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => window.open('https://github.com', '_blank')}
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: '#18181B' }}
                        >
                            <Github size={20} style={{ color: '#A1A1AA' }} />
                        </button>
                    </div>
                </div>

                {/* Copyright */}
                <p className="text-center text-xs mt-4" style={{ color: '#52525B' }}>
                    © 2024 VocabMaster. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default MobileAbout;
