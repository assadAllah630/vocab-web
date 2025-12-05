import React, { useState } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SparklesIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    NewspaperIcon,
    UserPlusIcon,
    TrashIcon,
    ArrowPathIcon,
    DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const TABS = [
    { id: 'story', label: 'Story', icon: BookOpenIcon },
    { id: 'dialogue', label: 'Dialogue', icon: ChatBubbleLeftRightIcon },
    { id: 'article', label: 'Article', icon: NewspaperIcon },
];

function TextGenerator() {
    const [activeTab, setActiveTab] = useState('story');
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [error, setError] = useState('');

    // Common State
    const [level, setLevel] = useState('B1');
    const [wordCount, setWordCount] = useState(300);
    const [instructorNotes, setInstructorNotes] = useState('');

    // Story State
    const [storyParams, setStoryParams] = useState({
        genre: 'General',
        plot_type: 'Standard',
        setting: '',
        characters: []
    });
    const [charInput, setCharInput] = useState({ name: '', role: '', traits: '' });

    // Dialogue State
    const [dialogueParams, setDialogueParams] = useState({
        scenario: '',
        tone: 'Neutral',
        speakers: []
    });
    const [speakerInput, setSpeakerInput] = useState({ name: '', personality: '' });

    // Article State
    const [articleParams, setArticleParams] = useState({
        topic: '',
        article_style: 'Informative',
        structure_type: 'Standard'
    });

    // --- Handlers ---

    const handleAddCharacter = () => {
        if (charInput.name) {
            setStoryParams(prev => ({
                ...prev,
                characters: [...prev.characters, charInput]
            }));
            setCharInput({ name: '', role: '', traits: '' });
        }
    };

    const handleAddSpeaker = () => {
        if (speakerInput.name) {
            setDialogueParams(prev => ({
                ...prev,
                speakers: [...prev.speakers, speakerInput]
            }));
            setSpeakerInput({ name: '', personality: '' });
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setGeneratedContent(null);

        try {
            let payload = {
                content_type: activeTab,
                level,
                word_count: wordCount,
                instructor_notes: instructorNotes
            };

            if (activeTab === 'story') {
                payload = { ...payload, ...storyParams, topic: storyParams.setting || 'Story' };
            } else if (activeTab === 'dialogue') {
                payload = { ...payload, ...dialogueParams, topic: dialogueParams.scenario || 'Dialogue' };
            } else if (activeTab === 'article') {
                payload = { ...payload, ...articleParams };
            }

            const res = await api.post('generate-advanced-text/', payload);
            setGeneratedContent(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to generate content');
        } finally {
            setLoading(false);
        }
    };

    // --- Renderers ---

    const renderStoryInputs = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Genre</label>
                    <select
                        value={storyParams.genre}
                        onChange={e => setStoryParams({ ...storyParams, genre: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                    >
                        {['General', 'Sci-Fi', 'Mystery', 'Romance', 'Fantasy', 'Adventure'].map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Plot Type</label>
                    <select
                        value={storyParams.plot_type}
                        onChange={e => setStoryParams({ ...storyParams, plot_type: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                    >
                        {['Standard', 'Surprise Ending', 'Moral Lesson', 'Hero\'s Journey'].map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Setting / Topic</label>
                <input
                    type="text"
                    value={storyParams.setting}
                    onChange={e => setStoryParams({ ...storyParams, setting: e.target.value })}
                    placeholder="e.g. A magical forest in winter"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                />
            </div>

            {/* Characters */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Characters</label>
                <div className="space-y-2 mb-3">
                    {storyParams.characters.map((char, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                            <span><b>{char.name}</b> ({char.role})</span>
                            <button onClick={() => setStoryParams(prev => ({ ...prev, characters: prev.characters.filter((_, idx) => idx !== i) }))}>
                                <TrashIcon className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <input
                        placeholder="Name"
                        value={charInput.name}
                        onChange={e => setCharInput({ ...charInput, name: e.target.value })}
                        className="p-2 rounded border border-slate-200 text-sm"
                    />
                    <input
                        placeholder="Role"
                        value={charInput.role}
                        onChange={e => setCharInput({ ...charInput, role: e.target.value })}
                        className="p-2 rounded border border-slate-200 text-sm"
                    />
                    <button
                        onClick={handleAddCharacter}
                        className="bg-indigo-50 text-indigo-600 rounded font-bold text-sm hover:bg-indigo-100"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDialogueInputs = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Scenario</label>
                <textarea
                    value={dialogueParams.scenario}
                    onChange={e => setDialogueParams({ ...dialogueParams, scenario: e.target.value })}
                    placeholder="e.g. Discussing weekend plans"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 h-24 resize-none"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tone</label>
                <select
                    value={dialogueParams.tone}
                    onChange={e => setDialogueParams({ ...dialogueParams, tone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                >
                    {['Neutral', 'Formal', 'Casual', 'Humorous', 'Argumentative'].map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {/* Speakers */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Speakers</label>
                <div className="space-y-2 mb-3">
                    {dialogueParams.speakers.map((speaker, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                            <span><b>{speaker.name}</b>: {speaker.personality}</span>
                            <button onClick={() => setDialogueParams(prev => ({ ...prev, speakers: prev.speakers.filter((_, idx) => idx !== i) }))}>
                                <TrashIcon className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <input
                        placeholder="Name"
                        value={speakerInput.name}
                        onChange={e => setSpeakerInput({ ...speakerInput, name: e.target.value })}
                        className="p-2 rounded border border-slate-200 text-sm"
                    />
                    <input
                        placeholder="Personality"
                        value={speakerInput.personality}
                        onChange={e => setSpeakerInput({ ...speakerInput, personality: e.target.value })}
                        className="p-2 rounded border border-slate-200 text-sm"
                    />
                    <button
                        onClick={handleAddSpeaker}
                        className="bg-indigo-50 text-indigo-600 rounded font-bold text-sm hover:bg-indigo-100"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );

    const renderArticleInputs = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic</label>
                <textarea
                    value={articleParams.topic}
                    onChange={e => setArticleParams({ ...articleParams, topic: e.target.value })}
                    placeholder="e.g. Benefits of learning a second language"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 h-24 resize-none"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Style</label>
                    <select
                        value={articleParams.article_style}
                        onChange={e => setArticleParams({ ...articleParams, article_style: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                    >
                        {['Informative', 'Blog', 'Academic', 'News'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Structure</label>
                    <select
                        value={articleParams.structure_type}
                        onChange={e => setArticleParams({ ...articleParams, structure_type: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                    >
                        {['Standard', 'Listicle', 'How-to', 'Comparison'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    const renderPreview = () => {
        if (!generatedContent) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p>Configure settings and click Generate</p>
                </div>
            );
        }

        const { content } = generatedContent;

        if (activeTab === 'story') {
            return (
                <div className="prose max-w-none">
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">{content.title}</h2>
                    {content.events?.map((event, i) => (
                        <div key={i} className="mb-6">
                            <h3 className="text-lg font-bold text-indigo-600 mb-2">{event.title}</h3>
                            <p className="whitespace-pre-wrap text-slate-700">{event.content}</p>
                        </div>
                    ))}
                </div>
            );
        } else if (activeTab === 'dialogue') {
            return (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-center text-slate-800 mb-6">{content.title}</h2>
                    {content.messages?.map((msg, i) => {
                        const isLeft = i % 2 === 0;
                        return (
                            <div key={i} className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
                                <span className="text-xs text-slate-400 mb-1 px-2">{msg.speaker}</span>
                                <div className={`max-w-[80%] p-3 rounded-2xl ${isLeft ? 'bg-slate-100 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'
                                    }`}>
                                    <p>{msg.text}</p>
                                    {msg.translation && (
                                        <p className={`text-xs mt-2 pt-2 border-t ${isLeft ? 'border-slate-200 text-slate-500' : 'border-indigo-500 text-indigo-200'}`}>
                                            {msg.translation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } else if (activeTab === 'article') {
            return (
                <div className="prose max-w-none">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">{content.title}</h2>
                    {content.paragraphs?.map((para, i) => (
                        <div key={i} className="mb-6">
                            {para.heading && <h3 className="text-xl font-bold text-slate-800 mb-2">{para.heading}</h3>}
                            <p className="text-slate-700 leading-relaxed">{para.content}</p>
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-indigo-600" />
                    AI Content Studio
                </h1>
                <p className="text-slate-500 mt-2">Generate professional learning content powered by Gemini 2.0</p>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* Sidebar */}
                <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Tabs */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Configuration Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                        {activeTab === 'story' && renderStoryInputs()}
                        {activeTab === 'dialogue' && renderDialogueInputs()}
                        {activeTab === 'article' && renderArticleInputs()}

                        {/* Common Settings */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Level</label>
                                    <select
                                        value={level}
                                        onChange={e => setLevel(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                                    >
                                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Length</label>
                                    <input
                                        type="number"
                                        value={wordCount}
                                        onChange={e => setWordCount(parseInt(e.target.value))}
                                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes</label>
                                <textarea
                                    value={instructorNotes}
                                    onChange={e => setInstructorNotes(e.target.value)}
                                    placeholder="Additional instructions for the AI..."
                                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 h-20 resize-none text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                            Generate {TABS.find(t => t.id === activeTab).label}
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                            <DocumentDuplicateIcon className="w-5 h-5 text-slate-400" />
                            Preview
                        </span>
                        {generatedContent && (
                            <span className="text-xs font-mono text-slate-400">
                                {generatedContent.content.word_count || wordCount} words
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                        {renderPreview()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TextGenerator;
