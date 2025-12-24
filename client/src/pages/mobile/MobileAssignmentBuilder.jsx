import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Plus, Save, BookOpen, Clock,
    Settings, Target, Layout, CheckCircle,
    Type, Languages, Edit3, Trash2
} from 'lucide-react';
import api from '../../api';
import AssignmentPathSelector from '../../components/AssignmentPathSelector';

import { MCQEditor, ClozeEditor, MatchingEditor } from './MobileExamQuestionEditors';

const EXAM_TYPES = [
    { id: 'multiple_choice', label: 'Multiple Choice', icon: Layout },
    { id: 'cloze', label: 'Fill in Blanks', icon: Type },
    { id: 'matching', label: 'Matching Pairs', icon: Target },
    { id: 'reading', label: 'Reading Comp', icon: BookOpen } // Reading needs separate handling if prioritizing
];

function MobileAssignmentBuilder() {
    const navigate = useNavigate();
    const location = useLocation();

    // Core State
    const [step, setStep] = useState(1); // 1: Info, 2: Content, 3: Settings
    const [loading, setLoading] = useState(false);

    // Assignment Data
    const [title, setTitle] = useState('');
    const [type, setType] = useState('exam'); // exam, vocab_list, story
    const [selectedNode, setSelectedNode] = useState(null); // Learning Path Node

    // Exam Specific State
    const [sections, setSections] = useState([]); // List of sections
    const [expandedSectionIds, setExpandedSectionIds] = useState([]); // Multi-expand support

    // Story Specific State
    const [storyText, setStoryText] = useState('');
    const [storySettings, setStorySettings] = useState({
        min_read_time: 300, // 5 minutes in seconds
        require_quiz: false
    });

    // Vocab Specific State
    const [vocabWords, setVocabWords] = useState([]); // Array of word objects
    const [vocabSettings, setVocabSettings] = useState({
        mastery_target: 'recognize', // 'recognize' or 'master'
        mode: 'flashcards' // 'flashcards' or 'spelling'
    });

    // Podcast Specific State
    const [selectedPodcast, setSelectedPodcast] = useState(null);
    const [selectedEpisode, setSelectedEpisode] = useState(null);
    const [podcastSettings, setPodcastSettings] = useState({
        min_listen_time: 300, // 5 minutes in seconds
        require_quiz: false
    });

    // --- Steps Logic ---

    const renderStep1_Info = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Assignment Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g., Unit 1 Checkpoint"
                />
            </div>

            {/* Learning Path Selector */}
            <div>
                <label className="block text-sm font-medium text-indigo-400 mb-2">Curriculum Link (Required)</label>
                <AssignmentPathSelector
                    onSelect={(node) => setSelectedNode(node)}
                    selectedId={selectedNode?.id}
                />
                {!selectedNode && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        You must link this to a Learning Path Unit.
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Assignment Type</label>
                <div className="grid grid-cols-3 gap-3">
                    {['exam', 'vocab_list', 'story', 'game'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`p-4 rounded-xl border-2 capitalize flex flex-col items-center gap-2 transition-all ${type === t
                                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                : 'border-[#27272A] bg-[#1C1C1F] text-gray-400'
                                }`}
                        >
                            <span className="text-xs font-bold">{t.replace('_', ' ')}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const toggleSection = (id) => {
        if (expandedSectionIds.includes(id)) {
            setExpandedSectionIds(expandedSectionIds.filter(sid => sid !== id));
        } else {
            setExpandedSectionIds([...expandedSectionIds, id]);
        }
    };

    // --- Update Handler for Child Editors ---
    const updateSectionItems = (sectionId, newItems) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, items: newItems } : s));
    };

    const renderStep2_ExamContent = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Exam Sections</h3>
                <button
                    onClick={addSection}
                    className="flex items-center gap-2 text-indigo-400 text-sm font-bold"
                >
                    <Plus size={16} /> Add Section
                </button>
            </div>

            {sections.map((section, idx) => {
                const isExpanded = expandedSectionIds.includes(section.id);
                return (
                    <div key={section.id} className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A]">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold bg-[#27272A] text-gray-300 px-2 py-1 rounded">
                                Section {idx + 1}
                            </span>
                            <div className="flex gap-2">
                                <select
                                    value={section.type}
                                    onChange={(e) => updateSectionType(section.id, e.target.value)}
                                    className="bg-black text-xs text-white p-1 rounded border border-[#3F3F46]"
                                >
                                    {EXAM_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                                <button onClick={() => deleteSection(section.id)} className="text-red-400">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm text-gray-500">
                                {section.items.length} Question{section.items.length !== 1 && 's'}
                            </div>
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="px-3 py-1 bg-[#27272A] rounded-lg text-xs font-medium text-white hover:bg-[#3F3F46] flex items-center gap-1"
                            >
                                {isExpanded ? 'Collapse' : 'Edit Questions'}
                                <ChevronLeft size={12} className={`transition-transform ${isExpanded ? '-rotate-90' : '-rotate-180'}`} />
                            </button>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4 border-t border-[#27272A] mt-2">
                                        {section.type === 'multiple_choice' && (
                                            <MCQEditor
                                                questions={section.items}
                                                onChange={(items) => updateSectionItems(section.id, items)}
                                            />
                                        )}
                                        {section.type === 'cloze' && (
                                            <ClozeEditor
                                                items={section.items}
                                                onChange={(items) => updateSectionItems(section.id, items)}
                                            />
                                        )}
                                        {section.type === 'matching' && (
                                            <MatchingEditor
                                                pairs={section.items}
                                                onChange={(items) => updateSectionItems(section.id, items)}
                                            />
                                        )}
                                        {section.type === 'reading' && (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                Reading Text Editor Placehoder (Content + Questions)
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {sections.length === 0 && (
                <div className="text-center py-10 text-gray-500 border-2 border-dashed border-[#27272A] rounded-xl">
                    No sections yet. Add one to start.
                </div>
            )}
        </div>
    );

    const renderStep2_StoryContent = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Reading Content</h3>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Story Text</label>
                <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[300px]"
                    placeholder="Paste or type the reading text here..."
                />
                <p className="text-xs text-gray-500 mt-2">
                    {storyText.split(/\s+/).filter(w => w).length} words
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Min. Reading Time (minutes)</label>
                    <input
                        type="number"
                        value={Math.floor(storySettings.min_read_time / 60)}
                        onChange={(e) => setStorySettings({ ...storySettings, min_read_time: parseInt(e.target.value) * 60 })}
                        className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                        min="1"
                    />
                </div>
                <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={storySettings.require_quiz}
                            onChange={(e) => setStorySettings({ ...storySettings, require_quiz: e.target.checked })}
                            className="w-5 h-5 rounded border-[#27272A] bg-[#1C1C1F] text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-300">Require Quiz</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderStep2_VocabContent = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Vocabulary Words</h3>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Add Words</label>
                <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-3">Selected: {vocabWords.length} words</p>
                    <button
                        onClick={() => {
                            const word = prompt("Enter word (German):");
                            const translation = prompt("Enter translation (English):");
                            if (word && translation) {
                                setVocabWords([...vocabWords, { word, translation, id: Date.now() }]);
                            }
                        }}
                        className="w-full py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white"
                    >
                        + Add Word Manually
                    </button>
                </div>

                {vocabWords.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {vocabWords.map((w) => (
                            <div key={w.id} className="flex items-center justify-between bg-[#1C1C1F] p-3 rounded-lg">
                                <div>
                                    <p className="text-white font-medium">{w.word}</p>
                                    <p className="text-xs text-gray-500">{w.translation}</p>
                                </div>
                                <button
                                    onClick={() => setVocabWords(vocabWords.filter(v => v.id !== w.id))}
                                    className="text-red-400 text-xs"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mastery Target</label>
                    <select
                        value={vocabSettings.mastery_target}
                        onChange={(e) => setVocabSettings({ ...vocabSettings, mastery_target: e.target.value })}
                        className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                    >
                        <option value="recognize">Recognize (1x)</option>
                        <option value="master">Master (3x)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mode</label>
                    <select
                        value={vocabSettings.mode}
                        onChange={(e) => setVocabSettings({ ...vocabSettings, mode: e.target.value })}
                        className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                    >
                        <option value="flashcards">Flashcards</option>
                        <option value="spelling">+ Spelling</option>
                    </select>
                </div>
            </div>
        </div>
    );

    // --- Actions ---

    const addSection = () => {
        setSections([...sections, {
            id: Date.now(),
            type: 'multiple_choice',
            items: [] // questions/blanks/pairs
        }]);
    };

    const updateSectionType = (id, type) => {
        setSections(sections.map(s => s.id === id ? { ...s, type, items: [] } : s));
    };

    const deleteSection = (id) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const editSection = (id) => {
        // Here we would open a specific modal/screen to add questions
        // For strict MVP, we might keep it simple or assume AI generation
        alert("Detailed Question Editor would open here");
    };

    const handleSave = async () => {
        if (!selectedNode) return alert("Please select a Curriculum Unit!");
        setLoading(true);
        try {
            if (type === 'exam') {
                // 1. Create Template Exam first
                const examRes = await api.post('exams/', {
                    is_template: true,
                    topic: title,
                    difficulty: 'B1',
                    questions: sections.map(s => ({
                        type: s.type,
                        [s.type === 'cloze' ? 'blanks' : s.type === 'matching' ? 'pairs' : 'questions']: s.items
                    }))
                });

                // 2. Create Assignment Linked to Exam AND Path Node
                await api.post('assignments/', {
                    title: title,
                    content_type: 'exam',
                    content_id: examRes.data.id,
                    classroom_id: location.state?.classroom_id,
                    linked_path_node_id: selectedNode.id,
                    metadata: { time_limit: 1200 }
                });
            } else if (type === 'story') {
                // Create Story Assignment - store text in metadata
                if (!storyText.trim()) return alert("Please add story text!");

                await api.post('assignments/', {
                    title: title,
                    content_type: 'story',
                    content_id: null, // No separate content model for now
                    classroom_id: location.state?.classroom_id,
                    linked_path_node_id: selectedNode.id,
                    metadata: {
                        story_text: storyText,
                        min_time: storySettings.min_read_time,
                        require_quiz: storySettings.require_quiz
                    }
                });
            } else if (type === 'vocab_list') {
                if (vocabWords.length === 0) return alert("Please add at least one word!");

                await api.post('assignments/', {
                    title: title,
                    content_type: 'vocab_list',
                    content_id: null,
                    classroom_id: location.state?.classroom_id,
                    linked_path_node_id: selectedNode.id,
                    metadata: {
                        vocab_words: vocabWords,
                        mastery_target: vocabSettings.mastery_target,
                        mode: vocabSettings.mode
                    }
                });
            } else {
                alert(`${type} assignments not yet implemented`);
                setLoading(false);
                return;
            }

            navigate(-1);
        } catch (err) {
            console.error(err);
            alert("Failed to create assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pb-32 text-white">
            {/* Header */}
            <div className="sticky top-0 bg-black z-10 p-4 border-b border-[#27272A] flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="p-2 bg-[#1C1C1F] rounded-lg">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="font-bold">New Assignment</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-5">
                {/* Progress Stepper */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-indigo-500' : 'bg-[#27272A]'}`} />
                    ))}
                </div>

                {step === 1 && renderStep1_Info()}
                {step === 2 && type === 'exam' && renderStep2_ExamContent()}
                {step === 2 && type === 'story' && renderStep2_StoryContent()}
                {step === 2 && type === 'vocab_list' && renderStep2_VocabContent()}
                {/* Placeholders for step 2 of other types */}
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black to-transparent">
                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="w-full py-4 bg-indigo-600 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-4 bg-green-600 rounded-xl font-bold shadow-lg shadow-green-500/20"
                    >
                        {loading ? 'Publishing...' : 'Publish Assignment'}
                    </button>
                )}
            </div>
        </div>
    );
}

// Simple export
export default MobileAssignmentBuilder;
import { AlertTriangle } from 'lucide-react'; 
