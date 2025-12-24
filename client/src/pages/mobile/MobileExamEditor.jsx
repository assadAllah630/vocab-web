import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, CheckCircle2, GripVertical, Type, List, AlignLeft, Target, Layout } from 'lucide-react';
import { Button, Select, SelectItem } from '@heroui/react';
import { MCQEditor, ClozeEditor, MatchingEditor } from './MobileExamQuestionEditors';

const SECTION_TYPES = [
    { id: 'multiple_choice', label: 'Multiple Choice', icon: Layout },
    { id: 'cloze', label: 'Fill in Blanks', icon: Type },
    { id: 'matching', label: 'Matching Pairs', icon: Target },
];

/**
 * MobileExamEditor
 * Wraps existing specific editors (MCQ, Cloze, Matching) into a unified section-based editor.
 */
const MobileExamEditor = ({ value = [], onChange }) => {
    // value is array of SECTIONS now, not just questions. 
    // This aligns with how the editors work (they take a list of items).
    // Structure: [{ id, type, items: [] }]

    const addSection = () => {
        onChange([...value, {
            id: Date.now(),
            type: 'multiple_choice',
            items: []
        }]);
    };

    const removeSection = (id) => {
        onChange(value.filter(s => s.id !== id));
    };

    const updateSectionType = (id, newType) => {
        // Warning: this clears items if type changes
        onChange(value.map(s => s.id === id ? { ...s, type: newType, items: [] } : s));
    };

    const updateSectionItems = (id, newItems) => {
        onChange(value.map(s => s.id === id ? { ...s, items: newItems } : s));
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Exam Sections</h3>
                <Button
                    size="sm"
                    color="primary"
                    startContent={<Plus size={16} />}
                    onPress={addSection}
                    className="font-bold bg-indigo-600"
                >
                    Add Section
                </Button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {value.map((section, index) => (
                        <SectionCard
                            key={section.id}
                            section={section}
                            index={index}
                            onUpdateType={(t) => updateSectionType(section.id, t)}
                            onUpdateItems={(items) => updateSectionItems(section.id, items)}
                            onRemove={() => removeSection(section.id)}
                        />
                    ))}
                </AnimatePresence>

                {value.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                        <Type className="mx-auto text-gray-500 mb-2" size={32} />
                        <p className="text-gray-400 font-medium">No sections yet</p>
                        <Button variant="light" color="primary" onPress={addSection} className="mt-2 text-indigo-400 font-bold">
                            Tap to start building
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SectionCard = ({ section, index, onUpdateType, onUpdateItems, onRemove }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-4 flex items-center gap-3 bg-white/5 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-300">
                        {SECTION_TYPES.find(t => t.id === section.type)?.label}
                    </span>
                    <span className="text-xs text-gray-600">({section.items.length} items)</span>
                </div>

                <div className="flex items-center gap-1">
                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); onRemove(); }}>
                        <Trash2 size={16} />
                    </Button>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-white/5 space-y-4">

                            {/* Type Selector */}
                            <Select
                                size="sm"
                                label="Section Type"
                                selectedKeys={[section.type]}
                                classNames={{ trigger: "bg-[#09090b] border border-white/10" }}
                                onChange={(e) => {
                                    if (e.target.value) onUpdateType(e.target.value);
                                }}
                            >
                                {SECTION_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                            </Select>

                            {/* Specific Editor based on Type */}
                            <div className="pt-2">
                                {section.type === 'multiple_choice' && (
                                    <MCQEditor questions={section.items} onChange={onUpdateItems} />
                                )}
                                {section.type === 'cloze' && (
                                    <ClozeEditor items={section.items} onChange={onUpdateItems} />
                                )}
                                {section.type === 'matching' && (
                                    <MatchingEditor pairs={section.items} onChange={onUpdateItems} />
                                )}
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MobileExamEditor;
