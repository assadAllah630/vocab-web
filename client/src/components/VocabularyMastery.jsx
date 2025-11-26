import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AcademicCapIcon,
    CheckBadgeIcon,
    SparklesIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

function VocabularyMastery({ defaultTab = 'new' }) {
    const [activeTab, setActiveTab] = useState(defaultTab); // 'new', 'learning', 'mastered'
    const [vocabList, setVocabList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ needs_review: 0, learning: 0, mastered: 0, new_words: 0 });

    useEffect(() => {
        fetchStats();
        fetchVocab(activeTab);
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('practice/stats/');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchVocab = async (status) => {
        setLoading(true);
        try {
            const res = await api.get('vocab/by-status/', { params: { status } });
            setVocabList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'new', label: 'Needs Review', icon: SparklesIcon, count: stats.needs_review + (stats.new_words || 0), color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'learning', label: 'Learning', icon: AcademicCapIcon, count: stats.learning, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'mastered', label: 'Mastered', icon: CheckBadgeIcon, count: stats.mastered, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Vocabulary Mastery Details</h2>
                <p className="text-slate-500 text-sm">Detailed breakdown of your vocabulary progress.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all border-2 min-w-[200px] ${activeTab === tab.id
                            ? 'border-indigo-500 bg-white shadow-md'
                            : 'border-transparent bg-slate-50 hover:bg-slate-100'
                            }`}
                    >
                        <div className={`p-2 rounded-xl ${tab.bg} ${tab.color}`}>
                            <tab.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className={`font-bold ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                {tab.label}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">
                                {tab.count} words
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <ArrowPathIcon className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : vocabList.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <SparklesIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No words here yet</h3>
                        <p className="text-slate-500">Keep practicing to move words to this level!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {vocabList.map((word) => (
                                <motion.div
                                    key={word.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all bg-white group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${word.type === 'noun' ? 'bg-blue-50 text-blue-600' :
                                            word.type === 'verb' ? 'bg-green-50 text-green-600' :
                                                'bg-slate-50 text-slate-600'
                                            }`}>
                                            {word.type}
                                        </span>
                                        <WiFiSignal probability={word.recall_probability || 0} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{word.word}</h3>
                                    <p className="text-slate-500">{word.translation}</p>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400">
                                        <span>
                                            {activeTab === 'learning' && word.total_practice_count < 3 ? (
                                                <span className="text-orange-500 font-bold">{word.total_practice_count}/3 to Master</span>
                                            ) : (
                                                <span>Seen {word.total_practice_count} times</span>
                                            )}
                                        </span>
                                        <span>{Math.round((word.recall_probability || 0) * 100)}% recall</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

function WiFiSignal({ probability }) {
    // 0 bars: < 20%
    // 1 bar: 20-40%
    // 2 bars: 40-60%
    // 3 bars: 60-80%
    // 4 bars: > 80%

    const bars = [
        { threshold: 0.2, height: 'h-1' },
        { threshold: 0.4, height: 'h-2' },
        { threshold: 0.6, height: 'h-3' },
        { threshold: 0.8, height: 'h-4' },
    ];

    const getColor = (prob) => {
        if (prob < 0.4) return 'bg-red-500';
        if (prob < 0.7) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const color = getColor(probability);

    return (
        <div className="flex items-end gap-0.5 h-4" title={`Recall Probability: ${Math.round(probability * 100)}%`}>
            {bars.map((bar, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-sm ${bar.height} ${probability > bar.threshold ? color : 'bg-slate-200'
                        }`}
                />
            ))}
        </div>
    );
}

export default VocabularyMastery;
