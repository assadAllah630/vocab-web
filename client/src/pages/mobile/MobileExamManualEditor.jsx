import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Save, AlertCircle,
    CheckCircle, Type, GraduationCap
} from 'lucide-react';
import { Button, Card } from '@heroui/react';
import api, { getExam } from '../../api'; // Assuming a generic api update for exams or using a specific one
import MobileExamEditor from './MobileExamEditor';

const MobileExamManualEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [sections, setSections] = useState([]);

    useEffect(() => {
        fetchExam();
    }, [id]);

    const fetchExam = async () => {
        try {
            const res = await getExam(id);
            const data = res.data;
            setExam(data);
            setTitle(data.title || '');
            // Exams are structured with a "questions" field which is an array of sections
            setSections(data.questions || []);
        } catch (err) {
            console.error("Failed to fetch exam:", err);
            setError("Could not load exam details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // We'll use a PATCH request to the exams endpoint
            await api.patch(`/exams/${id}/`, {
                title,
                questions: sections
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to update exam:", err);
            setError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
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
                    <h1 className="font-bold text-sm truncate max-w-[150px]">Edit Exam</h1>
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
                            Exam updated successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Metadata */}
                <Card className="bg-[#141416] border-white/5 p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Type size={12} />
                            Exam Title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors"
                            placeholder="Enter exam title..."
                        />
                    </div>
                </Card>

                {/* Sections Editor */}
                <div className="space-y-4">
                    <MobileExamEditor value={sections} onChange={setSections} />
                </div>
            </div>
        </div>
    );
};

export default MobileExamManualEditor;
