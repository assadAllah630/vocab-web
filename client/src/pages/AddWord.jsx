import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import TagManager from '../components/TagManager';
import { motion } from 'framer-motion';
import {
    ArrowLeftIcon,
    SparklesIcon,
    LanguageIcon,
    BookOpenIcon,
    TagIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

function AddWord({ user }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    // Default to English/German if user not loaded yet
    const nativeLang = user?.native_language === 'ar' ? 'Arabic' :
        user?.native_language === 'ru' ? 'Russian' :
            user?.native_language === 'de' ? 'German' : 'English';

    const targetLang = user?.target_language === 'ar' ? 'Arabic' :
        user?.target_language === 'ru' ? 'Russian' :
            user?.target_language === 'en' ? 'English' : 'German';

    const [formData, setFormData] = useState({
        word: '',
        translation: '',
        type: 'noun',
        example: '',
        tags: [],
        is_public: false,
        synonyms: '',
        antonyms: '',
        related_concepts: ''
    });
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchWord();
        }
    }, [id]);

    const fetchWord = async () => {
        try {
            const res = await api.get(`vocab/${id}/`);
            setFormData({
                word: res.data.word,
                translation: res.data.translation,
                type: res.data.type,
                example: res.data.example || '',
                tags: res.data.tags || [],
                is_public: res.data.is_public || false,
                synonyms: (res.data.synonyms || []).join(', '),
                antonyms: (res.data.antonyms || []).join(', '),
                related_concepts: (res.data.related_concepts || []).join(', ')
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load word details.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAITranslate = async () => {
        if (!formData.word) {
            setError('Please enter a word first.');
            return;
        }

        setAiLoading(true);
        setError('');

        try {
            const res = await api.post('ai/chat/', {
                prompt: formData.word,
                context: 'translation'
            });

            if (res.data.error) {
                setError(res.data.error);
            } else {
                setFormData(prev => ({
                    ...prev,
                    translation: res.data.translation || prev.translation,
                    type: res.data.type?.toLowerCase() || prev.type,
                    example: res.data.example || prev.example,
                    synonyms: (res.data.synonyms || []).join(', '),
                    antonyms: (res.data.antonyms || []).join(', '),
                    related_concepts: (res.data.related_concepts || []).join(', ')
                }));
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to fetch translation from AI. Please check if your API Key is saved in Settings.');
            }
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                synonyms: formData.synonyms.split(',').map(s => s.trim()).filter(s => s),
                antonyms: formData.antonyms.split(',').map(s => s.trim()).filter(s => s),
                related_concepts: formData.related_concepts.split(',').map(s => s.trim()).filter(s => s)
            };

            if (isEditing) {
                await api.put(`vocab/${id}/`, payload);
            } else {
                await api.post('vocab/', payload);
            }
            navigate('/vocab');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                // Handle specific field errors (like duplicate word)
                if (err.response.data.non_field_errors) {
                    setError(err.response.data.non_field_errors[0]);
                } else if (err.response.data.word) {
                    setError(err.response.data.word[0]);
                } else {
                    setError(`Failed to ${isEditing ? 'update' : 'add'} word. Please try again.`);
                }
            } else {
                setError(`Failed to ${isEditing ? 'update' : 'add'} word. Please try again.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { value: 'noun', label: 'Nomen', subLabel: 'Substantiv', icon: '📦' },
        { value: 'verb', label: 'Verb', subLabel: 'Zeitwort', icon: '⚡' },
        { value: 'adjective', label: 'Adjektiv', subLabel: 'Eigenschaftswort', icon: '🎨' },
        { value: 'article', label: 'Artikel', subLabel: 'Begleiter', icon: '🎯' },
        { value: 'pronoun', label: 'Pronomen', subLabel: 'Fürwort', icon: '👉' },
        { value: 'numeral', label: 'Numerale', subLabel: 'Zahlwort', icon: '🔢' },
        { value: 'adverb', label: 'Adverb', subLabel: 'Umstandswort', icon: '⏩' },
        { value: 'preposition', label: 'Präposition', subLabel: 'Verhältniswort', icon: '📍' },
        { value: 'conjunction', label: 'Konjunktion', subLabel: 'Bindewort', icon: '🔗' },
        { value: 'interjection', label: 'Interjektion', subLabel: 'Ausrufewort', icon: '❗' },
        { value: 'phrase', label: 'Phrase', subLabel: '', icon: '💬' },
        { value: 'other', label: 'Other', subLabel: '', icon: '📌' }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/vocab')}
                            className="flex items-center text-slate-500 hover:text-primary-600 transition-colors mb-2 group"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Back to Vocabulary
                        </button>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {isEditing ? 'Edit Word' : 'Add New Word'}
                        </h1>
                        <p className="mt-2 text-lg text-slate-600">
                            {isEditing ? 'Refine your vocabulary entry.' : 'Expand your collection with new words.'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Word & Translation Group */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="word" className="block text-sm font-bold text-slate-700">
                                        Word / Phrase <span className="text-primary-500">({targetLang})</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LanguageIcon className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="word"
                                            id="word"
                                            required
                                            className="block w-full pl-10 pr-24 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-lg"
                                            placeholder="e.g. Zeitgeist"
                                            value={formData.word}
                                            onChange={handleChange}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                            <button
                                                type="button"
                                                onClick={handleAITranslate}
                                                disabled={aiLoading || !formData.word}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                                                title="Auto-fill translation and example using AI"
                                            >
                                                {aiLoading ? (
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <>
                                                        <SparklesIcon className="w-3 h-3 mr-1" />
                                                        Auto-fill
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="translation" className="block text-sm font-bold text-slate-700">
                                        Translation <span className="text-primary-500">({nativeLang})</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <GlobeAltIcon className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="translation"
                                            id="translation"
                                            required
                                            className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-lg"
                                            placeholder="e.g. Spirit of the times"
                                            value={formData.translation}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700">
                                    Word Type
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {typeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: option.value })}
                                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${formData.type === option.value
                                                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md transform scale-105'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className="text-2xl mb-1">{option.icon}</span>
                                            <span className="text-xs font-bold">{option.label}</span>
                                            {option.subLabel && <span className="text-[10px] text-slate-400">{option.subLabel}</span>}
                                            {formData.type === option.value && (
                                                <div className="absolute top-1 right-1">
                                                    <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Example Input */}
                            <div className="space-y-2">
                                <label htmlFor="example" className="block text-sm font-bold text-slate-700">
                                    Example Sentence
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <BookOpenIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <textarea
                                        name="example"
                                        id="example"
                                        rows="3"
                                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Use the word in a sentence..."
                                        value={formData.example}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Synonyms, Antonyms, Related Concepts */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="synonyms" className="block text-sm font-bold text-slate-700">
                                        Synonyms
                                    </label>
                                    <input
                                        type="text"
                                        name="synonyms"
                                        id="synonyms"
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Comma separated..."
                                        value={formData.synonyms}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="antonyms" className="block text-sm font-bold text-slate-700">
                                        Antonyms
                                    </label>
                                    <input
                                        type="text"
                                        name="antonyms"
                                        id="antonyms"
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Comma separated..."
                                        value={formData.antonyms}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="related_concepts" className="block text-sm font-bold text-slate-700">
                                        Related Concepts
                                    </label>
                                    <input
                                        type="text"
                                        name="related_concepts"
                                        id="related_concepts"
                                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Comma separated..."
                                        value={formData.related_concepts}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Tags Input */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Tags
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <TagIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div className="pl-8">
                                        <TagManager
                                            tags={formData.tags}
                                            onChange={(newTags) => setFormData({ ...formData, tags: newTags })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Public Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <label htmlFor="is_public" className="font-bold text-slate-900 block">
                                        Share with community
                                    </label>
                                    <p className="text-sm text-slate-500">Allow other users to see and copy this word.</p>
                                </div>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="is_public"
                                        id="is_public"
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-primary-500"
                                        checked={formData.is_public}
                                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                        style={{ right: formData.is_public ? '0' : 'auto', left: formData.is_public ? 'auto' : '0' }}
                                    />
                                    <label
                                        htmlFor="is_public"
                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${formData.is_public ? 'bg-primary-500' : 'bg-slate-300'}`}
                                    ></label>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3"
                                >
                                    <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-700 font-medium">{error}</div>
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => navigate('/vocab')}
                                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        isEditing ? 'Update Word' : 'Save Word'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Tips Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 flex items-start gap-4"
                >
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-blue-900 font-bold mb-1">Pro Tip</h3>
                        <p className="text-blue-700 text-sm leading-relaxed">
                            Adding context helps! Try to include an example sentence that uses the word in a way that's meaningful to you. The AI Auto-fill feature can generate these for you automatically.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default AddWord;
