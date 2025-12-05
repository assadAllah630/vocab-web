import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserGroupIcon,
    TrashIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import MobileAIWizardLayout from '../../components/mobile/MobileAIWizardLayout';
import MobileDialogueDisplay from '../../components/mobile/MobileDialogueDisplay';
import { ToneIcons, ScenarioIcons } from '../../components/AnimatedAIIcons';
import api from '../../api';

// Expanded Tones with colors (animated icons from AnimatedAIIcons)
const TONES = [
    { id: 'Neutral', label: 'Neutral', color: 'from-slate-400 to-slate-500' },
    { id: 'Formal', label: 'Formal', color: 'from-blue-500 to-indigo-600' },
    { id: 'Casual', label: 'Casual', color: 'from-green-400 to-emerald-500' },
    { id: 'Humorous', label: 'Humorous', color: 'from-yellow-400 to-orange-400' },
    { id: 'Argumentative', label: 'Debate', color: 'from-red-500 to-rose-600' },
    { id: 'Romantic', label: 'Romantic', color: 'from-pink-400 to-rose-400' },
    { id: 'Professional', label: 'Business', color: 'from-gray-500 to-zinc-600' },
    { id: 'Supportive', label: 'Supportive', color: 'from-teal-400 to-cyan-500' },
    { id: 'Mysterious', label: 'Mysterious', color: 'from-purple-500 to-violet-600' },
];

// Scenario Presets (animated icons from AnimatedAIIcons)
const SCENARIO_PRESETS = [
    { id: 'cafe', label: 'At a Café', desc: 'Ordering drinks and chatting' },
    { id: 'shopping', label: 'Shopping', desc: 'Buying clothes or groceries' },
    { id: 'airport', label: 'At the Airport', desc: 'Check-in and boarding' },
    { id: 'doctor', label: 'Doctor Visit', desc: 'Health-related conversation' },
    { id: 'interview', label: 'Job Interview', desc: 'Professional discussion' },
    { id: 'restaurant', label: 'Restaurant', desc: 'Ordering food and service' },
    { id: 'hotel', label: 'Hotel Check-in', desc: 'Booking and room requests' },
    { id: 'phone', label: 'Phone Call', desc: 'Customer service or inquiry' },
];

// Get animated icon for tone
const getToneIcon = (toneId) => {
    const IconComponent = ToneIcons[toneId];
    return IconComponent ? <IconComponent size={24} /> : null;
};

// Get animated icon for scenario
const getScenarioIcon = (scenarioId) => {
    const IconComponent = ScenarioIcons[scenarioId];
    return IconComponent ? <IconComponent size={24} /> : null;
};

