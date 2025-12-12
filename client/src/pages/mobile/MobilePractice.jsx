import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Layers,
    Brain,
    Gamepad2,
    BookOpen,
    Headphones,
    FileText,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

function MobilePractice() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const mainModes = [
        {
            id: 'flashcards',
            title: t('flashcards'),
            desc: t('review'),
            icon: Layers,
            action: () => navigate('/m/practice/flashcard?hlr=true')
        },
        {
            id: 'quiz',
            title: t('quiz'),
            desc: t('exams'),
            icon: Brain,
            action: () => navigate('/m/exam')
        },
        {
            id: 'games',
            title: t('games'),
            desc: t('playNow'),
            icon: Gamepad2,
            action: () => navigate('/m/games')
        },
        {
            id: 'grammar',
            title: t('grammar'),
            desc: t('generateLesson'),
            icon: BookOpen,
            action: () => navigate('/m/grammar')
        }
    ];

    const moreTools = [
        { id: 'reader', title: t('reader'), icon: FileText, action: () => navigate('/m/reader') },
        { id: 'podcasts', title: 'Podcasts', icon: Headphones, action: () => navigate('/podcasts') },
        { id: 'generator', title: t('generate'), icon: Sparkles, action: () => navigate('/m/ai') }
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div className="px-5 pt-14 pb-6">
                <h1 className="text-xl font-semibold" style={{ color: '#FAFAFA' }}>{t('practice')}</h1>
                <p className="text-sm mt-1" style={{ color: '#71717A' }}>{t('selectGame')}</p>
            </div>

            {/* Main Modes */}
            <div className="px-5 mb-6">
                <div className="space-y-2">
                    {mainModes.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={mode.action}
                            className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors"
                            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                        >
                            <div
                                className="w-11 h-11 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: '#1C1C1F' }}
                            >
                                <mode.icon size={20} style={{ color: '#A1A1AA' }} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium" style={{ color: '#FAFAFA' }}>{mode.title}</p>
                                <p className="text-sm" style={{ color: '#71717A' }}>{mode.desc}</p>
                            </div>
                            <ChevronRight size={18} style={{ color: '#71717A' }} />
                        </button>
                    ))}
                </div>
            </div>

            {/* More Tools */}
            <div className="px-5">
                <h2 className="text-sm font-medium mb-3" style={{ color: '#A1A1AA' }}>{t('more')}</h2>
                <div
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                >
                    {moreTools.map((tool, i) => (
                        <button
                            key={tool.id}
                            onClick={tool.action}
                            className="w-full flex items-center gap-4 p-4 transition-colors"
                            style={{ borderBottom: i < moreTools.length - 1 ? '1px solid #1C1C1F' : 'none' }}
                        >
                            <tool.icon size={18} style={{ color: '#71717A' }} />
                            <span className="flex-1 text-left text-sm font-medium" style={{ color: '#FAFAFA' }}>
                                {tool.title}
                            </span>
                            <ChevronRight size={16} style={{ color: '#71717A' }} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MobilePractice;
