import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../api';

const API_KEYS = [
    {
        id: 'gemini_api_key',
        name: 'Gemini API Key',
        icon: '✨',
        description: 'For AI formatting & text analysis',
        placeholder: 'AIza...',
        helpUrl: 'https://aistudio.google.com/apikey',
        free: true
    },
    {
        id: 'openrouter_api_key',
        name: 'OpenRouter API Key',
        icon: '🔀',
        description: 'Alternative AI provider',
        placeholder: 'sk-or-...',
        helpUrl: 'https://openrouter.ai/',
        free: true
    },
    {
        id: 'google_tts_api_key',
        name: 'Google TTS API Key',
        icon: '🔊',
        description: 'Premium text-to-speech',
        placeholder: 'AIza...',
        helpUrl: 'https://console.cloud.google.com/',
        free: false
    },
    {
        id: 'deepgram_api_key',
        name: 'Deepgram API Key',
        icon: '🎙️',
        description: 'Speech recognition',
        placeholder: 'Your Deepgram key',
        helpUrl: 'https://deepgram.com/',
        free: false
    },
    {
        id: 'stable_horde_api_key',
        name: 'Stable Horde API Key',
        icon: '🖼️',
        description: 'Free image generation',
        placeholder: '0000000000',
        helpUrl: 'https://stablehorde.net/',
        free: true
    }
];

const MobileAPISettings = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [keys, setKeys] = useState({});
    const [showKeys, setShowKeys] = useState({});

    useEffect(() => {
        // Load current keys from profile
        if (user?.profile) {
            const currentKeys = {};
            API_KEYS.forEach(key => {
                currentKeys[key.id] = user.profile[key.id] || '';
            });
            setKeys(currentKeys);
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await api.post('update_profile/', keys);

            setUser(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    ...keys
                }
            }));

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to save:', err);
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleShowKey = (id) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateKey = (id, value) => {
        setKeys(prev => ({ ...prev, [id]: value }));
        setSaved(false);
    };

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between"
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
                    API Keys
                </h1>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl font-medium text-sm"
                    style={{
                        background: saved ? '#22C55E' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
                </motion.button>
            </div>

            <div className="px-5 pt-6">
                {/* Info Banner */}
                <div
                    className="rounded-xl p-4 mb-6 flex items-start gap-3"
                    style={{ backgroundColor: '#6366F110', border: '1px solid #6366F130' }}
                >
                    <Sparkles size={20} style={{ color: '#6366F1' }} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>
                            Unlock AI Features
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#A1A1AA' }}>
                            Add your API keys to enable AI formatting, translations, and more. Keys marked with 🆓 have free tiers.
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="rounded-xl p-4 mb-4 flex items-center gap-3"
                        style={{ backgroundColor: '#EF444420', border: '1px solid #EF444440' }}
                    >
                        <AlertCircle size={18} style={{ color: '#EF4444' }} />
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </div>
                )}

                {/* API Key Fields */}
                <div className="space-y-4">
                    {API_KEYS.map((apiKey) => (
                        <motion.div
                            key={apiKey.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-4"
                            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{apiKey.icon}</span>
                                    <span className="font-medium text-sm" style={{ color: '#FAFAFA' }}>
                                        {apiKey.name}
                                    </span>
                                    {apiKey.free && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                            style={{ backgroundColor: '#22C55E20', color: '#22C55E' }}
                                        >
                                            🆓 FREE
                                        </span>
                                    )}
                                </div>
                                <a
                                    href={apiKey.helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-2 py-1 rounded-lg"
                                    style={{ backgroundColor: '#27272A', color: '#6366F1' }}
                                >
                                    Get Key
                                </a>
                            </div>
                            <p className="text-xs mb-3" style={{ color: '#71717A' }}>
                                {apiKey.description}
                            </p>
                            <div className="relative">
                                <input
                                    type={showKeys[apiKey.id] ? 'text' : 'password'}
                                    value={keys[apiKey.id] || ''}
                                    onChange={(e) => updateKey(apiKey.id, e.target.value)}
                                    placeholder={apiKey.placeholder}
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
                                    style={{
                                        backgroundColor: '#141416',
                                        border: '1px solid #27272A',
                                        color: '#FAFAFA'
                                    }}
                                />
                                <button
                                    onClick={() => toggleShowKey(apiKey.id)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                >
                                    {showKeys[apiKey.id] ? (
                                        <EyeOff size={18} style={{ color: '#52525B' }} />
                                    ) : (
                                        <Eye size={18} style={{ color: '#52525B' }} />
                                    )}
                                </button>
                            </div>
                            {keys[apiKey.id] && (
                                <div className="flex items-center gap-1 mt-2">
                                    <CheckCircle size={12} style={{ color: '#22C55E' }} />
                                    <span className="text-xs" style={{ color: '#22C55E' }}>Key saved</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#71717A' }}>💡 Tips</p>
                    <ul className="text-xs space-y-1" style={{ color: '#52525B' }}>
                        <li>• Gemini offers a generous free tier for AI features</li>
                        <li>• OpenRouter has free models like Llama and DeepSeek</li>
                        <li>• Your keys are stored securely and never shared</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MobileAPISettings;
