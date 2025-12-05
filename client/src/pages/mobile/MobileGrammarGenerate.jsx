import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import MobileMarkdownRenderer from '../../components/mobile/MobileMarkdownRenderer';
import {
    ChevronLeft,
    Sparkles,
    Save,
    RefreshCw,
    X,
    Loader2,
    CheckCircle2
} from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1'];

function MobileGrammarGenerate() {
    const navigate = useNavigate();
    const location = useLocation();
    const editTopic = location.state?.editTopic;

    const [step, setStep] = useState(editTopic ? 'preview' : 'input'); // input, generating, preview, saving
    const [formData, setFormData] = useState({
        title: editTopic?.title || '',
        level: editTopic?.level || 'A1',
        context: '',
    });
    const [generatedContent, setGeneratedContent] = useState(editTopic ? {
        title: editTopic.title,
        content: editTopic.content,
        examples: editTopic.examples,
        category: editTopic.category,
        level: editTopic.level
    } : null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!formData.title.trim()) return;

        setStep('generating');
        setError('');

        try {
            const res = await api.post('grammar/generate/', {
                title: formData.title,
                level: formData.level,
                context_note: formData.context
            });

            // Backend returns the saved topic directly
            if (res.data.id) {
                setGeneratedContent(res.data);
                setStep('preview');
            } else if (res.data.success) {
                setGeneratedContent(res.data.data);
                setStep('preview');
            } else {
                setError(res.data.error || 'Generation failed');
                setStep('input');
            }
        } catch (err) {
            console.error('Generation error:', err);

            // Handle specific error types
            if (err.response?.status === 403) {
                setError('⏱️ Rate limit reached. You can generate 5 topics per hour. Please wait and try again.');
            } else if (err.response?.data?.error?.includes('JSON') || err.response?.data?.error?.includes('delimiter')) {
                setError('🔄 AI response was malformed. Please try again with a different topic or add more context.');
            } else {
                const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to generate content. Please try again.';
                setError(errorMsg);
            }
            setStep('input');
        }
    };

    const handleSave = async () => {
        // If we're editing an existing topic
        if (editTopic?.id) {
            try {
                await api.put(`grammar/${editTopic.id}/`, {
                    title: formData.title,
                    level: formData.level,
                    content: generatedContent.content,
                    category: generatedContent.category,
                    examples: generatedContent.examples
                });
                navigate('/m/grammar', { replace: true });
            } catch (err) {
                console.error('Update error:', err);
                setError('Failed to update topic');
                setStep('preview');
            }
            return;
        }

        // If backend returned an ID, the topic is already saved
        if (generatedContent?.id) {
            navigate('/m/grammar', { replace: true });
            return;
        }

        // Otherwise create new topic
        setStep('saving');
        try {
            await api.post('grammar/', generatedContent);
            navigate('/m/grammar', { replace: true });
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save topic');
            setStep('preview');
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#09090B' }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between sticky top-0 z-20" style={{ backgroundColor: '#09090B' }}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (step === 'preview' && !editTopic) setStep('input');
                        else navigate('/m/grammar');
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#1C1C1F' }}
                >
                    <ChevronLeft size={22} color="#A1A1AA" />
                </motion.button>
                <h1 className="text-lg font-bold text-[#FAFAFA]">
                    {editTopic ? 'Edit Topic' : 'Generate Topic'}
                </h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col px-5 pb-28">{/* Increased pb from pb-8 to pb-28 */}
                <AnimatePresence mode="wait">
                    {step === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">Topic</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Two-Way Prepositions"
                                        className="w-full px-4 py-3 rounded-xl text-[#FAFAFA] font-medium outline-none focus:ring-2 focus:ring-[#6366F1]"
                                        style={{ backgroundColor: '#1C1C1F', border: '1px solid #27272A' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">Level</label>
                                    <div className="flex p-1 rounded-xl" style={{ backgroundColor: '#1C1C1F' }}>
                                        {LEVELS.map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setFormData({ ...formData, level })}
                                                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all relative"
                                                style={{
                                                    color: formData.level === level ? '#FAFAFA' : '#71717A',
                                                    backgroundColor: formData.level === level ? '#27272A' : 'transparent'
                                                }}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {editTopic && (
                                    <div>
                                        <label className="block text-sm font-bold text-[#A1A1AA] mb-2">Category</label>
                                        <select
                                            value={generatedContent?.category || 'uncategorized'}
                                            onChange={e => setGeneratedContent({ ...generatedContent, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl text-[#FAFAFA] font-medium outline-none focus:ring-2 focus:ring-[#6366F1]"
                                            style={{ backgroundColor: '#1C1C1F', border: '1px solid #27272A' }}
                                        >
                                            <option value="articles">Articles</option>
                                            <option value="plurals">Plurals</option>
                                            <option value="verbs">Verb Conjugation</option>
                                            <option value="separable_verbs">Separable Verbs</option>
                                            <option value="modal_verbs">Modal Verbs</option>
                                            <option value="cases">Cases</option>
                                            <option value="prepositions">Prepositions</option>
                                            <option value="sentence_structure">Sentence Structure</option>
                                            <option value="word_order">Word Order</option>
                                            <option value="time_expressions">Time Expressions</option>
                                            <option value="adjective_endings">Adjective Endings</option>
                                            <option value="comparatives">Comparatives & Superlatives</option>
                                            <option value="uncategorized">Uncategorized</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">
                                        Context / Notes (Optional)
                                    </label>
                                    <textarea
                                        value={formData.context}
                                        onChange={e => setFormData({ ...formData, context: e.target.value })}
                                        placeholder="Any specific focus or examples you want to include..."
                                        className="w-full px-4 py-3 rounded-xl text-[#FAFAFA] font-medium outline-none focus:ring-2 focus:ring-[#6366F1] h-32 resize-none"
                                        style={{ backgroundColor: '#1C1C1F', border: '1px solid #27272A' }}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-900/20 border border-red-900/50 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGenerate}
                                disabled={!formData.title.trim()}
                                className="mt-auto w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                            >
                                <Sparkles size={20} />
                                Generate with AI
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center"
                        >
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-[#27272A]" />
                                <div className="absolute inset-0 rounded-full border-4 border-[#6366F1] border-t-transparent animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto text-[#6366F1] animate-pulse" size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-[#FAFAFA] mb-2">Generating Content</h2>
                            <p className="text-[#A1A1AA]">Consulting grammar rules...</p>
                        </motion.div>
                    )}

                    {step === 'preview' && generatedContent && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <div className="flex-1 overflow-y-auto mb-4 rounded-2xl border border-[#27272A] bg-[#141416] p-6">
                                {/* Editable Title */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-[#71717A] mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg text-xl font-black text-[#FAFAFA] bg-[#1C1C1F] border border-[#27272A] outline-none focus:ring-2 focus:ring-[#6366F1]"
                                    />
                                </div>

                                {/* Editable Category & Level */}
                                <div className="flex items-center gap-2 mb-6">
                                    <select
                                        value={generatedContent.category || 'uncategorized'}
                                        onChange={e => setGeneratedContent({ ...generatedContent, category: e.target.value })}
                                        className="px-2 py-1 rounded-md bg-[#27272A] text-[#A1A1AA] text-xs font-bold uppercase border border-[#3F3F46] outline-none focus:ring-2 focus:ring-[#6366F1]"
                                    >
                                        <option value="articles">Articles</option>
                                        <option value="plurals">Plurals</option>
                                        <option value="verbs">Verbs</option>
                                        <option value="separable_verbs">Separable Verbs</option>
                                        <option value="modal_verbs">Modal Verbs</option>
                                        <option value="cases">Cases</option>
                                        <option value="prepositions">Prepositions</option>
                                        <option value="sentence_structure">Sentence Structure</option>
                                        <option value="word_order">Word Order</option>
                                        <option value="time_expressions">Time Expressions</option>
                                        <option value="adjective_endings">Adjective Endings</option>
                                        <option value="comparatives">Comparatives</option>
                                        <option value="uncategorized">Uncategorized</option>
                                    </select>
                                    <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[#A1A1AA] text-xs font-bold uppercase">
                                        {formData.level}
                                    </span>
                                </div>

                                <MobileMarkdownRenderer content={generatedContent.content} fontSize={14} />
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStep('input')}
                                    className="flex-1 py-3 rounded-xl font-bold text-[#FAFAFA] flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#27272A' }}
                                >
                                    <RefreshCw size={18} />
                                    Retry
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSave}
                                    className="flex-[2] py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #22C55E, #14B8A6)' }}
                                >
                                    <Save size={18} />
                                    {editTopic ? 'Update Topic' : 'Save Topic'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'saving' && (
                        <motion.div
                            key="saving"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center"
                        >
                            <Loader2 size={40} color="#22C55E" className="animate-spin mb-4" />
                            <p className="text-[#FAFAFA] font-medium">Saving to library...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default MobileGrammarGenerate;
