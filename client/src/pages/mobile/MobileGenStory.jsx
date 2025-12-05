import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlusIcon,
    TrashIcon,
    PhotoIcon,
    BookOpenIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import MobileAIWizardLayout from '../../components/mobile/MobileAIWizardLayout';
import MobileStoryDisplay from '../../components/mobile/MobileStoryDisplay';
import api from '../../api';

// Helper function to render text with highlighted vocabulary
const renderStyledText = (text) => {
    if (!text) return null;

    // Split by **word** pattern to get parts and highlighted words
    const parts = text.split(/\*\*(.+?)\*\*/g);

    return parts.map((part, index) => {
        // Odd indices are the highlighted words (inside **)
        if (index % 2 === 1) {
            return (
                <span
                    key={index}
                    className="bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 text-[#A78BFA] font-semibold px-1.5 py-0.5 rounded-md border-b-2 border-[#6366F1]/50"
                >
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
};


// Expanded Genres with colors and Lottie icons
const GENRES = [
    { id: 'Daily Life', label: 'Daily Life', color: 'from-emerald-500 to-teal-500', lottie: '/lottie/family.lottie' },
    { id: 'Adventure', label: 'Adventure', color: 'from-orange-500 to-amber-500', lottie: '/lottie/Hiking.lottie' },
    { id: 'Sci-Fi', label: 'Sci-Fi', color: 'from-cyan-500 to-blue-500', lottie: '/lottie/Anima Bot.lottie' },
    { id: 'Fantasy', label: 'Fantasy', color: 'from-purple-500 to-violet-500', lottie: '/lottie/Dragon flag.lottie' },
    { id: 'Mystery', label: 'Mystery', color: 'from-slate-500 to-zinc-600' },
    { id: 'Romance', label: 'Romance', color: 'from-pink-500 to-rose-500', lottie: '/lottie/Gift Box With Heart Animation.lottie' },
    { id: 'Horror', label: 'Horror', color: 'from-gray-700 to-gray-900', lottie: '/lottie/Mummy.lottie' },
    { id: 'Comedy', label: 'Comedy', color: 'from-yellow-400 to-orange-400' },
    { id: 'Drama', label: 'Drama', color: 'from-red-500 to-rose-600', lottie: '/lottie/Pixar table lamp animation.lottie' },
    { id: 'Historical', label: 'Historical', color: 'from-amber-600 to-yellow-700', lottie: '/lottie/CASTLE.lottie' },
    { id: 'Thriller', label: 'Thriller', color: 'from-red-600 to-red-800' },
    { id: 'Fairy Tale', label: 'Fairy Tale', color: 'from-fuchsia-400 to-pink-500' },
];

// Expanded Plot Types with descriptions
const PLOT_TYPES = [
    { id: 'Standard', label: 'Standard', desc: 'Classic beginning, middle, end' },
    { id: 'Surprise Ending', label: 'Surprise Ending', desc: 'Unexpected twist at the end' },
    { id: 'Moral Lesson', label: 'Moral Lesson', desc: 'Story with a valuable message' },
    { id: 'Open Ending', label: 'Open Ending', desc: 'Let the reader imagine' },
    { id: "Hero's Journey", label: "Hero's Journey", desc: 'Classic adventure arc' },
    { id: 'Flashback', label: 'Flashback', desc: 'Starts in present, revisits past' },
    { id: 'Parallel Stories', label: 'Parallel Stories', desc: 'Two storylines that connect' },
    { id: 'Mystery Solve', label: 'Mystery Solve', desc: 'Clues leading to revelation' },
];

const MobileGenStory = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(0);

    // Form State
    const [formData, setFormData] = useState({
        genre: 'Daily Life',
        plot_type: 'Standard',
        setting: '',
        characters: [],
        level: 'B1',
        word_count: 300,
        generate_images: false,
        instructor_notes: ''
    });

    // Character Input State
    const [charInput, setCharInput] = useState({ name: '', role: '', traits: '' });
    const [showCharForm, setShowCharForm] = useState(false);

    const handleAddCharacter = () => {
        if (charInput.name && charInput.role) {
            setFormData(prev => ({
                ...prev,
                characters: [...prev.characters, charInput]
            }));
            setCharInput({ name: '', role: '', traits: '' });
            setShowCharForm(false);
        }
    };

    const removeCharacter = (index) => {
        setFormData(prev => ({
            ...prev,
            characters: prev.characters.filter((_, i) => i !== index)
        }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.post('ai/generate-advanced-text/', {
                content_type: 'story',
                topic: formData.setting, // Backend expects 'topic'
                student_level: formData.level,
                genre: formData.genre,
                plot_type: formData.plot_type,
                characters: formData.characters,
                word_count: formData.word_count,
                generate_images: formData.generate_images,
                instructor_notes: formData.instructor_notes
            });
            setGeneratedContent(res.data);
            setStep(4);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to generate story';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        navigate('/m');
    };

    const selectedGenre = GENRES.find(g => g.id === formData.genre);

    // Get animated icon for a genre
    const getGenreIcon = (genreId) => {
        const IconComponent = GenreIcons[genreId];
        return IconComponent ? <IconComponent size={24} /> : null;
    };

    // Step 1: Concept
    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">Genre</label>
                <div className="grid grid-cols-3 gap-2">
                    {GENRES.map(g => (
                        <motion.button
                            key={g.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData({ ...formData, genre: g.id })}
                            className={`p-2 rounded-xl border text-center transition-all relative overflow-visible ${formData.genre === g.id
                                ? 'border-white/30 text-white'
                                : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                                }`}
                        >
                            {formData.genre === g.id && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${g.color} opacity-80 rounded-xl`} />
                            )}
                            <div className="relative z-50 flex flex-col items-center">
                                <div className="w-14 h-14" style={{ zIndex: 100 }}>
                                    {g.lottie ? (
                                        <DotLottieReact
                                            src={g.lottie}
                                            loop
                                            autoplay
                                            style={{ width: 56, height: 56 }}
                                        />
                                    ) : (
                                        <span className="text-3xl flex items-center justify-center h-full">
                                            {g.id === 'Mystery' ? '🔍' :
                                                g.id === 'Historical' ? '🏛️' :
                                                    g.id === 'Thriller' ? '😰' :
                                                        g.id === 'Comedy' ? '😂' : '🧚'}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-bold">{g.label}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">Plot Type</label>
                <div className="space-y-2">
                    {PLOT_TYPES.map(p => (
                        <motion.button
                            key={p.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData({ ...formData, plot_type: p.id })}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${formData.plot_type === p.id
                                ? 'bg-[#6366F1] border-[#6366F1] text-white'
                                : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                                }`}
                        >
                            <div className="font-bold">{p.label}</div>
                            <div className={`text-xs mt-1 ${formData.plot_type === p.id ? 'text-white/70' : 'text-[#71717A]'}`}>
                                {p.desc}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">Setting</label>
                <input
                    type="text"
                    value={formData.setting}
                    onChange={e => setFormData({ ...formData, setting: e.target.value })}
                    placeholder="e.g. A magical forest in winter"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-[#6366F1] placeholder:text-[#52525B]"
                />
            </div>
        </div>
    );

    // Step 2: Characters
    const renderStep2 = () => (
        <div className="space-y-6">
            <p className="text-[#71717A] text-sm">Add characters to make your story more personal. You can skip this step if you prefer.</p>

            {formData.characters.length > 0 && (
                <div className="space-y-3">
                    {formData.characters.map((char, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-r from-[#18181B] to-[#1C1C1F] p-4 rounded-xl border border-[#27272A] flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
                                    {char.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{char.name}</h4>
                                    <p className="text-sm text-[#A1A1AA]">{char.role} {char.traits && `• ${char.traits}`}</p>
                                </div>
                            </div>
                            <button onClick={() => removeCharacter(idx)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {showCharForm ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#18181B] p-4 rounded-xl border border-[#6366F1] space-y-4"
                >
                    <input
                        placeholder="Name (e.g. Zara)"
                        value={charInput.name}
                        onChange={e => setCharInput({ ...charInput, name: e.target.value })}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-white outline-none focus:border-[#6366F1]"
                    />
                    <input
                        placeholder="Role (e.g. Detective, Student)"
                        value={charInput.role}
                        onChange={e => setCharInput({ ...charInput, role: e.target.value })}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-white outline-none focus:border-[#6366F1]"
                    />
                    <input
                        placeholder="Traits (e.g. Brave, Curious)"
                        value={charInput.traits}
                        onChange={e => setCharInput({ ...charInput, traits: e.target.value })}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-white outline-none focus:border-[#6366F1]"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCharForm(false)}
                            className="flex-1 py-3 rounded-lg bg-[#27272A] text-white font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddCharacter}
                            disabled={!charInput.name || !charInput.role}
                            className="flex-1 py-3 rounded-lg bg-[#6366F1] text-white font-bold disabled:opacity-50"
                        >
                            Add Character
                        </button>
                    </div>
                </motion.div>
            ) : (
                <button
                    onClick={() => setShowCharForm(true)}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-[#27272A] text-[#A1A1AA] font-bold flex items-center justify-center gap-2 hover:border-[#6366F1] hover:text-[#6366F1] transition-colors active:scale-[0.98]"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Add Character
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
                    <label className="text-[#A1A1AA] text-sm font-bold uppercase">Story Length</label>
                    <span className="text-[#6366F1] font-mono font-bold">{formData.word_count} words</span>
                </div>
                <input
                    type="range"
                    min="150"
                    max="800"
                    step="50"
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

            <div className="flex items-center justify-between bg-gradient-to-r from-[#18181B] to-[#1F1F23] p-4 rounded-xl border border-[#27272A]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <PhotoIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <div className="font-bold text-white">AI Illustrations</div>
                        <div className="text-xs text-[#71717A]">Generate images for each scene</div>
                    </div>
                </div>
                <button
                    onClick={() => setFormData({ ...formData, generate_images: !formData.generate_images })}
                    className={`w-14 h-8 rounded-full transition-all relative ${formData.generate_images
                        ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]'
                        : 'bg-[#27272A]'
                        }`}
                >
                    <motion.div
                        animate={{ x: formData.generate_images ? 24 : 4 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                </button>
            </div>
        </div>
    );

    // Step 4: Use shared MobileStoryDisplay with Listen/Translate features
    const renderStep4 = () => (
        <MobileStoryDisplay
            content={generatedContent?.content}
            title={generatedContent?.content?.title}
            level={formData.level}
        />
    );

    // Validation for each step
    const isStep1Valid = (formData.setting || '').trim().length > 0;

    return (
        <MobileAIWizardLayout
            title="Story Weaver"
            subtitle={
                step === 1 ? "Choose your Concept" :
                    step === 2 ? "Cast your Characters" :
                        step === 3 ? "Fine-tune Details" :
                            "Your Story"
            }
            currentStep={step}
            totalSteps={4}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
            onNext={step === 3 ? handleGenerate : step === 4 ? handleSave : () => setStep(step + 1)}
            isNextDisabled={step === 1 && !isStep1Valid}
            nextLabel={step === 3 ? 'Generate Story' : step === 4 ? 'Save to Library' : 'Next'}
            loading={loading}
            loadingMessage="Weaving your story..."
        >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </MobileAIWizardLayout>
    );
};

export default MobileGenStory;
