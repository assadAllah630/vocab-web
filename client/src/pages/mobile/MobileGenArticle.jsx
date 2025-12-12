import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    NewspaperIcon,
    AcademicCapIcon,
    MegaphoneIcon,
    ListBulletIcon,
    LightBulbIcon,
    ClockIcon,
    BookOpenIcon,
    ArrowTrendingUpIcon,
    PencilSquareIcon,
    ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import MobileAIWizardLayout from '../../components/mobile/MobileAIWizardLayout';
import MobileArticleDisplay from '../../components/mobile/MobileArticleDisplay';
import api from '../../api';
import { useTranslation } from '../../hooks/useTranslation';

// Expanded Styles with colors
// Note: Labels translated in render
const STYLES = [
    { id: 'Informative', labelKey: 'styleInformative', icon: NewspaperIcon, desc: 'Clear, factual reporting', color: 'from-blue-500 to-cyan-500' },
    { id: 'Blog', labelKey: 'styleBlog', icon: PencilSquareIcon, desc: 'Engaging, personal tone', color: 'from-pink-500 to-rose-500' },
    { id: 'Academic', labelKey: 'styleAcademic', icon: AcademicCapIcon, desc: 'Formal, structured analysis', color: 'from-purple-500 to-violet-600' },
    { id: 'Opinion', labelKey: 'styleOpinion', icon: ChatBubbleBottomCenterTextIcon, desc: 'Persuasive and thought-provoking', color: 'from-orange-500 to-amber-500' },
    { id: 'Educational', labelKey: 'styleEducational', icon: LightBulbIcon, desc: 'Clear explanations for learning', color: 'from-green-500 to-emerald-500' },
    { id: 'Technical', labelKey: 'styleTechnical', icon: ArrowTrendingUpIcon, desc: 'In-depth technical analysis', color: 'from-slate-500 to-zinc-600' },
];

// Expanded Structures
const STRUCTURES = [
    { id: 'Standard', labelKey: 'structStandard', icon: NewspaperIcon, desc: 'Intro, body, conclusion' },
    { id: 'Listicle', labelKey: 'structListicle', icon: ListBulletIcon, desc: 'Numbered points format' },
    { id: 'How-to', labelKey: 'structHowTo', icon: LightBulbIcon, desc: 'Step-by-step instructions' },
    { id: 'Problem-Solution', labelKey: 'structProblem', icon: ArrowTrendingUpIcon, desc: 'Issue and resolution format' },
    { id: 'Comparison', labelKey: 'structComparison', icon: MegaphoneIcon, desc: 'Compare two or more items' },
];

// Topic Suggestions
const TOPIC_SUGGESTIONS = [
    { emoji: '🌍', topic: 'Climate change and sustainability' },
    { emoji: '🤖', topic: 'The future of artificial intelligence' },
    { emoji: '📱', topic: 'Social media impact on society' },
    { emoji: '🏥', topic: 'Mental health awareness' },
    { emoji: '🚀', topic: 'Space exploration discoveries' },
    { emoji: '💼', topic: 'Remote work culture' },
];

