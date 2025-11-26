import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    ArrowUpTrayIcon,
    ArrowPathIcon,
    ChevronRightIcon,
    HashtagIcon
} from '@heroicons/react/24/outline';

const LEVELS = ['A1', 'A2', 'B1'];

const CATEGORIES = {
    'articles': 'Articles',
    'plurals': 'Plurals',
    'verbs': 'Verb Conjugation',
    'separable_verbs': 'Separable Verbs',
    'modal_verbs': 'Modal Verbs',
    'cases': 'Cases',
    'prepositions': 'Prepositions',
    'sentence_structure': 'Sentence Structure',
    'word_order': 'Word Order',
    'time_expressions': 'Time Expressions',
    'adjective_endings': 'Adjective Endings',
    'comparatives': 'Comparatives & Superlatives',
};

const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
        <div className="relative group my-6 rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={handleCopy}
                    className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur-sm transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    backgroundColor: '#1e1e1e',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                }}
                {...props}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className={`${inline
            ? 'bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded text-sm font-mono font-bold'
            : 'block bg-slate-50 p-4 rounded-xl text-sm font-mono overflow-x-auto my-4 text-slate-800 border border-slate-200 shadow-sm'
            }`} {...props}>
            {children}
        </code>
    );
};

const MarkdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-4xl font-extrabold text-slate-900 mb-8 mt-10 tracking-tight" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-10 pb-2 border-b border-slate-100 flex items-center gap-2" {...props}><HashtagIcon className="w-5 h-5 text-primary-500" />{props.children}</h2>,
    h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-slate-800 mb-3 mt-8" {...props} />,
    p: ({ node, ...props }) => <p className="mb-5 text-slate-600 leading-relaxed text-lg" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-slate-600 text-lg marker:text-primary-500" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-slate-600 text-lg marker:text-primary-500 font-medium" {...props} />,
    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
    blockquote: ({ node, ...props }) => (
        <blockquote className="border-l-4 border-primary-500 pl-6 py-2 my-8 bg-primary-50/50 rounded-r-xl text-slate-700 italic" {...props} />
    ),
    code: CodeBlock,
    table: ({ node, ...props }) => <div className="overflow-x-auto my-8 rounded-xl shadow-sm border border-slate-200"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
    thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
    th: ({ node, ...props }) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
    td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 border-b border-slate-100 last:border-0" {...props} />,
};

function GrammarLibrary() {
    const navigate = useNavigate();
    const [selectedLevel, setSelectedLevel] = useState('A1');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [topics, setTopics] = useState([]);
    const [filteredTopics, setFilteredTopics] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        filterTopics();
    }, [selectedLevel, selectedCategory, searchQuery, topics]);

    const fetchTopics = async () => {
        try {
            const res = await api.get('grammar/');
            setTopics(res.data);
        } catch (err) {
            console.error('Error fetching grammar topics:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterTopics = () => {
        let filtered = topics.filter(topic => topic.level === selectedLevel);

        if (selectedCategory) {
            filtered = filtered.filter(topic => topic.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(topic =>
                topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                topic.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredTopics(filtered);

        // Auto-select first topic if none selected
        if (filtered.length > 0 && !selectedTopic) {
            setSelectedTopic(filtered[0]);
        }
    };

    const getCategoriesForLevel = () => {
        const levelTopics = topics.filter(t => t.level === selectedLevel);
        const categories = [...new Set(levelTopics.map(t => t.category))];
        return categories;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        try {
            const res = await api.post('grammar/import_csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(res.data.message);
            if (res.data.errors && res.data.errors.length > 0) {
                console.warn('Import errors:', res.data.errors);
                alert('Some items failed to import. Check console for details.');
            }
            fetchTopics(); // Refresh list
        } catch (err) {
            console.error('Import failed', err);
            alert('Import failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpenIcon className="w-8 h-8 text-primary-600" />
                        Grammar Library
                    </h1>
                    <p className="mt-1 text-slate-500">
                        Master German grammar with comprehensive guides for all levels.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-64 transition-all"
                        />
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                    />
                    <button
                        onClick={() => navigate('/grammar/generate')}
                        className="flex items-center px-4 py-2.5 bg-indigo-600 border border-transparent rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                    >
                        <span className="mr-2">✨</span>
                        Generate New Topic
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        {importing ? (
                            <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        ) : (
                            <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                        )}
                        Import
                    </button>
                </div>
            </div>

            <div className="flex gap-8 h-full overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
                    {/* Level Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        {LEVELS.map(level => (
                            <button
                                key={level}
                                onClick={() => {
                                    setSelectedLevel(level);
                                    setSelectedCategory(null);
                                    setSelectedTopic(null);
                                }}
                                className={`flex-1 py-4 font-bold text-sm transition-all relative ${selectedLevel === level
                                    ? 'text-primary-700 bg-white'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                                    }`}
                            >
                                {level}
                                {selectedLevel === level && (
                                    <motion.div
                                        layoutId="activeLevel"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Topics List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === null
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            All Topics
                        </button>

                        {getCategoriesForLevel().map(category => (
                            <div key={category} className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === category
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {CATEGORIES[category]}
                                    {selectedCategory === category && (
                                        <ChevronRightIcon className="w-4 h-4 text-slate-400 rotate-90 transition-transform" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {(selectedCategory === category || !selectedCategory) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="pl-2 space-y-1"
                                        >
                                            {filteredTopics
                                                .filter(t => t.category === category)
                                                .map(topic => (
                                                    <button
                                                        key={topic.id}
                                                        onClick={() => setSelectedTopic(topic)}
                                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all border-l-2 ${selectedTopic?.id === topic.id
                                                            ? 'border-primary-500 bg-primary-50/50 text-primary-700 font-semibold'
                                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {topic.title}
                                                    </button>
                                                ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden relative">
                    {selectedTopic ? (
                        <motion.div
                            key={selectedTopic.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-full overflow-y-auto custom-scrollbar p-10"
                        >
                            <div className="max-w-4xl mx-auto">
                                {/* Topic Header */}
                                <div className="mb-10 pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-md uppercase tracking-wide">
                                            {selectedTopic.level}
                                        </span>
                                        <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                            <ChevronRightIcon className="w-3 h-3" />
                                            {CATEGORIES[selectedTopic.category]}
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                        {selectedTopic.title}
                                    </h2>
                                </div>

                                {/* Content */}
                                <div className="prose prose-lg prose-slate max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={MarkdownComponents}
                                    >
                                        {selectedTopic.content}
                                    </ReactMarkdown>
                                </div>

                                {/* Examples */}
                                {selectedTopic.examples && selectedTopic.examples.length > 0 && (
                                    <div className="mt-12 bg-slate-50 rounded-2xl p-8 border border-slate-200">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm">Ex</span>
                                            Examples
                                        </h3>
                                        <div className="grid gap-4">
                                            {selectedTopic.examples.map((example, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="font-bold text-slate-900 text-lg">{example.german}</div>
                                                    {example.english && (
                                                        <div className="text-slate-500 mt-1 font-medium">
                                                            {example.english}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <BookOpenIcon className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-xl font-medium text-slate-600">Select a topic to start learning</p>
                            <p className="text-sm text-slate-400 mt-2">Choose from the sidebar to view grammar guides</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GrammarLibrary;
