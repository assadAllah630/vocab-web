import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Chip } from '@heroui/react';
import { Search, BookOpen, Sparkles, Gamepad2, FileText, Check } from 'lucide-react';
import api from '../api';

const CONTENT_TYPES = [
    { id: 'story', label: 'Story / Lesson', icon: BookOpen, endpoint: 'saved-texts', color: 'bg-blue-500/10 text-blue-400' },
    { id: 'exam', label: 'Exam / Quiz', icon: Sparkles, endpoint: 'exams', color: 'bg-amber-500/10 text-amber-400' },
    { id: 'game', label: 'Game Session', icon: Gamepad2, endpoint: 'game-configs', color: 'bg-indigo-500/10 text-indigo-400' }
];

const ContentSelector = ({ selectedType, onSelect, initialSelection = null }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState(selectedType || 'story');

    useEffect(() => {
        if (selectedType) setActiveTab(selectedType);
    }, [selectedType]);

    useEffect(() => {
        loadContent();
    }, [activeTab, search]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const typeConfig = CONTENT_TYPES.find(t => t.id === activeTab);
            if (!typeConfig) return;

            let url = `${typeConfig.endpoint}/`;
            if (search) {
                // Adjust per endpoint if needed
                url += `?search=${encodeURIComponent(search)}`;
            }

            // For exams, we might want templates only?
            if (activeTab === 'exam') {
                url += url.includes('?') ? '&is_template=true' : '?is_template=true';
            }

            const res = await api.get(url);

            // Normalize data (results vs raw list)
            let data = res.data.results || res.data;
            if (Array.isArray(data)) {
                setItems(data);
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Failed to load content', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const getItemTitle = (item) => {
        if (activeTab === 'story') return item.title || item.original_title;
        if (activeTab === 'exam') return item.title;
        if (activeTab === 'game') return item.name;
        return 'Untitled';
    };

    const getItemMeta = (item) => {
        if (activeTab === 'story') return `${item.word_count || 0} words • ${item.level || '?'}`;
        if (activeTab === 'exam') return `${item.question_count || 0} questions • ${item.time_limit_minutes || 0}m`;
        if (activeTab === 'game') return `${item.mode || 'Standard'} • ${item.content_source}`;
        return '';
    };

    return (
        <div className="space-y-4">
            {/* Type Tabs */}
            <div className="flex gap-2 p-1 bg-[#1C1C1F] rounded-xl overflow-x-auto">
                {CONTENT_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => { setActiveTab(type.id); onSelect(null); }} // Reset selection on change
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors ${activeTab === type.id
                                ? 'bg-[#27272A] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <type.icon size={14} />
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <Input
                placeholder={`Search ${activeTab}...`}
                startContent={<Search size={16} className="text-gray-500" />}
                value={search}
                onValueChange={setSearch}
                variant="bordered"
                classNames={{
                    inputWrapper: "bg-[#1C1C1F] border-[#27272A]"
                }}
            />

            {/* Results List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-8 text-gray-500 text-xs">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">No content found</div>
                ) : (
                    items.map(item => {
                        const isSelected = initialSelection === item.id;
                        const typeConfig = CONTENT_TYPES.find(t => t.id === activeTab);

                        return (
                            <div
                                key={item.id}
                                onClick={() => {
                                    // Construct a standard "content" object to return
                                    onSelect({
                                        id: item.id,
                                        type: activeTab,
                                        title: getItemTitle(item),
                                        meta: item
                                    });
                                }}
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected
                                        ? 'bg-indigo-500/10 border-indigo-500'
                                        : 'bg-[#1C1C1F] border-[#27272A] hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                                        <typeConfig.icon size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{getItemTitle(item)}</p>
                                        <p className="text-[10px] text-gray-400">{getItemMeta(item)}</p>
                                    </div>
                                </div>
                                {isSelected && <Check size={16} className="text-indigo-400" />}
                            </div>
                        );
                    })
                )}
            </div>

            {!initialSelection && (
                <p className="text-[10px] text-center text-gray-500 italic">
                    Select an item to link it to this path step.
                </p>
            )}
        </div>
    );
};

export default ContentSelector;
