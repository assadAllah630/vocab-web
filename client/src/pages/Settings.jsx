import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

import usePushNotifications from '../hooks/usePushNotifications';

function Settings() {
    const { requestPermission, token } = usePushNotifications();
    const [apiKey, setApiKey] = useState('');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('de');
    const [saved, setSaved] = useState(false);
    const [langSaved, setLangSaved] = useState(false);



    // Deepgram TTS states
    const [deepgramKey, setDeepgramKey] = useState('');
    const [deepgramSaved, setDeepgramSaved] = useState(false);
    const [deepgramValidating, setDeepgramValidating] = useState(false);



    // OpenRouter states
    const [openrouterKey, setOpenrouterKey] = useState('');
    const [openrouterSaved, setOpenrouterSaved] = useState(false);
    const [openrouterValidating, setOpenrouterValidating] = useState(false);

    // Image Generation states
    const [hordeKey, setHordeKey] = useState('');

    const [imageGenSaved, setImageGenSaved] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('profile/');
                setNativeLang(res.data.native_language);
                setTargetLang(res.data.target_language);
                // API keys are write-only, so we don't load them back
            } catch (err) {
                console.error('Failed to load profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleLangSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('update_profile/', {
                native_language: nativeLang,
                target_language: targetLang
            });
            setLangSaved(true);
            setTimeout(() => setLangSaved(false), 3000);
        } catch (err) {
            console.error('Failed to update profile', err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('profile/', {
                gemini_api_key: apiKey
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save Gemini key', err);
            alert('Failed to save API key');
        }
    };

    // Google TTS handlers
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setGoogleTTSError('');
        setGoogleTTSFileName(file.name);

        try {
            const text = await file.text();
            JSON.parse(text);
            setGoogleTTSKey(text);
        } catch (err) {
            setGoogleTTSError('Invalid JSON file. Please upload a valid Google Cloud service account key.');
            setGoogleTTSKey('');
            setGoogleTTSFileName('');
        }
    };

    const handleTestGoogleTTS = async () => {
        if (!googleTTSKey.trim()) {
            alert('Please upload a JSON key file first');
            return;
        }

        setGoogleTTSValidating(true);
        try {
            const res = await api.post('tts/validate/', {
                api_key: googleTTSKey
            });

            if (res.data.valid) {
                alert(`✓ API key is valid! Found ${res.data.total_voices} voices.`);
            } else {
                alert(`✗ ${res.data.error}`);
            }
        } catch (err) {
            alert('✗ Invalid API key or connection error');
        } finally {
            setGoogleTTSValidating(false);
        }
    };

    const handleGoogleTTSSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('profile/', {
                google_tts_api_key: googleTTSKey
            });
            setGoogleTTSSaved(true);
            setTimeout(() => setGoogleTTSSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save Google TTS key', err);
            alert('Failed to save API key');
        }
    };

    // Deepgram TTS handlers
    const handleTestDeepgram = async () => {
        if (!deepgramKey.trim()) {
            alert('Please enter a Deepgram API Key first');
            return;
        }

        setDeepgramValidating(true);
        try {
            const res = await api.post('tts/validate-deepgram/', {
                api_key: deepgramKey
            });

            if (res.data.valid) {
                alert(`✓ ${res.data.message}`);
            } else {
                alert(`✗ ${res.data.error}`);
            }
        } catch (err) {
            alert('✗ Invalid API key or connection error');
        } finally {
            setDeepgramValidating(false);
        }
    };

    const handleDeepgramSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('profile/', {
                deepgram_api_key: deepgramKey
            });
            setDeepgramSaved(true);
            setTimeout(() => setDeepgramSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save Deepgram key', err);
            alert('Failed to save API key');
        }
    };

    const handleSpeechifySave = async (e) => {
        e.preventDefault();
        try {
            await api.put('profile/', {
                speechify_api_key: speechifyKey
            });
            setSpeechifySaved(true);
            setTimeout(() => setSpeechifySaved(false), 3000);
        } catch (err) {
            console.error('Failed to save Speechify key', err);
            alert('Failed to save API key');
        }
    };

    // OpenRouter handlers
    const handleTestOpenRouter = async () => {
        if (!openrouterKey.trim()) {
            alert('Please enter an OpenRouter API Key first');
            return;
        }

        setOpenrouterValidating(true);
        try {
            const res = await api.post('vocab/validate-openrouter/', {
                api_key: openrouterKey
            });

            if (res.data.valid) {
                alert('✓ OpenRouter API key is valid!');
            } else {
                alert(`✗ ${res.data.error}`);
            }
        } catch (err) {
            alert('✗ Invalid API key or connection error');
        } finally {
            setOpenrouterValidating(false);
        }
    };

    const handleOpenRouterSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('profile/', {
                openrouter_api_key: openrouterKey
            });
            setOpenrouterSaved(true);
            setTimeout(() => setOpenrouterSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save OpenRouter key', err);
            alert('Failed to save API key');
        }
    };

    const handleImageGenSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('profile/', {
                stable_horde_api_key: hordeKey
            });
            setImageGenSaved(true);
            setTimeout(() => setImageGenSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save image generation keys', err);
            alert('Failed to save API keys');
        }
    };


    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Settings</h1>

            <div className="space-y-8">
                {/* AI Gateway Banner */}
                <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg border border-transparent p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">AI Gateway</h2>
                        <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">New</span>
                    </div>
                    <p className="text-blue-100 mb-6 max-w-2xl">
                        Manage your AI providers (Gemini, OpenRouter, HuggingFace) in one place with advanced health tracking, quota management, and failover protection.
                    </p>
                    <Link
                        to="/ai-gateway"
                        className="inline-flex items-center justify-center rounded-lg bg-white text-blue-700 px-5 py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors"
                    >
                        Manage AI Keys
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                </section>



                {/* Image Generation Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Image Generation Configuration</h2>
                        <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-800">Optional</span>
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Configure keys for AI image generation. Stable Horde is free (slower), Hugging Face is faster (requires token).</p>
                    </div>

                    <form onSubmit={handleImageGenSave} className="mt-5 space-y-6">
                        {/* Stable Horde */}
                        <div>
                            <label htmlFor="hordeKey" className="block text-sm font-medium text-slate-700">
                                Stable Horde API Key
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    id="hordeKey"
                                    value={hordeKey}
                                    onChange={(e) => setHordeKey(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                                    placeholder="Enter your Stable Horde API Key (or leave empty for anonymous)"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Get a free key at <a href="https://stablehorde.net/register" target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-500">stablehorde.net</a> for higher priority.
                            </p>
                        </div>



                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-pink-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                        >
                            {imageGenSaved ? 'Saved!' : 'Save Image Keys'}
                        </button>
                    </form>
                </section>

                {/* Notification Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Recommended</span>
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Enable push notifications to get alerted when your exam generation is complete or to receive daily reminders.</p>
                    </div>
                    <div className="mt-5">
                        <button
                            onClick={requestPermission}
                            className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${token
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            disabled={!!token}
                        >
                            {token ? (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Notifications Enabled
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    Enable Notifications
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {/* Language Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Language Preferences</h2>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Set your native language and the language you want to learn.</p>
                    </div>
                    <form onSubmit={handleLangSave} className="mt-5 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div>
                            <label htmlFor="nativeLang" className="block text-sm font-medium text-slate-700">
                                Native Language
                            </label>
                            <select
                                id="nativeLang"
                                value={nativeLang}
                                onChange={(e) => setNativeLang(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="en">English</option>
                                <option value="de">German</option>
                                <option value="ar">Arabic</option>
                                <option value="ru">Russian</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="targetLang" className="block text-sm font-medium text-slate-700">
                                Target Language
                            </label>
                            <select
                                id="targetLang"
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="en">English</option>
                                <option value="de">German</option>
                                <option value="ar">Arabic</option>
                                <option value="ru">Russian</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {langSaved ? 'Saved!' : 'Save Preferences'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Deepgram TTS Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Deepgram TTS</h2>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">Recommended</span>
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Enter your Deepgram API Key to enable high-quality AI voices.</p>
                    </div>
                    <form onSubmit={handleDeepgramSave} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="deepgramKey" className="block text-sm font-medium text-slate-700">
                                Deepgram API Key
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    id="deepgramKey"
                                    value={deepgramKey}
                                    onChange={(e) => setDeepgramKey(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Enter your Deepgram API Key"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Don't have a key? <a href="https://console.deepgram.com/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-500">Get one here</a>.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleTestDeepgram}
                                disabled={deepgramValidating || !deepgramKey}
                                className="inline-flex justify-center rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {deepgramValidating ? 'Validating...' : 'Test Key'}
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {deepgramSaved ? 'Saved!' : 'Save Deepgram Key'}
                            </button>
                        </div>
                    </form>
                </section>



                {/* Data Management Section */}
                <div className="bg-white shadow sm:rounded-lg border border-slate-200">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-base font-semibold leading-6 text-slate-900">Data Management</h3>
                        <div className="mt-2 max-w-xl text-sm text-slate-500">
                            <p>Export your vocabulary list to a CSV file.</p>
                        </div>
                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const response = await api.get('vocab/export_csv/', { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `vocabulary_export_${new Date().toISOString().split('T')[0]}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    } catch (err) {
                                        console.error('Failed to export CSV', err);
                                        alert('Failed to export CSV. Please try again.');
                                    }
                                }}
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                            >
                                <svg className="-ml-0.5 mr-1.5 h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5a.75.75 0 001.5 0v-2.5a.75.75 0 01.75-.75h8.5a.75.75 0 01.75.75v2.5a.75.75 0 001.5 0v-2.5A2.25 2.25 0 0012.75 2h-8.5zM2.25 12.25a.75.75 0 00.75.75h14a.75.75 0 00.75-.75v-2.5a.75.75 0 00-1.5 0v2.5h-14v-2.5a.75.75 0 00-1.5 0v2.5zM9.22 6.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06L10 8.06v5.69a.75.75 0 01-1.5 0V8.06L6.78 9.78a.75.75 0 01-1.06-1.06l2.5-2.5z" clipRule="evenodd" />
                                </svg>
                                Export Vocabulary (CSV)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
