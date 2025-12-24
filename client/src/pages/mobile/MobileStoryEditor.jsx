import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Save, Sparkles, AlertCircle,
    CheckCircle, Type, Layout, Trash2, Plus
} from 'lucide-react';
import { Button, Input, Textarea, Select, SelectItem, Card } from '@heroui/react';
import { getGeneratedContent, updateGeneratedContent } from '../../api';

const MobileStoryEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [level, setLevel] = useState('');
    const [events, setEvents] = useState([]);

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
            setEvents(data.content_data?.events || []);
        } catch (err) {
            console.error("Failed to fetch story:", err);
            setError("Could not load story details.");
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
                content_data: {
                    ...content.content_data,
                    events: events
                }
            };

            await updateGeneratedContent(id, updatedData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to update story:", err);
            setError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const updateEventContent = (index, newContent) => {
        const newEvents = [...events];
        newEvents[index] = { ...newEvents[index], content: newContent };
        setEvents(newEvents);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090B] text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#09090B]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="font-bold text-sm truncate max-w-[150px]">Edit Story</h1>
                </div>
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

            <div className="p-5 space-y-6">
                {/* Status Messages */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-500 text-sm font-bold">
                            <CheckCircle size={18} />
                            Story updated successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Metadata */}
                <Card className="bg-[#141416] border-white/5 p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Type size={12} />
                            Story Title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                            placeholder="Enter story title..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Layout size={12} />
                            Student Level
                        </label>
                        <Select
                            size="sm"
                            selectedKeys={[level]}
                            onSelectionChange={(keys) => setLevel(Array.from(keys)[0])}
                            classNames={{ trigger: "bg-white/5 border-white/10 rounded-xl h-11" }}
                        >
                            <SelectItem key="A1">A1 - Beginner</SelectItem>
                            <SelectItem key="A2">A2 - Elementary</SelectItem>
                            <SelectItem key="B1">B1 - Intermediate</SelectItem>
                            <SelectItem key="B2">B2 - Upper Intermediate</SelectItem>
                            <SelectItem key="C1">C1 - Advanced</SelectItem>
                            <SelectItem key="C2">C2 - Mastery</SelectItem>
                        </Select>
                    </div>
                </Card>

                {/* Event Paragraphs */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Story Content</h2>
                        <span className="text-[10px] font-bold text-gray-600">{events.length} paragraphs</span>
                    </div>

                    {events.map((event, index) => (
                        <Card key={index} className="bg-[#141416] border-white/5 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="bg-white/5 text-gray-500 text-[10px] font-black px-2 py-1 rounded">
                                    PARAGRAPH {index + 1}
                                </span>
                                {event.image_url && (
                                    <div className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                                        <Sparkles size={10} /> Has Illustration
                                    </div>
                                )}
                            </div>
                            <Textarea
                                value={event.content}
                                onChange={(e) => updateEventContent(index, e.target.value)}
                                className="text-white"
                                minRows={3}
                                classNames={{
                                    input: "text-sm leading-relaxed",
                                    inputWrapper: "bg-white/5 hover:bg-white/10 focus-within:bg-white/5 border-white/10 transition-colors"
                                }}
                            />
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileStoryEditor;