const MobileGenDialogue = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        scenario: '',
        tone: 'Neutral',
        speakers: [],
        level: 'A2',
        word_count: 250,
        instructor_notes: ''
    });

    // Speaker colors for chat bubbles
    const speakerColors = [
        'from-[#4F46E5] to-[#6366F1]',
        'from-[#0D9488] to-[#14B8A6]',
        'from-[#7C3AED] to-[#8B5CF6]',
        'from-[#0891B2] to-[#06B6D4]',
    ];

    // Speaker Input State
    const [speakerInput, setSpeakerInput] = useState({ name: '', personality: '' });
    const [showSpeakerForm, setShowSpeakerForm] = useState(false);

    const handleAddSpeaker = () => {
        if (speakerInput.name) {
            setFormData(prev => ({
                ...prev,
                speakers: [...prev.speakers, speakerInput]
            }));
            setSpeakerInput({ name: '', personality: '' });
            setShowSpeakerForm(false);
        }
    };

    const removeSpeaker = (index) => {
        setFormData(prev => ({
            ...prev,
            speakers: prev.speakers.filter((_, i) => i !== index)
        }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.post('ai/generate-advanced-text/', {
                content_type: 'dialogue',
                topic: formData.scenario,
                student_level: formData.level,
                scenario: formData.scenario,
                tone: formData.tone,
                speakers: formData.speakers,
                word_count: formData.word_count,
                instructor_notes: formData.instructor_notes
            });
            setGeneratedContent(res.data);
            setStep(4);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to generate dialogue';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        navigate('/m/ai/library');
    };

    const selectPreset = (preset) => {
        setFormData({ ...formData, scenario: preset.desc });
    };

    const selectedTone = TONES.find(t => t.id === formData.tone);

    // Step 1: Scenario
    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">Quick Scenarios</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {SCENARIO_PRESETS.map(preset => (
                        <motion.button
                            key={preset.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => selectPreset(preset)}
                            className="p-2 rounded-xl bg-[#18181B] border border-[#27272A] text-center hover:border-[#6366F1] transition-colors flex flex-col items-center"
                        >
                            <div className="mb-1">{getScenarioIcon(preset.id)}</div>
                            <span className="text-[10px] text-[#A1A1AA] font-medium">{preset.label}</span>
                        </motion.button>
                    ))}
                </div>
                <textarea
                    value={formData.scenario}
                    onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                    placeholder="Or describe your own scenario..."
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-[#6366F1] h-24 resize-none placeholder:text-[#52525B]"
                />
            </div>

            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">Conversation Tone</label>
                <div className="grid grid-cols-3 gap-2">
                    {TONES.map(t => (
                        <motion.button
                            key={t.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData({ ...formData, tone: t.id })}
                            className={`p-3 rounded-xl border text-center transition-all relative overflow-hidden ${formData.tone === t.id
                                    ? 'border-white/30 text-white'
                                    : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                                }`}
                        >
                            {formData.tone === t.id && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-80`} />
                            )}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-1">{getToneIcon(t.id)}</div>
                                <span className="text-xs font-bold">{t.label}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 2: Speakers
    const renderStep2 = () => (
        <div className="space-y-6">
            <p className="text-[#71717A] text-sm">Add speakers for your conversation. Leave empty for auto-generated characters.</p>

            {formData.speakers.length > 0 && (
                <div className="space-y-3">
                    {formData.speakers.map((speaker, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-r from-[#18181B] to-[#1C1C1F] p-4 rounded-xl border border-[#27272A] flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${speakerColors[idx % speakerColors.length]} flex items-center justify-center text-white font-bold shadow-lg`}>
                                    {speaker.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{speaker.name}</h4>
                                    <p className="text-sm text-[#A1A1AA]">{speaker.personality || 'Default personality'}</p>
                                </div>
                            </div>
                            <button onClick={() => removeSpeaker(idx)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {showSpeakerForm ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#18181B] p-4 rounded-xl border border-[#6366F1] space-y-4"
                >
                    <input
                        placeholder="Name (e.g. Marco)"
                        value={speakerInput.name}
                        onChange={e => setSpeakerInput({ ...speakerInput, name: e.target.value })}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-white outline-none focus:border-[#6366F1]"
                    />
                    <input
                        placeholder="Personality (e.g. Friendly, Talkative)"
                        value={speakerInput.personality}
                        onChange={e => setSpeakerInput({ ...speakerInput, personality: e.target.value })}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-white outline-none focus:border-[#6366F1]"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSpeakerForm(false)}
                            className="flex-1 py-3 rounded-lg bg-[#27272A] text-white font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddSpeaker}
                            disabled={!speakerInput.name}
                            className="flex-1 py-3 rounded-lg bg-[#6366F1] text-white font-bold disabled:opacity-50"
                        >
                            Add Speaker
                        </button>
                    </div>
                </motion.div>
            ) : (
                <button
                    onClick={() => setShowSpeakerForm(true)}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-[#27272A] text-[#A1A1AA] font-bold flex items-center justify-center gap-2 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors active:scale-[0.98]"
                >
                    <UserGroupIcon className="w-5 h-5" />
                    Add Speaker
                </button>
            )}
        </div>
    );

    // Step 3: Details
    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">Language Level</label>
                <div className="flex gap-2">
                    {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => (
                        <button
                            key={l}
                            onClick={() => setFormData({ ...formData, level: l })}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.level === l
                                    ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30'
                                    : 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A]'
                                }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[#A1A1AA] text-sm font-bold uppercase">Conversation Length</label>
                    <span className="text-[#6366F1] font-mono font-bold">~{Math.floor(formData.word_count / 15)} exchanges</span>
                </div>
                <input
                    type="range"
                    min="100"
                    max="500"
                    step="25"
                    value={formData.word_count}
                    onChange={e => setFormData({ ...formData, word_count: parseInt(e.target.value) })}
                    className="w-full accent-[#6366F1] h-2"
                />
                <div className="flex justify-between text-xs text-[#52525B] mt-2">
                    <span>Short</span>
                    <span>Medium</span>
                    <span>Long</span>
                </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-r from-[#18181B] to-[#1F1F23] p-4 rounded-xl border border-[#27272A]">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-gradient-to-br ${selectedTone?.color || 'from-[#6366F1] to-[#8B5CF6]'} rounded-lg`}>
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white">Dialogue Preview</div>
                        <div className="text-xs text-[#71717A]">{selectedTone?.label} conversation</div>
                    </div>
                </div>
                <div className="text-sm text-[#A1A1AA] bg-[#09090B] rounded-lg p-3">
                    {formData.scenario || 'Your scenario will appear here...'}
                </div>
            </div>
        </div>
    );

    // Step 4: Use shared MobileDialogueDisplay component
    const renderStep4 = () => (
        <div className="-mx-4">
            <MobileDialogueDisplay
                content={generatedContent?.content}
                title={generatedContent?.content?.title}
                level={formData.level}
                tone={formData.tone}
                showSequential={true}
            />
        </div>
    );

    // Validation for each step
    const isStep1Valid = formData.scenario.trim().length > 0;
    const isStep2Valid = formData.speakers.length >= 2;

    return (
        <MobileAIWizardLayout
            title="Dialogue Master"
            subtitle={
                step === 1 ? "Set the Scene" :
                    step === 2 ? "Who's Talking?" :
                        step === 3 ? "Fine-tune Details" :
                            "Conversation"
            }
            currentStep={step}
            totalSteps={4}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
            onNext={step === 3 ? handleGenerate : step === 4 ? handleSave : () => setStep(step + 1)}
            isNextDisabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
            nextLabel={step === 3 ? 'Generate Dialogue' : step === 4 ? 'Save to Library' : 'Next'}
            loading={loading}
            loadingMessage="Writing script..."
        >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </MobileAIWizardLayout>
    );
};

export default MobileGenDialogue;
