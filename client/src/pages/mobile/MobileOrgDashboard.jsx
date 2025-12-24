import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, BookOpen, BarChart3, Settings, UserPlus, Building2 } from 'lucide-react';
import { Button, Card, Progress, Chip } from '@heroui/react';
import { getOrgDashboard } from '../../api';

const MobileOrgDashboard = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [slug]);

    const loadDashboard = async () => {
        try {
            const res = await getOrgDashboard(slug);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
    if (!data) return <div className="p-10 text-center text-white">Organization not found</div>;

    const teacherPercent = (data.teachers / data.max_teachers) * 100;
    const studentPercent = (data.students / data.max_students) * 100;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white">
            {/* Header */}
            <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 to-[#0A0A0B] z-10" />
                <div className="absolute top-12 left-5 z-20">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="absolute bottom-6 left-5 right-5 z-20 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <Building2 size={32} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{data.name}</h1>
                        <p className="text-xs text-gray-400">Organization Dashboard</p>
                    </div>
                </div>
            </div>

            <div className="px-5 space-y-6 mt-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 bg-[#141416] border-[#27272A]">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-indigo-400" />
                            <span className="text-xs text-gray-500 uppercase font-bold">Teachers</span>
                        </div>
                        <p className="text-2xl font-bold">{data.teachers}/{data.max_teachers}</p>
                        <Progress value={teacherPercent} color="secondary" size="sm" className="mt-2" />
                    </Card>
                    <Card className="p-4 bg-[#141416] border-[#27272A]">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-green-400" />
                            <span className="text-xs text-gray-500 uppercase font-bold">Students</span>
                        </div>
                        <p className="text-2xl font-bold">{data.students}/{data.max_students}</p>
                        <Progress value={studentPercent} color="success" size="sm" className="mt-2" />
                    </Card>
                </div>

                <Card className="p-4 bg-[#141416] border-[#27272A] flex-row items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <BookOpen size={24} className="text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase font-bold">Active Classes</p>
                        <p className="text-xl font-bold">{data.classrooms}</p>
                    </div>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <h3 className="text-xs text-gray-500 uppercase font-bold tracking-widest">Management</h3>

                    <Card isPressable onPress={() => navigate(`/m/org/${slug}/members`)} className="p-4 bg-[#141416] border-[#27272A] flex-row items-center gap-4">
                        <Users size={20} className="text-blue-400" />
                        <span className="flex-1 font-bold text-sm">Manage Members</span>
                        <ChevronLeft size={18} className="text-gray-600 rotate-180" />
                    </Card>

                    <Card isPressable onPress={() => navigate(`/m/org/${slug}/invite`)} className="p-4 bg-[#141416] border-[#27272A] flex-row items-center gap-4">
                        <UserPlus size={20} className="text-green-400" />
                        <span className="flex-1 font-bold text-sm">Invite Members</span>
                        <ChevronLeft size={18} className="text-gray-600 rotate-180" />
                    </Card>

                    <Card isPressable onPress={() => navigate(`/m/org/${slug}/analytics`)} className="p-4 bg-[#141416] border-[#27272A] flex-row items-center gap-4">
                        <BarChart3 size={20} className="text-purple-400" />
                        <span className="flex-1 font-bold text-sm">Analytics</span>
                        <ChevronLeft size={18} className="text-gray-600 rotate-180" />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MobileOrgDashboard;
