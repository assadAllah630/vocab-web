import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, School, Users, BookOpen, Search } from 'lucide-react';
import { Button, Input, Card, Chip, Avatar } from '@heroui/react';
import { getMyClassrooms } from '../../api';

const MobileTeacherClasses = () => {
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadClassrooms();
    }, []);

    const loadClassrooms = async () => {
        try {
            const res = await getMyClassrooms();
            setClassrooms(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClassrooms = classrooms.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500/30 pb-24 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[50%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />
                <div className="absolute top-[40%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-20 px-6 pt-12 pb-4 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-white tracking-tight">My<br />Classrooms</h1>
                    <Button
                        isIconOnly
                        className="bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-2xl w-12 h-12"
                        onPress={() => navigate('/m/classroom/create')}
                    >
                        <Plus size={24} />
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search classes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            <div className="relative z-10 px-6 py-6 space-y-4">
                {filteredClassrooms.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 opacity-50">
                        <School size={48} className="mx-auto mb-4 text-gray-600" />
                        <p className="font-bold text-gray-400">No classrooms found</p>
                        <p className="text-sm text-gray-600 mt-2">Create a new class to get started</p>
                    </motion.div>
                ) : (
                    filteredClassrooms.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <button
                                onClick={() => navigate(`/m/classroom/${c.id}`)}
                                className="w-full text-left group relative overflow-hidden rounded-[24px] border border-white/5 bg-[#18181b] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white leading-tight">{c.name}</h3>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                                                    <span>{c.language?.name || 'English'}</span>
                                                    <span>•</span>
                                                    <span>{c.level || 'Beginner'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                            <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                        <Chip size="sm" classNames={{ base: "bg-indigo-500/10 border border-indigo-500/20", content: "text-indigo-400 font-bold text-[10px] uppercase" }}>
                                            {c.student_count || 0} Students
                                        </Chip>
                                        <Chip size="sm" classNames={{ base: "bg-purple-500/10 border border-purple-500/20", content: "text-purple-400 font-bold text-[10px] uppercase" }}>
                                            {c.assignment_count || 0} Assignments
                                        </Chip>
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MobileTeacherClasses;