const MobileGenArticle = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        topic: '',
        article_style: 'Informative',
        structure_type: 'Standard',
        level: 'B1',
        word_count: 400,
        instructor_notes: ''
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.post('ai/generate-advanced-text/', {
                content_type: 'article',
                topic: formData.topic,
                student_level: formData.level,
                article_style: formData.article_style,
                structure_type: formData.structure_type,
                word_count: formData.word_count,
                instructor_notes: formData.instructor_notes
            });
            setGeneratedContent(res.data);
            setStep(4);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to generate article';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        navigate('/m');
    };

    const selectedStyle = STYLES.find(s => s.id === formData.article_style);
    const selectedStructure = STRUCTURES.find(s => s.id === formData.structure_type);

    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(formData.word_count / 200);

    // Step 1: Topic & Style
    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">{t('topic')}</label>
                <textarea
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    placeholder={t('topicPlaceholder')}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-white outline-none focus:border-[#6366F1] h-20 resize-none placeholder:text-[#52525B]"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                    {TOPIC_SUGGESTIONS.map((s, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData({ ...formData, topic: s.topic })}
                            className="px-3 py-1.5 bg-[#18181B] border border-[#27272A] rounded-full text-xs text-[#A1A1AA] hover:border-[#6366F1] transition-colors flex items-center gap-1"
                        >
                            <span>{s.emoji}</span>
                            <span className="truncate max-w-[120px]">{s.topic}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">{t('writingStyle')}</label>
                <div className="grid grid-cols-2 gap-2">
                    {STYLES.map(s => (
                        <motion.button
                            key={s.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData({ ...formData, article_style: s.id })}
                            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${formData.article_style === s.id
                                ? 'border-white/30 text-white'
                                : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                                }`}
                        >
                            {formData.article_style === s.id && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-80`} />
                            )}
                            <div className="relative z-10">
                                <s.icon className="w-5 h-5 mb-2" />
                                <div className="font-bold text-sm">{t(s.labelKey)}</div>
                                <div className={`text-[10px] ${formData.article_style === s.id ? 'text-white/70' : 'text-[#71717A]'}`}>
                                    {s.desc}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 2: Structure
    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <label className="text-[#A1A1AA] text-sm font-bold uppercase mb-3 block">{t('articleStructure')}</label>
                <div className="space-y-2">
                    {STRUCTURES.map(s => (
                        <motion.button
                            key={s.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData({ ...formData, structure_type: s.id })}
                            className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${formData.structure_type === s.id
                                ? 'bg-[#6366F1] border-[#6366F1] text-white'
                                : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${formData.structure_type === s.id ? 'bg-white/20' : 'bg-[#27272A]'}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold">{t(s.labelKey)}</div>
                                <div className={`text-xs ${formData.structure_type === s.id ? 'text-white/70' : 'text-[#71717A]'}`}>
                                    {s.desc}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
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
                    <label className="text-[#A1A1AA] text-sm font-bold uppercase">Article Length</label>
                    <span className="text-[#6366F1] font-mono font-bold">{formData.word_count} words</span>
                </div>
                <input
                    type="range"
                    min="200"
                    max="1000"
                    step="50"
                    value={formData.word_count}
                    onChange={e => setFormData({ ...formData, word_count: parseInt(e.target.value) })}
                    className="w-full accent-[#6366F1] h-2"
                />
                <div className="flex justify-between text-xs text-[#52525B] mt-2">
                    <span>Short (~{Math.ceil(200 / 200)} min read)</span>
                    <span>Medium</span>
                    <span>Long (~{Math.ceil(1000 / 200)} min read)</span>
                </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gradient-to-r from-[#18181B] to-[#1F1F23] p-4 rounded-xl border border-[#27272A]">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-gradient-to-br ${selectedStyle?.color || 'from-[#6366F1] to-[#8B5CF6]'} rounded-lg`}>
                        {selectedStyle && <selectedStyle.icon className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <div className="font-bold text-white">{t('articlePreview')}</div>
                        <div className="text-xs text-[#71717A]">{selectedStyle ? t(selectedStyle.labelKey) : ''} • {selectedStructure ? t(selectedStructure.labelKey) : ''}</div>
                    </div>
                </div>
                <div className="flex gap-3 text-xs text-[#71717A]">
                    <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {readingTime} min read
                    </span>
                    <span className="flex items-center gap-1">
                        <BookOpenIcon className="w-4 h-4" />
                        {formData.level} level
                    </span>
                </div>
            </div>
        </div>
    );

    // Step 4: Use shared MobileArticleDisplay component
    const renderStep4 = () => (
        <div className="-mx-4 -mt-4">
            <MobileArticleDisplay
                content={generatedContent?.content}
                title={generatedContent?.content?.title}
                level={formData.level}
                topic={formData.topic}
            />
        </div>
    );

    // Validation for each step
    const isStep1Valid = formData.topic.trim().length > 0;

    return (
        <MobileAIWizardLayout
            title={t('articleWriter')}
            subtitle={
                step === 1 ? t('chooseTopicStyle') :
                    step === 2 ? t('defineStructure') :
                        step === 3 ? t('fineTuneDetails') :
                            t('yourStory')
            }
            currentStep={step}
            totalSteps={4}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
            onNext={step === 3 ? handleGenerate : step === 4 ? handleSave : () => setStep(step + 1)}
            isNextDisabled={step === 1 && !isStep1Valid}
            nextLabel={step === 3 ? t('generateArticle') : step === 4 ? t('saveToLibrary') : t('next')}
            loading={loading}
            loadingMessage={t('writingArticle')}
        >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </MobileAIWizardLayout>
    );
};

export default MobileGenArticle;
