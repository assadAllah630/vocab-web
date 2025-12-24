import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import api from '../../api';
import MobileMarkdownRenderer from '../../components/mobile/MobileMarkdownRenderer';
import MobileReaderPractice from '../../components/mobile/MobileReaderPractice';
import {
    ChevronLeft,
    Upload,
    Link2,
    Youtube,
    FileText,
    Sparkles,
    Type,
    Maximize2,
    Minimize2,
    BookOpen,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
    GraduationCap,
    Globe,
    File,
    Image as ImageIcon,
    Wand2,
    Search,
    Plus,
    Check,
    Volume2,
    VolumeX,
    Library,
    Trash2,
    Clock,
    RotateCcw,
    Monitor
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

// Import type detection
const getFileIcon = (type) => {
    switch (type) {
        case 'youtube': return Youtube;
        case 'article': return Globe;
        case 'pdf': return FileText;
        case 'docx': return FileText;
        case 'image': return ImageIcon;
        default: return File;
    }
};



function MobileReader({ assignment, onComplete, initialContent }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Assignment Mode Check
    const isAssignment = !!assignment;

    // UI State
    const [activeTab, setActiveTab] = useState(initialContent || isAssignment ? 'read' : 'import');
    const [importMode, setImportMode] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [savedContent, setSavedContent] = useState([]);

    // Content State
    const [content, setContent] = useState(initialContent?.content || '');
    const [title, setTitle] = useState(initialContent?.title || '');
    const [sourceType, setSourceType] = useState(initialContent?.sourceType || '');
    const [language, setLanguage] = useState(initialContent?.language || '');
    const [wordCount, setWordCount] = useState(initialContent?.wordCount || 0);
    const [metadata, setMetadata] = useState(initialContent?.metadata || {});

    // Assignment Tracking
    const [readingTime, setReadingTime] = useState(0);
    const [frictionWords, setFrictionWords] = useState([]); // Words looked up

    // Assignment Timer
    useEffect(() => {
        if (!isAssignment || activeTab !== 'read') return;

        const timer = setInterval(() => {
            setReadingTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isAssignment, activeTab]);

    // Initialize Assignment Content
    useEffect(() => {
        if (assignment && assignment.content) {
            // If the assignment object has content embedded (from start_assignment)
            // Or if we need to fetch it.
            // Assuming assignment.content is the story object
            if (assignment.metadata?.story_text) {
                setContent(assignment.metadata.story_text);
                setTitle(assignment.title);
                setSourceType('story');
                setActiveTab('read');
            }
        }
    }, [assignment]);

    const handleAssignmentSubmit = async () => {
        // Logic to report progress
        if (assignment.metadata?.min_time && readingTime < assignment.metadata.min_time) {
            const mins = Math.ceil(assignment.metadata.min_time / 60);
            alert(`Please read for at least ${mins} minutes before finishing.`);
            return;
        }

        if (onComplete) {
            onComplete({
                read_time: readingTime,
                friction_words: frictionWords
            });
        }
    };

    // Input State
    const [urlInput, setUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Reader State
    const [fontSize, setFontSize] = useState(16);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isFormatting, setIsFormatting] = useState(false);
    const [isFormatted, setIsFormatted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Word Extraction State
    const [showWordPanel, setShowWordPanel] = useState(false);
    const [showPractice, setShowPractice] = useState(false); // Practice mode
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedWords, setExtractedWords] = useState([]);
    const [selectedWords, setSelectedWords] = useState([]);
    const [isAddingWords, setIsAddingWords] = useState(false);
    const [stats, setStats] = useState(null);

    // Refs
    const fileInputRef = useRef(null);
    const contentRef = useRef(null);

    // Load library on mount
    useEffect(() => {
        const saved = localStorage.getItem('readerLibrary');
        if (saved) {
            try {
                setSavedContent(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load library:', e);
            }
        }
    }, []);

    // Save content to library (Local Storage)
    const saveToLibrary = () => {
        if (!content || !title) return;

        const newItem = {
            id: Date.now(),
            title,
            content,
            sourceType,
            language,
            wordCount,
            savedAt: new Date().toISOString(),
            isFormatted
        };

        const updated = [newItem, ...savedContent.slice(0, 19)]; // Keep last 20
        setSavedContent(updated);
        localStorage.setItem('readerLibrary', JSON.stringify(updated));
        setSuccess('Saved to library!');
        setTimeout(() => setSuccess(null), 2000);
    };

    // Save to Studio (Backend GeneratedContent)
    const saveToStudio = async () => {
        if (!content || !title) return;
        setIsLoading(true);

        try {
            await api.post('/ai/save-material/', {
                title,
                content_type: 'article', // Generic article for saved reader content
                topic: sourceType || 'Reader Import',
                level: 'B1', // Default
                content_data: {
                    sections: [
                        { title: '', content: content }
                    ]
                }
            });
            setSuccess('✨ Saved to Teacher Studio Hub!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Save to studio failed:', err);
            setError('Failed to save to Studio.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load content from library
    const loadFromLibrary = (item) => {
        setContent(item.content);
        setTitle(item.title);
        setSourceType(item.sourceType);
        setLanguage(item.language || '');
        setWordCount(item.wordCount || 0);
        setIsFormatted(item.isFormatted || false);
        setActiveTab('read');
    };

    // Delete from library
    const deleteFromLibrary = (id) => {
        const updated = savedContent.filter(item => item.id !== id);
        setSavedContent(updated);
        localStorage.setItem('readerLibrary', JSON.stringify(updated));
    };

    // Handle scroll progress
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollProgress(isNaN(progress) ? 0 : progress);
    };

    // Free TTS using browser's speechSynthesis API
    const speakContent = () => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                return;
            }

            window.speechSynthesis.cancel();
            // Clean markdown syntax for better speech
            const cleanText = content
                .replace(/#{1,6}\s/g, '') // Remove headings
                .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
                .replace(/\*(.+?)\*/g, '$1') // Remove italic
                .replace(/`(.+?)`/g, '$1') // Remove inline code
                .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
                .replace(/[-*+]\s/g, '') // Remove list bullets
                .replace(/\n{2,}/g, '. ') // Replace multiple newlines with pause
                .slice(0, 5000); // Limit length for performance

            const utterance = new SpeechSynthesisUtterance(cleanText);
            // Try to detect language from content or use default
            utterance.lang = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'de-DE';
            utterance.rate = 0.9;
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    // Extract content from URL
    const handleExtractUrl = async () => {
        if (!urlInput.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await api.post('extract-content/', { url: urlInput.trim() });

            if (res.data.success) {
                setContent(res.data.content);
                setTitle(res.data.title || 'Extracted Content');
                setSourceType(res.data.source_type);
                setLanguage(res.data.language);
                setWordCount(res.data.word_count);
                setMetadata(res.data.metadata || {});
                setActiveTab('read');
                setSuccess('Content extracted successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(res.data.error || 'Failed to extract content');
            }
        } catch (err) {
            console.error('Extraction failed:', err);
            setError(err.response?.data?.error || 'Failed to extract content');
        } finally {
            setIsLoading(false);
        }
    };

    // Extract YouTube transcript
    const handleExtractYoutube = async () => {
        if (!urlInput.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await api.post('extract-youtube/', { video: urlInput.trim() });

            if (res.data.success) {
                setContent(res.data.content);
                setTitle(res.data.title || 'YouTube Transcript');
                setSourceType('youtube');
                setLanguage(res.data.language);
                setWordCount(res.data.word_count);
                setMetadata(res.data.metadata || {});
                setActiveTab('read');
                setSuccess('Transcript extracted successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(res.data.error || 'Failed to extract transcript');
            }
        } catch (err) {
            console.error('YouTube extraction failed:', err);
            setError(err.response?.data?.error || 'Failed to extract transcript');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('extract-text/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setContent(res.data.text);
                setTitle(file.name);
                setSourceType(res.data.file_type);
                setLanguage(res.data.language);
                setWordCount(res.data.word_count);
                setMetadata(res.data.metadata || {});
                setActiveTab('read');
                setSuccess('File processed successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(res.data.error || 'Failed to process file');
            }
        } catch (err) {
            console.error('File upload failed:', err);
            setError(err.response?.data?.error || 'Failed to process file');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle practice navigation
    const handlePractice = () => {
        // Navigate to practice with extracted content
        navigate('/m/practice', {
            state: {
                textToAnalyze: content,
                title: title
            }
        });
    };

    // Handle AI formatting
    const handleAIFormat = async () => {
        if (!content || isFormatting) return;

        setIsFormatting(true);
        setError(null);

        try {
            const res = await api.post('convert-text/', {
                text: content,
                source_type: sourceType
            }, {
                timeout: 180000 // 3 minutes timeout for heavy AI processing (retries)
            });

            if (res.data.success) {
                setContent(res.data.markdown);
                if (res.data.title) setTitle(res.data.title);
                setIsFormatted(true);
                setSuccess('✨ AI formatting complete!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(res.data.warning || res.data.error || 'Formatting failed');
            }
        } catch (err) {
            console.error('AI format failed:', err);
            setError(err.response?.data?.error || 'AI formatting failed');
        } finally {
            setIsFormatting(false);
        }
    };

    // Handle word extraction
    const handleExtractWords = async () => {
        if (!content || isExtracting) return;

        setIsExtracting(true);
        setError(null);

        try {
            const res = await api.post('analyze-text/', { text: content });

            setExtractedWords(res.data.new_words || []);
            setSelectedWords(res.data.new_words || []); // Select all by default
            setStats({
                total: res.data.total_words,
                unique: res.data.unique_words,
                known: res.data.known_count,
                new: res.data.new_words?.length || 0
            });
            setShowWordPanel(true);
            setSuccess(`Found ${res.data.new_words?.length || 0} new words!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Word extraction failed:', err);
            setError(err.response?.data?.error || 'Failed to extract words');
        } finally {
            setIsExtracting(false);
        }
    };

    // Toggle word selection
    const toggleWordSelection = (word) => {
        setSelectedWords(prev =>
            prev.includes(word)
                ? prev.filter(w => w !== word)
                : [...prev, word]
        );
    };

    // Select/Deselect all
    const toggleSelectAll = () => {
        if (selectedWords.length === extractedWords.length) {
            setSelectedWords([]);
        } else {
            setSelectedWords([...extractedWords]);
        }
    };

    // Add selected words to vocabulary
    const handleAddWords = async () => {
        if (selectedWords.length === 0 || isAddingWords) return;

        setIsAddingWords(true);
        setError(null);

        try {
            // Add words one by one (could be optimized with bulk endpoint)
            for (const word of selectedWords) {
                await api.post('vocab/', {
                    word: word,
                    translation: '',
                    type: 'other',
                    is_public: false
                });
            }

            setSuccess(`Added ${selectedWords.length} words to vocabulary!`);
            setTimeout(() => setSuccess(null), 3000);
            setShowWordPanel(false);
            setExtractedWords([]);
            setSelectedWords([]);
        } catch (err) {
            console.error('Add words failed:', err);
            setError(err.response?.data?.error || 'Failed to add words');
        } finally {
            setIsAddingWords(false);
        }
    };

    // Import options - enhanced to match AI Generator style
    const importOptions = [
        {
            id: 'url',
            icon: Globe,
            label: t('webArticle'),
            description: t('webArticleDesc'),
            lottieSrc: '/lottie/Web Application Build.lottie',
            color: '#6366F1',
            gradient: 'from-indigo-500/20 to-purple-500/20'
        },
        {
            id: 'youtube',
            icon: Youtube,
            label: t('youtubeVideo'),
            description: t('youtubeDesc'),
            lottieSrc: '/lottie/Youtube Logo Effect.lottie',
            color: '#EF4444',
            gradient: 'from-red-500/20 to-orange-500/20'
        },
        {
            id: 'file',
            icon: Upload,
            label: t('uploadDoc'),
            description: t('uploadDocDesc'),
            lottieSrc: '/lottie/document checking loader.lottie',
            color: '#10B981',
            gradient: 'from-emerald-500/20 to-teal-500/20'
        },
        {
            id: 'text',
            icon: FileText,
            label: t('pasteText'),
            description: t('pasteTextDesc'),
            lottieSrc: '/lottie/Files.lottie',
            color: '#F59E0B',
            gradient: 'from-amber-500/20 to-orange-500/20'
        }
    ];

    // File types
    const supportedFiles = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'TXT', 'MD', 'Images'];

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#09090B' }}>
            {/* Progress Bar */}
            {activeTab === 'read' && (
                <div className="h-1 w-full bg-[#27272A] fixed top-0 z-50">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${scrollProgress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${scrollProgress}%` }}
                    />
                </div>
            )}

            {/* Header */}
            <AnimatePresence>
                {!isFullScreen && (
                    <motion.div
                        initial={{ y: -100 }}
                        animate={{ y: 0 }}
                        exit={{ y: -100 }}
                        className="sticky top-0 z-40 px-4 py-3 border-b border-[#27272A] flex items-center justify-between"
                        style={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(10px)' }}
                    >
                        {/* Assignment Logic: Disable Back if required? No, allow back but warn */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (isAssignment) {
                                    // Assignment specific back/exit
                                    if (window.confirm("Leave assignment? Progress may be lost.")) {
                                        navigate(-1);
                                    }
                                } else if (activeTab === 'read' && content) {
                                    setActiveTab('import');
                                } else {
                                    navigate(-1);
                                }
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                        >
                            <ChevronLeft size={22} color="#A1A1AA" />
                        </motion.button>

                        <h1 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                            <BookOpen size={20} className="text-indigo-500" />
                            {t('reader')}
                        </h1>

                        <div className="flex items-center gap-1">
                            {activeTab === 'read' && (
                                <>
                                    {/* AI Format Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleAIFormat}
                                        disabled={isFormatting}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isFormatted ? 'text-green-500' : 'text-[#A1A1AA]'}`}
                                    >
                                        {isFormatting ? (
                                            <Loader2 size={20} className="animate-spin text-indigo-500" />
                                        ) : isFormatted ? (
                                            <RotateCcw size={20} />
                                        ) : (
                                            <Wand2 size={20} />
                                        )}
                                    </motion.button>

                                    {/* Extract Words Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleExtractWords}
                                        disabled={isExtracting}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#A1A1AA]"
                                    >
                                        {isExtracting ? (
                                            <Loader2 size={20} className="animate-spin text-indigo-500" />
                                        ) : (
                                            <Search size={20} />
                                        )}
                                    </motion.button>

                                    {/* TTS Listen Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={speakContent}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSpeaking ? 'bg-red-500/20 text-red-400' : 'text-[#A1A1AA]'}`}
                                    >
                                        {isSpeaking ? (
                                            <VolumeX size={20} />
                                        ) : (
                                            <Volume2 size={20} />
                                        )}
                                    </motion.button>

                                    {/* Save to Studio Button (Material Hub) */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={saveToStudio}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                                        title="Save to Studio Hub"
                                    >
                                        <Monitor size={20} />
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={saveToLibrary}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#A1A1AA]"
                                        title="Save to Library"
                                    >
                                        <Library size={20} />
                                    </motion.button>

                                    <div className="w-px h-6 bg-[#27272A] mx-1" />

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showSettings ? 'bg-[#27272A] text-[#FAFAFA]' : 'text-[#A1A1AA]'}`}
                                    >
                                        <Type size={20} />
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsFullScreen(true)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#A1A1AA]"
                                    >
                                        <Maximize2 size={20} />
                                    </motion.button>
                                    {/* Assignment Finish Button */}
                                    {isAssignment && (
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleAssignmentSubmit}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/20 text-green-400"
                                            title="Finish Reading"
                                        >
                                            <CheckCircle2 size={20} />
                                        </motion.button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Font Settings Panel */}
            <AnimatePresence>
                {showSettings && !isFullScreen && activeTab === 'read' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-[#27272A]"
                        style={{ backgroundColor: '#141416' }}
                    >
                        <div className="p-4 flex items-center justify-center gap-6">
                            <button
                                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#27272A] hover:bg-[#27272A] transition-colors"
                            >
                                <span className="text-xs font-bold text-[#FAFAFA]">A-</span>
                            </button>
                            <span className="text-sm font-medium text-[#A1A1AA] w-16 text-center">
                                {fontSize}px
                            </span>
                            <button
                                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#27272A] hover:bg-[#27272A] transition-colors"
                            >
                                <span className="text-lg font-bold text-[#FAFAFA]">A+</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Screen Exit Button */}
            {isFullScreen && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setIsFullScreen(false)}
                    className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#27272A]/80 backdrop-blur-md flex items-center justify-center z-50 border border-[#3F3F46]"
                >
                    <Minimize2 size={20} color="#FAFAFA" />
                </motion.button>
            )}

            {/* Success/Error Toast */}
            <AnimatePresence>
                {(success || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-16 left-4 right-4 z-50 p-4 rounded-xl flex items-center gap-3 ${success ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'
                            }`}
                    >
                        {success ? (
                            <CheckCircle2 size={20} className="text-emerald-400" />
                        ) : (
                            <AlertCircle size={20} className="text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${success ? 'text-emerald-300' : 'text-red-300'}`}>
                            {success || error}
                        </span>
                        <button
                            onClick={() => { setSuccess(null); setError(null); }}
                            className="ml-auto"
                        >
                            <X size={18} className="text-[#71717A]" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            {activeTab === 'import' ? (
                <div className="flex-1 overflow-y-auto pb-32">
                    {/* Header - AI Generator Style */}
                    <div className="px-6 pt-12 pb-6">
                        <div className="flex items-center justify-between mb-6">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors"
                            >
                                <ChevronLeft size={24} className="text-[#A1A1AA]" />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab('library')}
                                className="px-4 py-2 bg-[#18181B] border border-[#27272A] rounded-full flex items-center gap-2 hover:bg-[#27272A] transition-colors"
                            >
                                <span className="text-sm font-medium text-white">📚 {t('library')}</span>
                            </motion.button>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen size={22} className="text-indigo-500" />
                                <span className="text-indigo-500 font-bold tracking-wider text-sm uppercase">{t('smartReader')}</span>
                            </div>
                            <h1 className="text-4xl font-black text-white mb-2">{t('readAndLearn')}</h1>
                            <p className="text-[#A1A1AA] text-lg">{t('readerSubtitle')}</p>
                        </motion.div>
                    </div>

                    {/* Import Options - AI Generator Card Style */}
                    {!importMode && (
                        <div className="px-4 flex flex-col gap-4">
                            {importOptions.map((option, index) => (
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setImportMode(option.id)}
                                    className="w-full text-left relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-[#18181B] rounded-3xl border border-white/5" />
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-15 group-active:opacity-20 transition-opacity duration-300 bg-gradient-to-br ${option.gradient}`} />

                                    <div className="relative p-5 flex items-center gap-4">
                                        <div className="w-20 h-20 flex-shrink-0">
                                            <DotLottieReact
                                                src={option.lottieSrc}
                                                loop
                                                autoplay
                                                style={{ width: 80, height: 80 }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">{option.label}</h3>
                                            <p className="text-sm text-[#A1A1AA] leading-relaxed">{option.description}</p>
                                        </div>
                                        <motion.div
                                            className="self-center"
                                            animate={{ x: [0, 4, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <path d="M7 4L13 10L7 16" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </motion.div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* URL Input Mode */}
                    {importMode === 'url' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 px-5"
                        >

                            <button
                                onClick={() => setImportMode(null)}
                                className="flex items-center gap-2 text-[#71717A] text-sm mb-4"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>

                            <div className="relative">
                                <Globe size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" />
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Paste article URL..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#141416] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:border-indigo-500 focus:outline-none text-base"
                                />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExtractUrl}
                                disabled={isLoading || !urlInput.trim()}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Extracting...
                                    </>
                                ) : (
                                    <>
                                        Start Reading <ChevronLeft className="rotate-180" size={20} />
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Paste Text Mode */}
                    {importMode === 'text' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 px-5"
                        >
                            <button
                                onClick={() => setImportMode(null)}
                                className="flex items-center gap-2 text-[#71717A] text-sm mb-4"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>

                            <div className="relative">
                                <FileText size={20} className="absolute left-4 top-4 text-[#71717A]" />
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Paste your text here..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#141416] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:border-amber-500 focus:outline-none text-base min-h-[200px]"
                                />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (!content.trim()) return;
                                    setTitle('Pasted Text');
                                    setSourceType('text');
                                    setActiveTab('read');
                                    setImportMode(null);
                                }}
                                disabled={!content.trim()}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                Start Reading <ChevronLeft className="rotate-180" size={20} />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* YouTube Input Mode */}
                    {importMode === 'youtube' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 px-5"
                        >
                            <button
                                onClick={() => setImportMode(null)}
                                className="flex items-center gap-2 text-[#71717A] text-sm mb-4"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>

                            <div className="relative">
                                <Youtube size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="Paste YouTube URL or video ID..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#141416] border border-[#27272A] text-[#FAFAFA] placeholder:text-[#52525B] focus:border-red-500 focus:outline-none text-base"
                                />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExtractYoutube}
                                disabled={isLoading || !urlInput.trim()}
                                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Getting Transcript...
                                    </>
                                ) : (
                                    <>
                                        <Youtube size={16} />
                                        Get Transcript
                                    </>
                                )}
                            </motion.button>

                            <p className="text-xs text-[#52525B] text-center">
                                Works with any YouTube video that has captions enabled
                            </p>
                        </motion.div>
                    )}

                    {/* File Upload Mode */}
                    {importMode === 'file' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 px-5"
                        >

                            <button
                                onClick={() => setImportMode(null)}
                                className="flex items-center gap-2 text-[#71717A] text-sm mb-4"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileUpload}
                                accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp"
                                className="hidden"
                            />

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="w-full py-12 rounded-2xl border-2 border-dashed border-[#27272A] hover:border-emerald-500/50 bg-[#141416] flex flex-col items-center justify-center gap-3 transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={40} className="text-emerald-500 animate-spin" />
                                        <span className="text-[#A1A1AA]">Processing file...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <Upload size={32} className="text-emerald-400" />
                                        </div>
                                        <span className="text-[#FAFAFA] font-bold">Tap to upload file</span>
                                        <span className="text-xs text-[#52525B]">
                                            {supportedFiles.join(' • ')}
                                        </span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            ) : (
                /* Reader View */
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-5 py-6"
                >
                    <div className="max-w-2xl mx-auto pb-24">
                        {/* Content Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            {/* Source Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                {(() => {
                                    const Icon = getFileIcon(sourceType);
                                    return (
                                        <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[#A1A1AA] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Icon size={12} />
                                            {sourceType}
                                        </span>
                                    );
                                })()}
                                <span className="text-xs text-[#52525B]">
                                    {wordCount.toLocaleString()} words
                                </span>
                                {language !== 'unknown' && (
                                    <span className="text-xs text-[#52525B]">
                                        • {language.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-black text-[#FAFAFA] leading-tight">
                                {title}
                            </h1>

                            {/* Metadata */}
                            {metadata.author && (
                                <p className="text-sm text-[#71717A] mt-2">
                                    By {metadata.author}
                                </p>
                            )}
                        </motion.div>

                        {/* Content */}
                        <MobileMarkdownRenderer content={content} fontSize={fontSize} />
                    </div>
                </div>
            )}

            {/* Word Extraction Panel - Full Screen Modal */}
            <AnimatePresence>
                {showWordPanel && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex flex-col"
                        style={{ backgroundColor: '#09090B' }}
                    >
                        {/* Compact Header */}
                        <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between">
                            <button
                                onClick={() => setShowWordPanel(false)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#18181B]"
                            >
                                <X size={18} color="#A1A1AA" />
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-[#FAFAFA]">{selectedWords.length} selected</span>
                                <span className="text-xs text-[#52525B]">of {extractedWords.length}</span>
                            </div>
                            <button
                                onClick={toggleSelectAll}
                                className="px-3 py-1.5 rounded-lg bg-[#27272A] text-xs font-medium text-[#A1A1AA]"
                            >
                                {selectedWords.length === extractedWords.length ? 'Clear' : 'All'}
                            </button>
                        </div>

                        {/* Word List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {extractedWords.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                                    <p className="text-[#FAFAFA] font-bold">No new words found!</p>
                                    <p className="text-sm text-[#71717A]">All words are already in your vocabulary.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {extractedWords.map((word, index) => (
                                        <motion.button
                                            key={word}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: Math.min(index * 0.005, 0.3) }}
                                            onClick={() => toggleWordSelection(word)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedWords.includes(word)
                                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                                : 'bg-[#18181B] border border-[#27272A] text-[#A1A1AA]'
                                                }`}
                                        >
                                            {selectedWords.includes(word) && <span className="mr-1">✓</span>}
                                            {word}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Fixed Bottom Action Bar - with large padding for nav */}
                        <div
                            className="border-t border-[#27272A] bg-[#09090B] p-4 pb-24"
                        >
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setShowWordPanel(false);
                                    setShowPractice(true);
                                }}
                                disabled={selectedWords.length === 0}
                                className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                <GraduationCap size={20} />
                                Practice {selectedWords.length} Words
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Library Tab */}
            {activeTab === 'library' && (
                <div className="flex-1 overflow-y-auto p-5 pb-32">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => setActiveTab('import')}
                                className="w-10 h-10 rounded-xl bg-[#27272A] flex items-center justify-center"
                            >
                                <ChevronLeft size={20} className="text-[#A1A1AA]" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-[#FAFAFA]">My Library</h2>
                                <p className="text-sm text-[#71717A]">{savedContent.length} saved readings</p>
                            </div>
                        </div>

                        {savedContent.length === 0 ? (
                            <div className="text-center py-16">
                                <Library size={48} className="mx-auto text-[#3F3F46] mb-4" />
                                <p className="text-[#71717A]">No saved content yet</p>
                                <p className="text-sm text-[#52525B]">Import and save content to see it here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedContent.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-2xl bg-[#18181B] border border-[#27272A]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                <FileText size={22} className="text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#FAFAFA] line-clamp-1">{item.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock size={12} className="text-[#52525B]" />
                                                    <span className="text-xs text-[#52525B]">
                                                        {new Date(item.savedAt).toLocaleDateString()}
                                                    </span>
                                                    {item.wordCount > 0 && (
                                                        <span className="text-xs text-[#52525B]">• {item.wordCount} words</span>
                                                    )}
                                                    {item.isFormatted && (
                                                        <span className="text-xs text-emerald-400">• Formatted</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => loadFromLibrary(item)}
                                                className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white font-medium text-sm"
                                            >
                                                Open & Read
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => deleteFromLibrary(item.id)}
                                                className="w-12 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"
                                            >
                                                <Trash2 size={18} className="text-red-400" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Practice Mode */}
            {showPractice && selectedWords.length > 0 && (
                <MobileReaderPractice
                    words={selectedWords}
                    onBack={() => {
                        setShowPractice(false);
                        setShowWordPanel(true);
                    }}
                    onComplete={(savedWords) => {
                        setShowPractice(false);
                        setSelectedWords([]);
                        setExtractedWords([]);
                        if (savedWords && savedWords.length > 0) {
                            setSuccess(`Added ${savedWords.length} words to vocabulary!`);
                            setTimeout(() => setSuccess(null), 3000);
                        }
                    }}
                />
            )}

        </div>
    );
}

export default MobileReader;
