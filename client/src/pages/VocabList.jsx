import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';
import { getTranslationStyle } from '../utils/bidi';
import {
    SpeakerWaveIcon,
    TrashIcon,
    PencilSquareIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowUpTrayIcon,
    ArrowPathIcon,
    SparklesIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

function VocabList() {
    const { currentLanguage, nativeLanguage, isNativeRTL } = useLanguage();
    const [vocab, setVocab] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [ordering, setOrdering] = useState('-created_at');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef(null);

    // Semantic search states
    const [useSemanticSearch, setUseSemanticSearch] = useState(false);
    const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
    const [embeddingProgress, setEmbeddingProgress] = useState(null);

    useEffect(() => {
        fetchVocab();
    }, [currentLanguage, filterType, ordering, currentPage]);

    // Debounce search - only for regular text search
    useEffect(() => {
        if (!useSemanticSearch) {
            const timer = setTimeout(() => {
                if (searchTerm) fetchVocab();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, useSemanticSearch]);

    const fetchVocab = async () => {
        // Skip if semantic search is enabled (handled by handleSemanticSearch)
        if (useSemanticSearch && searchTerm) return;

        setLoading(true);
        try {
            const params = {
                page: currentPage,
                ordering: ordering,
                search: searchTerm,
                type: filterType !== 'all' ? filterType : undefined
            };

            const res = await api.get('vocab/', { params });

            // Handle paginated response
            if (res.data && res.data.results) {
                setVocab(Array.isArray(res.data.results) ? res.data.results : []);
                setTotalPages(Math.ceil(res.data.count / 20));
            } else if (res.data && Array.isArray(res.data)) {
                // Fallback for non-paginated
                setVocab(res.data);
            } else {
                // Unexpected response structure
                console.error('Unexpected API response structure:', res.data);
                setVocab([]);
            }
        } catch (err) {
            console.error('Failed to fetch vocabulary:', err);
            setVocab([]); // Ensure vocab is always an array
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        try {
            const res = await api.post('vocab/import_csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert(res.data.message || 'Import successful!');
            if (res.data.errors && res.data.errors.length > 0) {
                console.warn('Import errors:', res.data.errors);
                alert('Some items failed to import. Check console for details.');
            }
            fetchVocab(); // Refresh list
        } catch (err) {
            console.error('Import failed', err);
            alert('Import failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this word?')) return;
        try {
            await api.delete(`vocab/${id}/`);
            setVocab(vocab.filter(word => word.id !== id));
        } catch (err) {
            console.error('Failed to delete word:', err);
            alert('Failed to delete word. Please try again.');
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Try to set German voice if available
            const voices = window.speechSynthesis.getVoices();
            const deVoice = voices.find(v => v.lang.startsWith('de'));
            if (deVoice) utterance.voice = deVoice;
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Text-to-speech is not supported in your browser.');
        }
    };

    // Semantic search handlers
    const handleSemanticSearch = async () => {
        console.log('🔍 handleSemanticSearch called, searchTerm:', searchTerm, 'useSemanticSearch:', useSemanticSearch);

        if (!searchTerm) {
            console.log('⚠️ No searchTerm, calling fetchVocab');
            fetchVocab(); // Regular search if no term
            return;
        }

        console.log('🔑 Checking API key...');
        const apiKey = localStorage.getItem('openrouter_api_key');
        console.log('🔑 API key found:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

        if (!apiKey) {
            console.log('❌ No API key, aborting search');
            alert('Please add your OpenRouter API key in Settings to use semantic search');
            setVocab([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log('📡 Sending semantic search request for:', searchTerm);
            const res = await api.post('vocab/semantic-search/', {
                query: searchTerm,
                api_key: apiKey,
                limit: 4
            });

            console.log('✅ Semantic search response:', res.data);

            if (Array.isArray(res.data)) {
                console.log(`📊 Got ${res.data.length} results (array format)`);
                // Store similarity score in the vocab object
                setVocab(res.data.map(r => ({ ...r.vocab, similarity: r.similarity })));
            } else if (res.data.results) {
                console.log(`📊 Got ${res.data.results.length} results (results format)`);
                setVocab(res.data.results.map(r => ({ ...r.vocab, similarity: r.similarity })));
            } else if (res.data.message) {
                console.log('⚠️ Got message:', res.data.message);
                alert(res.data.message);
                setVocab([]);
            }
        } catch (err) {
            console.error('❌ Semantic search failed:', err);
            alert('Semantic search failed: ' + (err.response?.data?.error || err.message));
            setVocab([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateEmbeddings = async () => {
        const apiKey = localStorage.getItem('openrouter_api_key');
        if (!apiKey) {
            alert('Please add your OpenRouter API key in Settings first');
            return;
        }

        if (!window.confirm('This will generate embeddings for all vocabulary items. This may take a few minutes. Continue?')) {
            return;
        }

        setGeneratingEmbeddings(true);
        setEmbeddingProgress('Generating embeddings...');

        try {
            const res = await api.post('vocab/generate-embeddings/', {
                api_key: apiKey
            });

            setEmbeddingProgress(null);
            alert(res.data.message || 'Embeddings generated successfully!');
        } catch (err) {
            console.error('Failed to generate embeddings:', err);
            alert('Failed to generate embeddings: ' + (err.response?.data?.error || err.message));
            setEmbeddingProgress(null);
        } finally {
            setGeneratingEmbeddings(false);
        }
    };

    // Trigger semantic search when toggle is enabled or search term changes
    useEffect(() => {
        if (useSemanticSearch && searchTerm) {
            handleSemanticSearch();
        } else if (!useSemanticSearch && searchTerm) {
            fetchVocab();
        } else if (!searchTerm) {
            fetchVocab();
        }
    }, [useSemanticSearch, searchTerm]);

    const typeConfig = {
        noun: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        verb: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
        adjective: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
        article: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        pronoun: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
        numeral: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
        adverb: { color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-100' },
        preposition: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        conjunction: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        interjection: { color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
        phrase: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        other: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Vocabulary Bank
                    </h2>
                    <p className="mt-1 text-lg text-slate-500">
                        Manage your collection of <span className="font-bold text-primary-600">{vocab.length}</span> words
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Generate Embeddings Button */}
                    <button
                        onClick={handleGenerateEmbeddings}
                        disabled={generatingEmbeddings}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-600 border border-purple-700 text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-all disabled:opacity-50"
                        title="Generate embeddings for semantic search"
                    >
                        {generatingEmbeddings ? (
                            <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        ) : (
                            <BoltIcon className="-ml-1 mr-2 h-5 w-5" />
                        )}
                        {generatingEmbeddings ? 'Generating...' : 'Generate Embeddings'}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        {importing ? (
                            <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        ) : (
                            <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                        )}
                        {importing ? 'Importing...' : 'Import CSV'}
                    </button>
                    <Link
                        to="/vocab/add"
                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Add New Word
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-xl shadow-glass rounded-2xl border border-white/50 p-2 sticky top-4 z-20">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full rounded-xl border-0 py-3 pl-10 pr-32 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all"
                            placeholder={useSemanticSearch ? "Search by meaning (Press Enter)..." : "Search words or translations..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && useSemanticSearch) {
                                    handleSemanticSearch();
                                }
                            }}
                        />
                        {/* Semantic Search Toggle */}
                        <button
                            onClick={() => setUseSemanticSearch(!useSemanticSearch)}
                            className={`absolute inset-y-0 right-0 flex items-center px-3 m-1 rounded-lg text-xs font-bold transition-all ${useSemanticSearch
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            title="Toggle semantic search"
                        >
                            <SparklesIcon className="h-4 w-4 mr-1" />
                            {useSemanticSearch ? 'Semantic' : 'Text'}
                        </button>
                    </div>
                    <div className="relative min-w-[200px]">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FunnelIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                            className="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all appearance-none"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="noun">Nouns (Nomen)</option>
                            <option value="verb">Verbs (Verben)</option>
                            <option value="adjective">Adjectives (Adjektive)</option>
                            <option value="article">Articles (Artikel)</option>
                            <option value="pronoun">Pronouns (Pronomen)</option>
                            <option value="numeral">Numerals (Numeralien)</option>
                            <option value="adverb">Adverbs (Adverbien)</option>
                            <option value="preposition">Prepositions (Präpositionen)</option>
                            <option value="conjunction">Conjunctions (Konjunktionen)</option>
                            <option value="interjection">Interjections (Interjektionen)</option>
                            <option value="phrase">Phrases</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="relative min-w-[200px]">
                        <select
                            className="block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-primary-500 bg-slate-50/50 focus:bg-white transition-all appearance-none"
                            value={ordering}
                            onChange={(e) => setOrdering(e.target.value)}
                        >
                            <option value="-created_at">Newest First</option>
                            <option value="created_at">Oldest First</option>
                            <option value="word">A-Z</option>
                            <option value="-word">Z-A</option>
                            <option value="type,word">Type & A-Z</option>
                            <option value="-last_seen">Recently Reviewed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List Content */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <SkeletonVocabCard />
                    <SkeletonVocabCard />
                    <SkeletonVocabCard />
                    <SkeletonVocabCard />
                    <SkeletonVocabCard />
                    <SkeletonVocabCard />
                </div>
            ) : vocab.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed"
                >
                    <div className="mx-auto h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MagnifyingGlassIcon className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No words found</h3>
                    <p className="mt-2 text-slate-500">
                        {searchTerm || filterType !== 'all'
                            ? 'Try adjusting your search or filter.'
                            : 'Get started by creating a new word.'}
                    </p>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        layout
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <AnimatePresence>
                            {vocab.map((word) => {
                                const config = typeConfig[word.type] || typeConfig.other;
                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        key={word.id}
                                        className="group relative bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${config.bg.replace('bg-', 'bg-gradient-to-b from-').replace('50', '400').replace('100', '500')} to-white`} />

                                        {/* Similarity Score Badge */}
                                        {useSemanticSearch && word.similarity && (
                                            <div className="absolute top-4 right-4 z-10 bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200 shadow-sm flex items-center gap-1">
                                                <SparklesIcon className="w-3 h-3" />
                                                {Math.round(word.similarity * 100)}% Match
                                            </div>
                                        )}

                                        <div className="p-6 pl-8">
                                            <div className="flex items-start justify-between mb-4">
                                                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                                                    {word.type}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); speak(word.word); }}
                                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Listen"
                                                    >
                                                        <SpeakerWaveIcon className="w-4 h-4" />
                                                    </button>
                                                    <Link
                                                        to={`/vocab/edit/${word.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(word.id); }}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{word.word}</h3>
                                                <p
                                                    className="text-lg font-medium"
                                                    style={{
                                                        color: '#475569',
                                                        ...getTranslationStyle(nativeLanguage),
                                                    }}
                                                >
                                                    {word.translation}
                                                </p>
                                            </div>

                                            {word.example && (
                                                <div className="relative mt-4 pt-4 border-t border-slate-50">
                                                    <p className="text-sm text-slate-500 italic leading-relaxed">
                                                        "{word.example}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Enhanced Metadata Section */}
                                            {(Array.isArray(word.synonyms) && word.synonyms.length > 0 || Array.isArray(word.antonyms) && word.antonyms.length > 0 || Array.isArray(word.related_concepts) && word.related_concepts.length > 0) && (
                                                <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                                                    {Array.isArray(word.synonyms) && word.synonyms.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 text-xs">
                                                            <span className="text-slate-400 font-medium mr-1">Syn:</span>
                                                            {word.synonyms.map((syn, i) => (
                                                                <span key={i} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">{syn}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {Array.isArray(word.antonyms) && word.antonyms.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 text-xs">
                                                            <span className="text-slate-400 font-medium mr-1">Ant:</span>
                                                            {word.antonyms.map((ant, i) => (
                                                                <span key={i} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">{ant}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {Array.isArray(word.related_concepts) && word.related_concepts.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 text-xs">
                                                            <span className="text-slate-400 font-medium mr-1">Rel:</span>
                                                            {word.related_concepts.map((rel, i) => (
                                                                <span key={i} className="bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded border border-primary-100">{rel}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
                                                <span>Added {new Date(word.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-slate-600 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>

            )}
        </div>
    );
}

// Skeleton Loader for Vocabulary Cards
function SkeletonVocabCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-6 bg-slate-200 rounded-lg"></div>
                <div className="flex gap-1">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                </div>
            </div>
            <div className="space-y-2 mb-4">
                <div className="w-32 h-7 bg-slate-200 rounded"></div>
                <div className="w-24 h-5 bg-slate-200 rounded"></div>
            </div>
            <div className="pt-4 border-t border-slate-50">
                <div className="w-full h-4 bg-slate-200 rounded mb-2"></div>
                <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50">
                <div className="w-20 h-3 bg-slate-200 rounded"></div>
            </div>
        </div>
    );
}

export default VocabList;

