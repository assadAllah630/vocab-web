import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';
import {
    BookOpenIcon,
    SparklesIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    BookmarkIcon,
    XMarkIcon,
    CheckCircleIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import ReaderPractice from '../components/ReaderPractice';

const MarkdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold text-slate-900 mb-6 mt-8 tracking-tight" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8 pb-2 border-b border-slate-100" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-slate-800 mb-3 mt-6" {...props} />,
    p: ({ node, ...props }) => <p className="mb-4 text-slate-600 leading-relaxed text-lg" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-slate-600 text-lg marker:text-primary-500" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-slate-600 text-lg marker:text-primary-500 font-medium" {...props} />,
    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
    blockquote: ({ node, ...props }) => (
        <blockquote className="border-l-4 border-primary-500 pl-6 py-2 my-6 bg-primary-50/50 rounded-r-xl text-slate-700 italic" {...props} />
    ),
    code: ({ node, inline, className, children, ...props }) => {
        return inline ? (
            <code className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-sm font-mono font-bold" {...props}>
                {children}
            </code>
        ) : (
            <code className="block bg-slate-50 p-4 rounded-xl text-sm font-mono overflow-x-auto my-4 text-slate-800 border border-slate-200 shadow-sm" {...props}>
                {children}
            </code>
        );
    },
    table: ({ node, ...props }) => <div className="overflow-x-auto my-6 rounded-xl shadow-sm border border-slate-200"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
    thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
    th: ({ node, ...props }) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
    td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 border-b border-slate-100 last:border-0" {...props} />,
};

