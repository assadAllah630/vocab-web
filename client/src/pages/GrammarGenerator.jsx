import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import GrammarViewer from '../components/GrammarViewer';

const GrammarGenerator = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        language: 'de',
        level: 'A1',
        context_note: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatedTopic, setGeneratedTopic] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGeneratedTopic(null);

        try {
            const response = await api.post('/grammar/generate/', formData);
            setGeneratedTopic(response.data);
        } catch (err) {
            console.error('Generation failed:', err);
            setError(err.response?.data?.error || 'Failed to generate grammar topic. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        // Already saved by the backend upon generation
        navigate('/grammar');
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Grammar Agent</h1>
                    <button
                        onClick={() => navigate('/grammar')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        Back to Library
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold mb-4">New Topic Request</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Grammar Topic Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., German Dative Case"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Language
                                        </label>
                                        <select
                                            name="language"
                                            value={formData.language}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="de">German</option>
                                            <option value="en">English</option>
                                            <option value="ar">Arabic</option>
                                            <option value="ru">Russian</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Level
                                        </label>
                                        <select
                                            name="level"
                                            value={formData.level}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="A1">A1 - Beginner</option>
                                            <option value="A2">A2 - Elementary</option>
                                            <option value="B1">B1 - Intermediate</option>
                                            <option value="B2">B2 - Upper Intermediate</option>
                                            <option value="C1">C1 - Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional Context (Optional)
                                    </label>
                                    <textarea
                                        name="context_note"
                                        value={formData.context_note}
                                        onChange={handleChange}
                                        placeholder="Specific focus, common mistakes to address, etc."
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${loading
                                        ? 'bg-indigo-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Researching & Writing...
                                        </span>
                                    ) : (
                                        'Generate Grammar Topic'
                                    )}
                                </button>
                            </form>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="text-sm font-semibold text-blue-800 mb-2">How it works</h3>
                            <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
                                <li>Agent researches authoritative sources</li>
                                <li>Synthesizes accurate explanations</li>
                                <li>Generates diagrams and examples</li>
                                <li>Takes about 30-60 seconds</li>
                            </ul>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="lg:col-span-2">
                        {generatedTopic ? (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
                                    <span className="text-green-800 font-medium flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Generated Successfully
                                    </span>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                    >
                                        Save & View in Library
                                    </button>
                                </div>
                                <GrammarViewer topic={generatedTopic} />
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200">
                                {loading ? (
                                    <div className="text-center">
                                        <div className="animate-bounce text-4xl mb-4">🤖</div>
                                        <h3 className="text-lg font-medium text-gray-600">Agent is working...</h3>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                                            Researching sources, writing explanations, and drawing diagrams.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <p>Enter a topic to generate a comprehensive grammar guide.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrammarGenerator;
