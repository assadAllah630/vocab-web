import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { X, Sparkles, ChevronDown, Check } from 'lucide-react';

const typeOptions = [
    { value: 'noun', label: 'Noun' },
    { value: 'verb', label: 'Verb' },
    { value: 'adjective', label: 'Adjective' },
    { value: 'adverb', label: 'Adverb' },
    { value: 'phrase', label: 'Phrase' },
    { value: 'preposition', label: 'Preposition' },
    { value: 'other', label: 'Other' }
];

function MobileAddWord({ user }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        word: '',
        translation: '',
        type: 'noun',
        example: '',
        synonyms: '',
        antonyms: '',
        related_concepts: '',
        tags: []
    });
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (isEditing) fetchWord();
    }, [id]);

    const fetchWord = async () => {
        try {
            const res = await api.get(`vocab/${id}/`);
            setFormData({
                word: res.data.word,
                translation: res.data.translation,
                type: res.data.type,
                example: res.data.example || '',
                synonyms: res.data.synonyms || '',
                antonyms: res.data.antonyms || '',
                related_concepts: res.data.related_concepts || '',
                tags: res.data.tags || []
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleAITranslate = async () => {
        if (!formData.word) return;
        setAiLoading(true);
        try {
            const res = await api.post('ai/chat/', {
                prompt: formData.word,
                context: 'translation'
            });
            if (!res.data.error) {
                setFormData(prev => ({
                    ...prev,
                    translation: res.data.translation || prev.translation,
                    type: res.data.type?.toLowerCase() || prev.type,
                    example: res.data.example || prev.example,
                    synonyms: res.data.synonyms?.join(', ') || prev.synonyms,
                    antonyms: res.data.antonyms?.join(', ') || prev.antonyms
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.word || !formData.translation) return;
        setLoading(true);
        try {
            if (isEditing) await api.put(`vocab/${id}/`, formData);
            else await api.post('vocab/', formData);
            navigate('/m/words');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: '#141416',
        border: '1px solid #27272A',
        color: '#FAFAFA'
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-4 border-b sticky top-0 z-10"
                style={{ borderColor: '#27272A', backgroundColor: 'transparent' }}
            >
                <button
                    onClick={() => navigate('/m/words')}
                    className="p-2 -ml-2"
                    style={{ color: '#71717A' }}
                >
                    <X size={22} />
                </button>
                <h1 className="text-base font-semibold" style={{ color: '#FAFAFA' }}>
                    {isEditing ? 'Edit Word' : 'Add Word'}
                </h1>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.word || !formData.translation}
                    className="text-sm font-semibold disabled:opacity-40"
                    style={{ color: '#6366F1' }}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 pb-10 space-y-5">
                {/* Word Input */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Word / Phrase
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.word}
                            onChange={e => setFormData({ ...formData, word: e.target.value })}
                            placeholder="Enter word..."
                            className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                            style={inputStyle}
                        />
                        <button
                            onClick={handleAITranslate}
                            disabled={aiLoading || !formData.word}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg disabled:opacity-40"
                            style={{ backgroundColor: '#27272A' }}
                        >
                            {aiLoading ? (
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Sparkles size={16} style={{ color: '#6366F1' }} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Translation */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Translation
                    </label>
                    <input
                        type="text"
                        value={formData.translation}
                        onChange={e => setFormData({ ...formData, translation: e.target.value })}
                        placeholder="Enter translation..."
                        className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                        style={inputStyle}
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Type
                    </label>
                    <button
                        onClick={() => setShowTypePicker(true)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl"
                        style={inputStyle}
                    >
                        <span className="capitalize" style={{ color: '#FAFAFA' }}>{formData.type}</span>
                        <ChevronDown size={18} style={{ color: '#71717A' }} />
                    </button>
                </div>

                {/* Example */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Example (optional)
                    </label>
                    <textarea
                        rows={2}
                        value={formData.example}
                        onChange={e => setFormData({ ...formData, example: e.target.value })}
                        placeholder="Use it in a sentence..."
                        className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none"
                        style={inputStyle}
                    />
                </div>

                {/* Synonyms */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Synonyms
                    </label>
                    <input
                        type="text"
                        value={formData.synonyms}
                        onChange={e => setFormData({ ...formData, synonyms: e.target.value })}
                        placeholder="Comma separated..."
                        className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                        style={inputStyle}
                    />
                </div>

                {/* Antonyms */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Antonyms
                    </label>
                    <input
                        type="text"
                        value={formData.antonyms}
                        onChange={e => setFormData({ ...formData, antonyms: e.target.value })}
                        placeholder="Comma separated..."
                        className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                        style={inputStyle}
                    />
                </div>

                {/* Related Concepts */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Related Concepts
                    </label>
                    <input
                        type="text"
                        value={formData.related_concepts}
                        onChange={e => setFormData({ ...formData, related_concepts: e.target.value })}
                        placeholder="Comma separated..."
                        className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                        style={inputStyle}
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#71717A' }}>
                        Tags
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="Add tag..."
                            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                            style={inputStyle}
                        />
                        <button
                            onClick={handleAddTag}
                            disabled={!tagInput.trim()}
                            className="px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-40"
                            style={{ backgroundColor: '#6366F1', color: '#FFFFFF' }}
                        >
                            Add
                        </button>
                    </div>
                    {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                                    style={{ backgroundColor: '#27272A', color: '#FAFAFA' }}
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="opacity-60 hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Type Picker Modal */}
            {showTypePicker && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowTypePicker(false)}
                >
                    <div
                        className="w-full rounded-t-2xl overflow-hidden"
                        style={{
                            backgroundColor: '#141416',
                            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b" style={{ borderColor: '#27272A' }}>
                            <h3 className="text-base font-semibold" style={{ color: '#FAFAFA' }}>
                                Word Type
                            </h3>
                        </div>
                        <div className="py-2">
                            {typeOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setFormData({ ...formData, type: option.value });
                                        setShowTypePicker(false);
                                    }}
                                    className="w-full flex items-center justify-between px-5 py-3.5"
                                >
                                    <span className="text-sm font-medium" style={{ color: '#FAFAFA' }}>
                                        {option.label}
                                    </span>
                                    {formData.type === option.value && (
                                        <Check size={18} style={{ color: '#6366F1' }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MobileAddWord;
