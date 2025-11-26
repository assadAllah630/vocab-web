import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

function Settings() {
    const [apiKey, setApiKey] = useState('');
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('de');
    const [saved, setSaved] = useState(false);
    const [langSaved, setLangSaved] = useState(false);

    // Google TTS states
    const [googleTTSKey, setGoogleTTSKey] = useState('');
    const [googleTTSFileName, setGoogleTTSFileName] = useState('');
    const [googleTTSSaved, setGoogleTTSSaved] = useState(false);
    const [googleTTSValidating, setGoogleTTSValidating] = useState(false);
    const [googleTTSError, setGoogleTTSError] = useState('');

    // Deepgram TTS states
    const [deepgramKey, setDeepgramKey] = useState('');
    const [deepgramSaved, setDeepgramSaved] = useState(false);
    const [deepgramValidating, setDeepgramValidating] = useState(false);

    // Speechify TTS states
    const [speechifyKey, setSpeechifyKey] = useState('');
    const [speechifySaved, setSpeechifySaved] = useState(false);

    // OpenRouter states
    const [openrouterKey, setOpenrouterKey] = useState('');
    const [openrouterSaved, setOpenrouterSaved] = useState(false);
    const [openrouterValidating, setOpenrouterValidating] = useState(false);

    // Image Generation states
    const [hordeKey, setHordeKey] = useState('');
    const [hfToken, setHfToken] = useState('');
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
                stable_horde_api_key: hordeKey,
                huggingface_api_token: hfToken
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
                {/* Gemini API Key Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">Gemini AI Configuration</h2>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">Required</span>
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Enter your Google Gemini API Key to enable AI features like exam generation and chat.</p>
                    </div>
                    <form onSubmit={handleSave} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700">
                                Gemini API Key
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    id="apiKey"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Enter your Gemini API Key"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-500">Get one here</a>.
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            {saved ? 'Saved!' : 'Save API Key'}
                        </button>
                    </form>
                </section>

                {/* OpenRouter API Key Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">OpenRouter Configuration</h2>
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Semantic Search</span>
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Enter your OpenRouter API Key to enable semantic search for vocabulary.</p>
                    </div>
                    <form onSubmit={handleOpenRouterSave} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="openrouterKey" className="block text-sm font-medium text-slate-700">
                                OpenRouter API Key
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    id="openrouterKey"
                                    value={openrouterKey}
                                    onChange={(e) => setOpenrouterKey(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                    placeholder="sk-or-v1-..."
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Don't have a key? <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-500">Get one here</a>.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                {openrouterSaved ? 'Saved!' : 'Save API Key'}
                            </button>
                            <button
                                type="button"
                                onClick={handleTestOpenRouter}
                                disabled={openrouterValidating}
                                className="inline-flex justify-center rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {openrouterValidating ? 'Testing...' : 'Test Key'}
                            </button>
                        </div>
                    </form>
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

                        {/* Hugging Face */}
                        <div>
                            <label htmlFor="hfToken" className="block text-sm font-medium text-slate-700">
                                Hugging Face API Token
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    id="hfToken"
                                    value={hfToken}
                                    onChange={(e) => setHfToken(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                                    placeholder="hf_..."
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Get a token at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-500">huggingface.co</a> (Read permission required).
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

                {/* Google Cloud TTS Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-75 hover:opacity-100 transition-opacity">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Google Cloud TTS (Legacy)</h2>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Upload your Google Cloud Service Account JSON key.</p>
                    </div>

                    <form onSubmit={handleGoogleTTSSave} className="mt-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Service Account Key (JSON)
                            </label>
                            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-slate-300 px-6 pt-5 pb-6">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-slate-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-slate-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                                        >
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".json" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-slate-500">JSON up to 10KB</p>
                                </div>
                            </div>
                            {googleTTSFileName && (
                                <p className="mt-2 text-sm text-green-600">
                                    Selected: {googleTTSFileName}
                                </p>
                            )}
                            {googleTTSError && (
                                <p className="mt-2 text-sm text-red-600">
                                    {googleTTSError}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleTestGoogleTTS}
                                disabled={googleTTSValidating || !googleTTSKey}
                                className="inline-flex justify-center rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {googleTTSValidating ? 'Validating...' : 'Test Key'}
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {googleTTSSaved ? 'Saved!' : 'Save Google Key'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Speechify TTS Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Speechify TTS</h2>
                    <div className="mt-2 max-w-xl text-sm text-slate-500">
                        <p>Enter your Speechify API Key to enable high-quality German voices.</p>
                    </div>
                    <form onSubmit={handleSpeechifySave} className="mt-5">
                        <div>
                            <label htmlFor="speechifyKey" className="block text-sm font-medium text-slate-700">
                                API Key
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="password"
                                    name="speechifyKey"
                                    id="speechifyKey"
                                    value={speechifyKey}
                                    onChange={(e) => setSpeechifyKey(e.target.value)}
                                    className="block w-full flex-1 rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Enter your Speechify API Key"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {speechifySaved ? 'Saved!' : 'Save Key'}
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
