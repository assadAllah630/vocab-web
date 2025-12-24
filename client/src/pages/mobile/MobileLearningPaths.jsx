import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, BookOpen, Layers, Search, Filter } from 'lucide-react';
import { Button, Input, Card, Chip } from '@heroui/react';
import { getPaths } from '../../api';

const MobileLearningPaths = () => {
    const navigate = useNavigate();
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadPaths();
    }, []);

    const loadPaths = async () => {
        try {
            const res = await getPaths();
            setPaths(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = paths.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="p-10 text-center text-white">Loading Catalog...</div>;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white p-5">
            <h1 className="text-2xl font-bold mt-8">Learning Paths</h1>
            <p className="text-xs text-gray-500 mb-6">Structured expert courses</p>

            <div className="flex gap-2 mb-6">
                <Input placeholder="Search..." startContent={<Search size={18} />} value={searchTerm} onValueChange={setSearchTerm} />
            </div>

            <div className="space-y-4">
                {filtered.map(p => (
                    <Card key={p.id} isPressable onPress={() => navigate(`/m/path/${p.id}`)} className="p-4 bg-[#141416] border-[#27272A] flex-row gap-4 items-center">
                        <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-2xl">
                            {p.title.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <Chip size="sm" color="secondary" variant="flat">{p.level}</Chip>
                            <h3 className="font-bold text-sm mt-1">{p.title}</h3>
                            <p className="text-[10px] text-gray-500">By {p.teacher_name}</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-700" />
                    </Card>
                ))}
            </div>

            {(user.is_staff || user.is_superuser) && (
                <Button isIconOnly color="primary" className="fixed bottom-24 right-6 rounded-full w-14 h-14" onPress={() => navigate('/m/path/create/build')}>
                    <Plus size={24} />
                </Button>
            )}
        </div>
    );
};

export default MobileLearningPaths;
