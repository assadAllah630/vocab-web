import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Save, Sparkles, AlertCircle,
    CheckCircle, Type, Layout, Trash2, Plus,
    MessageSquare, BookOpen, FileText, User,
    Image as ImageIcon
} from 'lucide-react';
import { Button, Input, Textarea, Select, SelectItem, Card } from '@heroui/react';
import { getGeneratedContent, updateGeneratedContent } from '../../api';

const MobileContentEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Common Form state
    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('');
    const [topic, setTopic] = useState('');

    // Dynamic Content State
    const [items, setItems] = useState([]); // This will be events, sections, or messages

    useEffect(() => {
        fetchContent();
    }, [id]);

    const fetchContent = async () => {
        try {
            const res = await getGeneratedContent(id);
            const data = res.data;
            setContent(data);
            setTitle(data.title || '');
            setLevel(data.level || 'B1');
            setTopic(data.topic || '');

            // Extract type-specific list
            if (data.content_type === 'story') {
                setItems(data.content_data?.events || []);
            } else if (data.content_type === 'article') {
                setItems(data.content_data?.sections || []);
            } else if (data.content_type === 'dialogue') {
                setItems(data.content_data?.messages || []);
            }
        } catch (err) {
            console.error("Failed to fetch content:", err);
            setError("Could not load material details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const updatedData = {
                title,
                level,
                topic,
                content_data: {
                    ...content.content_data,
                    // Re-pack into type-specific key
                    [content.content_type === 'story' ? 'events' :
                        content.content_type === 'article' ? 'sections' : 'messages']: items
                }
            };

            await updateGeneratedContent(id, updatedData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to update content:", err);
            setError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        const newItem = content.content_type === 'dialogue'
            ? { role: 'A', text: '', translation: '' }
            : { title: '', content: '' };
        setItems([...items, newItem]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    if (loading) return (
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Opening Studio...</p>
            </div>
        </div>
    );

    const typeConfig = {
        story: { icon: BookOpen, label: 'Story Paragraph', color: 'text-purple-400' },
        article: { icon: FileText, label: 'Article Section', color: 'text-emerald-400' },
        dialogue: { icon: MessageSquare, label: 'Exchange', color: 'text-orange-400' },
    };

    const currentConfig = typeConfig[content.content_type];

    return (
        <div className="min-h-screen bg-[#09090B] text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#09090B]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-xs text-gray-500 uppercase tracking-widest leading-none mb-1">Studio Editor</h1>
                        <p className="font-black text-sm truncate max-w-[150px] leading-none">{title || 'Untitled'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        color="primary"
                        className="font-black bg-indigo-600 h-9"
                        onPress={handleSave}
                        isLoading={saving}
                        startContent={!saving && <Save size={16} />}
                    >
                        SAVE
                    </Button>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Status Messages */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-500 text-xs font-bold">
                            <CheckCircle size={18} />
                            Universal Materal Updated Successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Metadata Card */}
                <Card className="bg-[#141416] border-white/5 p-4 space-y-4 shadow-xl">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <Type size={12} className="text-indigo-400" />
                                Material Title
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                placeholder="Enter title..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <GraduationCap size={12} className="text-indigo-400" />
                                Level
                            </label>
                            <Select
                                size="sm"
                                selectedKeys={[level]}
                                onSelectionChange={(keys) => setLevel(Array.from(keys)[0])}
                                classNames={{ trigger: "bg-white/5 border-white/10 rounded-xl h-11" }}
                            >
                                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lv => (
                                    <SelectItem key={lv}>{lv}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles size={12} className="text-indigo-400" />
                                Topic
                            </label>
                            <input
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                placeholder="Topic..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Content Items List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <currentConfig.icon size={14} className={currentConfig.color} />
                            {content.content_type} Content
                        </h2>
                        <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                            {items.length} Blocks
                        </span>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <motion.div
                                key={index}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Card className="bg-[#141416] border-white/5 p-4 space-y-3 relative group">
                                    <div className="flex items-center justify-between">
                                        <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                            {currentConfig.label} {index + 1}
                                        </span>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-gray-600 hover:text-red-500"
                                            onPress={() => removeItem(index)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>

                                    {content.content_type === 'dialogue' ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex gap-2">
                                                <div className="w-12">
                                                    <input
                                                        value={item.role}
                                                        onChange={(e) => updateItem(index, 'role', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center text-xs font-black uppercase"
                                                        placeholder="Role"
                                                    />
                                                </div>
                                                <Textarea
                                                    value={item.text}
                                                    onChange={(e) => updateItem(index, 'text', e.target.value)}
                                                    placeholder="Dialogue text..."
                                                    minRows={1}
                                                    classNames={{
                                                        inputWrapper: "bg-white/5 border-white/10 hover:border-indigo-500/50 rounded-xl",
                                                        input: "text-sm"
                                                    }}
                                                />
                                            </div>
                                            <Textarea
                                                value={item.translation}
                                                onChange={(e) => updateItem(index, 'translation', e.target.value)}
                                                placeholder="Translation..."
                                                minRows={1}
                                                classNames={{
                                                    inputWrapper: "bg-white/5 border-white/10 border-dashed rounded-xl",
                                                    input: "text-xs text-gray-500"
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Story/Article Sections */}
                                            {item.title !== undefined && (
                                                <input
                                                    value={item.title}
                                                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-white border-b border-white/5 pb-2 focus:border-indigo-500 outline-none"
                                                    placeholder="Sub-heading..."
                                                />
                                            )}
                                            <Textarea
                                                value={item.content}
                                                onChange={(e) => updateItem(index, 'content', e.target.value)}
                                                placeholder="Write or edit content here..."
                                                minRows={3}
                                                classNames={{
                                                    inputWrapper: "bg-transparent border-none p-0",
                                                    input: "text-sm leading-relaxed text-gray-300"
                                                }}
                                            />
                                            {item.image_url && (
                                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                    <ImageIcon size={12} className="text-gray-600" />
                                                    <span className="text-[10px] text-gray-500 font-medium truncate max-w-[200px] italic">
                                                        Linked Visual Asset Attached
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <Button
                        fullWidth
                        variant="dashed"
                        className="bg-white/5 border-white/10 text-gray-500 font-bold h-12 rounded-2xl mt-4 border-dashed border-2"
                        startContent={<Plus size={18} />}
                        onPress={addItem}
                    >
                        ADD BLOCK
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MobileContentEditor;
