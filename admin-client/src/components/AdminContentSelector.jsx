
import { useState, useEffect } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from './ui/Dialog';
import {
    BookOpenIcon,
    SparklesIcon,
    PuzzlePieceIcon,
    MagnifyingGlassIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import api from '../api';
import { cn } from '../utils/cn';

const CONTENT_TYPES = [
    { id: 'story', label: 'Story / Lesson', icon: BookOpenIcon, endpoint: '/api/content/saved-texts/', color: 'bg-blue-500/10 text-blue-600' },
    { id: 'exam', label: 'Exam / Quiz', icon: SparklesIcon, endpoint: '/api/exam/exams/', color: 'bg-amber-500/10 text-amber-600' },
    { id: 'game', label: 'Game Session', icon: PuzzlePieceIcon, endpoint: '/api/games/game-configs/', color: 'bg-indigo-500/10 text-indigo-600' }
];

export default function AdminContentSelector({ isOpen, onClose, onSelect }) {
    const [activeTab, setActiveTab] = useState('story');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadContent();
        }
    }, [isOpen, activeTab, search]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const typeConfig = CONTENT_TYPES.find(t => t.id === activeTab);
            if (!typeConfig) return;

            let url = typeConfig.endpoint;
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            // Adjust params based on type
            if (activeTab === 'exam') params.append('is_template', 'true');

            const res = await api.get(`${url}?${params.toString()}`);
            const data = res.data.results || res.data;
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load content', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        onSelect({
            id: item.id,
            type: activeTab,
            title: item.title || item.original_title || item.name,
            meta: item
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Select Content</DialogTitle>
                </DialogHeader>

                <div className="px-6 space-y-4">
                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {CONTENT_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setActiveTab(type.id)}
                                className={cn(
                                    "flex-1 px-3 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
                                    activeTab === type.id
                                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <type.icon className="h-4 w-4" />
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            className="pl-9"
                            placeholder={`Search ${activeTab}s...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                            No content found.
                        </div>
                    ) : (
                        items.map((item) => {
                            const typeConfig = CONTENT_TYPES.find(t => t.id === activeTab);
                            const title = item.title || item.original_title || item.name;
                            const meta = activeTab === 'story' ? `${item.word_count || 0} words • ${item.level || '?'}` :
                                activeTab === 'exam' ? `${item.question_count || 0} Qs • ${item.time_limit_minutes || 0}m` :
                                    activeTab === 'game' ? `${item.mode} • ${item.content_source}` : '';

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", typeConfig.color)}>
                                            <typeConfig.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                {title}
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                {meta}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
