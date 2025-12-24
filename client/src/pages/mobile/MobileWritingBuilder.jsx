import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Save, FileText, Clock,
    AlertTriangle, List, CheckCircle
} from 'lucide-react';
import api from '../../api';
import AssignmentPathSelector from '../../components/AssignmentPathSelector';

function MobileWritingBuilder() {
    const navigate = useNavigate();
    const location = useLocation();

    // Core Data
    const [topic, setTopic] = useState('');
    const [promptText, setPromptText] = useState('');
    const [minWords, setMinWords] = useState(100);
    const [timeLimit, setTimeLimit] = useState(0); // 0 = unlimited
    const [selectedNode, setSelectedNode] = useState(null);
    const [loading, setLoading] = useState(false);

    // Rubric (Simplified for MVP)
    // We could make this a dynamic list of criteria
    const [rubricText, setRubricText] = useState("Grammar: 40%\nVocabulary: 30%\nCoherence: 30%");

    const handleSave = async () => {
        if (!topic || !promptText) return alert("Please fill in Topic and Prompt");
        if (!selectedNode) return alert("Please link to a Curriculum Unit");

        setLoading(true);
        try {
            // 1. Create Writing Exercise Content
            const exerciseRes = await api.post('writing-exercises/', {
                topic: topic,
                prompt_text: promptText,
                min_words: minWords,
                time_limit: timeLimit * 60, // convert mins to seconds
                rubric: { text: rubricText }, // naive storage for now
            });

            // 2. Create Assignment
            await api.post('assignments/', {
                title: topic, // Use topic as assignment title
                content_type: 'writing',
                content_id: exerciseRes.data.id,
                classroom_id: location.state?.classroom_id,
                linked_path_node_id: selectedNode.id,
                metadata: {
                    time_limit: timeLimit * 60,
                    min_words: minWords
                }
            });

            navigate(-1);
        } catch (err) {
            console.error(err);
            alert("Failed to create assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-black z-10 p-4 border-b border-[#27272A] flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="p-2 bg-[#1C1C1F] rounded-lg">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="font-bold">New Writing Task</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-5 space-y-6">

                {/* 1. Basics */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Topic / Title</label>
                        <input
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-4 text-white focus:border-indigo-500 outline-none"
                            placeholder="e.g. My Favorite Holiday"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-400 mb-2">Curriculum Link (Required)</label>
                        <AssignmentPathSelector
                            onSelect={setSelectedNode}
                            selectedId={selectedNode?.id}
                        />
                    </div>
                </div>

                {/* 2. Prompt */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Prompt Instructions</label>
                    <textarea
                        value={promptText}
                        onChange={e => setPromptText(e.target.value)}
                        className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-4 text-white focus:border-indigo-500 outline-none min-h-[120px]"
                        placeholder="Explain what the student should write about..."
                    />
                </div>

                {/* 3. Constraints */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Min Words</label>
                        <div className="flex items-center bg-[#1C1C1F] border border-[#27272A] rounded-xl px-4 py-3">
                            <FileText size={18} className="text-gray-500 mr-2" />
                            <input
                                type="number"
                                value={minWords}
                                onChange={e => setMinWords(parseInt(e.target.value) || 0)}
                                className="bg-transparent w-full text-white outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Time (Mins)</label>
                        <div className="flex items-center bg-[#1C1C1F] border border-[#27272A] rounded-xl px-4 py-3">
                            <Clock size={18} className="text-gray-500 mr-2" />
                            <input
                                type="number"
                                value={timeLimit}
                                onChange={e => setTimeLimit(parseInt(e.target.value) || 0)}
                                className="bg-transparent w-full text-white outline-none"
                                placeholder="0 = None"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Rubric (Simplified) */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Grading Criteria (Rubric)</label>
                    <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-3">
                        <textarea
                            value={rubricText}
                            onChange={e => setRubricText(e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-300 outline-none min-h-[80px]"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                            This will be used by the AI Grader to evaluate submissions.
                        </p>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black to-transparent">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                    {loading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <CheckCircle />}
                    <span>Publish Assignment</span>
                </button>
            </div>
        </div>
    );
}

export default MobileWritingBuilder;
