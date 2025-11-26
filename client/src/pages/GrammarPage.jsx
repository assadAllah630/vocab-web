import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ChevronRightIcon,
    HashtagIcon,
    XMarkIcon,
    CheckIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const MermaidDiagram = ({ children }) => {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        if (children) {
            const renderDiagram = async () => {
                try {
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'neutral',
                        flowchart: { curve: 'basis' },
                        securityLevel: 'loose',
                        fontFamily: 'inherit',
                        suppressErrorRendering: true
                    });

                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                    // Auto-fix common syntax errors (e.g. unquoted labels with parentheses)
                    // Replaces [Text (Info)] with ["Text (Info)"]
                    let code = children;
                    if (code.includes('(') && code.includes('[')) {
                        // Allow newlines in the match
                        code = code.replace(/\[([^"\[\]]*?\([^"\[\]]*?\)[^"\[\]]*?)\]/g, '["$1"]');
                        code = code.replace(/\(([^"()]*?\([^"()]*?\)[^"()]*?)\)/g, '("$1")');
                    }

                    const { svg } = await mermaid.render(id, code);
                    setSvg(svg);
                } catch (error) {
                    console.error('Mermaid rendering failed:', error);
                    setSvg(`
                        <div class="flex flex-col gap-4 w-full">
                            <div class="text-red-500 p-4 border border-red-200 rounded bg-red-50">
                                <p class="font-bold">Failed to render diagram</p>
                                <p class="text-sm mt-2">${error.message}</p>
                            </div>
                            <pre class="bg-slate-800 text-slate-200 p-4 rounded text-xs overflow-x-auto"><code>${children}</code></pre>
                        </div>
                    `);
                }
            };
            renderDiagram();
        }
    }, [children]);

    return (
        <div className="my-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
    );
};

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

    if (!inline && match && match[1].toLowerCase() === 'mermaid') {
        return <MermaidDiagram>{String(children).replace(/\n$/, '')}</MermaidDiagram>;
    }

    return !inline && match ? (
        <div className="relative group my-6 rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={handleCopy}
                    className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur-sm transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <CheckIcon className="w-4 h-4 text-green-400" />
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

function GrammarPage() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [filteredTopics, setFilteredTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedLevel, setSelectedLevel] = useState('A1');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'articles',
        level: 'A1',
        content: '',
        examples: []
    });

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        filterTopics();
    }, [selectedLevel, selectedCategory, searchQuery, topics]);

    const fetchTopics = async () => {
        try {
            const res = await api.get('grammar/');
            // Ensure we always set an array
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setTopics(data);
        } catch (err) {
            setError('Failed to fetch grammar topics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterTopics = () => {
        // Defensive check to ensure topics is an array
        if (!Array.isArray(topics)) {
            setFilteredTopics([]);
            return;
        }

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

        if (filtered.length > 0 && !selectedTopic && !isEditing) {
            setSelectedTopic(filtered[0]);
        }
    };

    const getCategoriesForLevel = () => {
        const levelTopics = topics.filter(t => t.level === selectedLevel);
        const categories = [...new Set(levelTopics.map(t => t.category))];
        return categories;
    };

    const handleCreate = () => {
        setCurrentTopic(null);
        setFormData({
            title: '',
            category: 'articles',
            level: selectedLevel,
            content: '',
            examples: []
        });
        setIsEditing(true);
    };

    const handleEdit = (topic) => {
        setCurrentTopic(topic);
        setFormData({
            title: topic.title,
            category: topic.category,
            level: topic.level,
            content: topic.content,
            examples: topic.examples || []
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentTopic(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let savedTopic;
            if (currentTopic) {
                const res = await api.put(`grammar/${currentTopic.id}/`, formData);
                savedTopic = res.data;
            } else {
                const res = await api.post('grammar/', formData);
                savedTopic = res.data;
            }

            await fetchTopics();
            setIsEditing(false);
            setCurrentTopic(null);
            setSelectedTopic(savedTopic);
            setSelectedLevel(savedTopic.level);
            setSelectedCategory(null);
        } catch (err) {
            setError('Failed to save topic');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this topic?')) return;
        try {
            await api.delete(`grammar/${id}/`);
            await fetchTopics();
            setSelectedTopic(null);
        } catch (err) {
            setError('Failed to delete topic');
            console.error(err);
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
                        Manage Grammar
                    </h1>
                    <p className="mt-1 text-slate-500">
                        Create, edit, and organize grammar topics.
                    </p>
                </div>

                <div className="flex gap-3">
                    {!isEditing && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add New Topic
                        </button>
                    )}
                    {!isEditing && (
                        <button
                            onClick={() => navigate('/grammar/generate')}
                            className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="mr-2">✨</span>
                            Generate with AI
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

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
                                        layoutId="activeLevelAdmin"
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
                                                        onClick={() => {
                                                            setSelectedTopic(topic);
                                                            setIsEditing(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all border-l-2 ${selectedTopic?.id === topic.id && !isEditing
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
                        {filteredTopics.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-sm italic">
                                No topics found
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden relative">
                    {isEditing ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full overflow-y-auto custom-scrollbar p-10"
                        >
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                                        {currentTopic ? <PencilSquareIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
                                    </span>
                                    {currentTopic ? 'Edit Topic' : 'New Topic'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                required
                                                placeholder="e.g., Definite Articles"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Level</label>
                                            <select
                                                value={formData.level}
                                                onChange={e => setFormData({ ...formData, level: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            >
                                                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            >
                                                {Object.entries(CATEGORIES).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Content (Markdown)
                                            <span className="ml-2 text-xs font-normal text-slate-500">Supports GFM (tables, code blocks, etc.)</span>
                                        </label>
                                        <textarea
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl h-96 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-y"
                                            required
                                            placeholder="# Heading&#10;Write your content here..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
                                        >
                                            {currentTopic ? 'Update Topic' : 'Create Topic'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    ) : selectedTopic ? (
                        <motion.div
                            key={selectedTopic.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-full overflow-y-auto custom-scrollbar p-10"
                        >
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-10 pb-6 border-b border-slate-100 flex justify-between items-start">
                                    <div>
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
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsFullScreen(true)}
                                            className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                                            title="Full Screen Mode"
                                        >
                                            <ArrowsPointingOutIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(selectedTopic)}
                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                            title="Edit Topic"
                                        >
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedTopic.id)}
                                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            title="Delete Topic"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="prose prose-lg prose-slate max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={MarkdownComponents}
                                    >
                                        {selectedTopic.content}
                                    </ReactMarkdown>
                                </div>

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
                            <p className="text-xl font-medium text-slate-600">Select a topic to view or edit</p>
                            <button
                                onClick={handleCreate}
                                className="mt-4 text-primary-600 hover:text-primary-700 font-bold flex items-center gap-2 hover:underline"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Create a new topic
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Overlay */}
            <AnimatePresence>
                {isFullScreen && selectedTopic && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 bg-white overflow-y-auto"
                    >
                        <div className="max-w-5xl mx-auto p-12 min-h-screen relative">
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="fixed top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors shadow-sm z-50"
                                title="Exit Full Screen"
                            >
                                <ArrowsPointingInIcon className="w-6 h-6" />
                            </button>

                            <div className="mb-12 text-center">
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-bold rounded-full uppercase tracking-wide mb-4 inline-block">
                                    {selectedTopic.level} • {CATEGORIES[selectedTopic.category]}
                                </span>
                                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                                    {selectedTopic.title}
                                </h1>
                            </div>

                            <div className="prose prose-xl prose-slate max-w-none mx-auto">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={MarkdownComponents}
                                >
                                    {selectedTopic.content}
                                </ReactMarkdown>
                            </div>

                            {selectedTopic.examples && selectedTopic.examples.length > 0 && (
                                <div className="mt-16 bg-slate-50 rounded-3xl p-10 border border-slate-200">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-base">Ex</span>
                                        Examples
                                    </h3>
                                    <div className="grid gap-6">
                                        {selectedTopic.examples.map((example, index) => (
                                            <div
                                                key={index}
                                                className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm"
                                            >
                                                <div className="font-bold text-slate-900 text-xl">{example.german}</div>
                                                {example.english && (
                                                    <div className="text-slate-500 mt-2 font-medium text-lg">
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
                )}
            </AnimatePresence>
        </div>
    );
}

export default GrammarPage;
