import React, { useState, useEffect } from 'react';
import api from '../api';

function AISetupModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (!storedKey) {
            setIsOpen(true);
        }
    }, []);

    const handleSave = async () => {
        if (!apiKey) {
            setError('Please enter an API Key.');
            return;
        }

        setValidating(true);
        setError('');

        try {
            // Validate with backend
            const res = await api.post('ai-validate/', { api_key: apiKey });

            if (res.data.valid) {
                localStorage.setItem('gemini_api_key', apiKey);
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                }, 1500);
            } else {
                setError(res.data.error || 'Invalid API Key');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to validate API Key');
        } finally {
            setValidating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                            <span className="text-2xl">✨</span>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                                Unlock AI Features
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-500">
                                    To use smart features like <b>Auto-fill</b>, <b>Smart Linking</b>, and the <b>AI Assistant</b>, please enter your Google Gemini API Key.
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Your key is stored locally on your device and never shared.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <input
                            type="text"
                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 mb-4"
                            placeholder="Paste your Gemini API Key here"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        {error && (
                            <p className="text-sm text-red-600 mb-4">{error}</p>
                        )}
                        {success && (
                            <p className="text-sm text-green-600 mb-4">API Key verified and saved!</p>
                        )}
                        <button
                            type="button"
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSave}
                            disabled={validating || success}
                        >
                            {validating ? 'Validating...' : success ? 'Success!' : 'Save & Enable AI'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AISetupModal;