function TextReader() {
    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [isEditing, setIsEditing] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [extractedWords, setExtractedWords] = useState([]);
    const [selectedWords, setSelectedWords] = useState([]);
    const [stats, setStats] = useState(null);
    const [practiceMode, setPracticeMode] = useState(false); // 'flashcards' or 'writing' or null
    const [savedTexts, setSavedTexts] = useState([]);
    const [loadingTexts, setLoadingTexts] = useState(true);
    const [currentTextId, setCurrentTextId] = useState(null);

    useEffect(() => {
        fetchSavedTexts();
    }, []);

    const fetchSavedTexts = async () => {
        try {
            const res = await api.get('saved-texts/');
            setSavedTexts(res.data);
        } catch (err) {
            console.error('Failed to fetch saved texts', err);
        } finally {
            setLoadingTexts(false);
        }
    };

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setAnalyzing(true);
        try {
            const res = await api.post('analyze-text/', {
                text
            });
            setExtractedWords(res.data.new_words);
            setStats({
                total: res.data.total_words,
                unique: res.data.unique_words,
                known: res.data.known_count
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Analysis failed', err);
            alert('Failed to analyze text');
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleWordSelection = (word) => {
        if (selectedWords.includes(word)) {
            setSelectedWords(selectedWords.filter(w => w !== word));
        } else {
            setSelectedWords([...selectedWords, word]);
        }
    };

    const handleSaveText = async () => {
        if (!title.trim()) {
            alert('⚠️ Please provide a TITLE for your text before saving.');
            return;
        }
        if (!text.trim()) {
            alert('⚠️ Please provide CONTENT for your text before saving.');
            return;
        }

        // Check for duplicate title if creating new
        if (!currentTextId && savedTexts.some(t => t.title.toLowerCase() === title.trim().toLowerCase())) {
            alert('⚠️ A text with this title already exists. Please choose a different title.');
            return;
        }

        try {
            if (currentTextId) {
                // Update existing
                await api.put(`saved-texts/${currentTextId}/`, { title, content: text });
                alert('Text updated successfully!');
            } else {
                // Create new
                const res = await api.post('saved-texts/', { title, content: text });
                setCurrentTextId(res.data.id);
                alert('Text saved successfully!');
            }
            fetchSavedTexts();
        } catch (err) {
            console.error('Failed to save text', err.response?.data || err);
            alert(`Failed to save text: ${JSON.stringify(err.response?.data || err.message)}`);
        }
    };

    const handleDeleteText = async (id) => {
        try {
            // Check if this is the currently loaded text BEFORE deleting
            const deletedText = savedTexts.find(t => t.id === id);
            const isCurrentText = deletedText && title === deletedText.title;

            await api.delete(`saved-texts/${id}/`);
            setSavedTexts(savedTexts.filter(t => t.id !== id));

            // If the deleted text was currently loaded, clear the editor
            if (isCurrentText) {
                setIsEditing(true);
                setCurrentTextId(null);
                setTitle('');
                setText('');
                setExtractedWords([]);
                setStats(null);
            }
        } catch (err) {
            console.error('Failed to delete text', err);
            alert('Failed to delete text');
        }
    };

    const loadText = (savedText) => {
        setCurrentTextId(savedText.id);
        setTitle(savedText.title);
        setText(savedText.content);
        setIsEditing(false);
        handleAnalyze(); // Re-analyze on load
    };

    return (
        <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpenIcon className="w-8 h-8 text-primary-600" />
                        Text Reader & Analysis
                    </h1>
                    <p className="mt-1 text-slate-500">
                        Read, analyze, and learn vocabulary from any text.
                    </p>
                </div>
                <div className="flex gap-3">
                    {!isEditing && !practiceMode && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Edit Text
                            </button>
                            <button
                                onClick={handleSaveText}
                                className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <BookmarkIcon className="w-5 h-5 mr-2 text-primary-500" />
                                Save Text
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                {/* Left Sidebar: Saved Texts */}
                <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <BookmarkIcon className="w-4 h-4" />
                            Saved Texts
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                setCurrentTextId(null);
                                setText('');
                                setTitle('');
                                setExtractedWords([]);
                                setStats(null);
                                setPracticeMode(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Text
                        </button>
                        {loadingTexts ? (
                            <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
                        ) : savedTexts.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm italic">No saved texts</div>
                        ) : (
                            savedTexts.map(t => (
                                <div key={t.id} className="group flex items-center gap-1">
                                    <button
                                        onClick={() => loadText(t)}
                                        className="flex-1 text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors truncate"
                                    >
                                        {t.title}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Are you sure you want to delete this text?')) {
                                                handleDeleteText(t.id);
                                            }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete Text"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col relative">
                    {practiceMode ? (
                        <ReaderPractice
                            words={selectedWords}
                            onBack={() => setPracticeMode(false)}
                        />
                    ) : (
                        <>
                            {isEditing ? (
                                <div className="flex-1 flex flex-col p-6 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Text Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Paste your markdown text here..."
                                        className="flex-1 w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={!text.trim() || analyzing}
                                            className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {analyzing ? (
                                                <>
                                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="w-5 h-5" />
                                                    Analyze Text
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                    <div className="max-w-3xl mx-auto prose prose-lg prose-slate">
                                        <h1 className="mb-8">{title}</h1>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={MarkdownComponents}
                                        >
                                            {text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right Sidebar: Vocabulary */}
                {!practiceMode && !isEditing && (
                    <div className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-primary-500" />
                                New Vocabulary
                            </h3>
                            {stats && (
                                <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                    <span>{stats.new_words} new</span>
                                    <span>{Math.round((stats.known / stats.unique) * 100)}% known</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {extractedWords.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                    <p>No new words found! You're a pro!</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {extractedWords.map((word, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleWordSelection(word)}
                                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedWords.includes(word)
                                                ? 'bg-primary-50 border border-primary-200 shadow-sm'
                                                : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                        >
                                            <span className={`font-medium ${selectedWords.includes(word) ? 'text-primary-700' : 'text-slate-700'}`}>
                                                {word}
                                            </span>
                                            {selectedWords.includes(word) && (
                                                <CheckCircleIcon className="w-5 h-5 text-primary-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => setPracticeMode(true)}
                                disabled={selectedWords.length === 0}
                                className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                Practice Selected ({selectedWords.length})
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TextReader;
