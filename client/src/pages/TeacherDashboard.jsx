import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, MessageSquare, Bell, Calendar, ChevronRight, GraduationCap, TrendingUp, Clock, Activity, Settings } from 'lucide-react';
import { Button, Card, Avatar, AvatarGroup, Progress, Chip } from '@heroui/react';
import { getMyClassrooms, getDashboardOverview, getRecentActivity } from '../api';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [classesRes, statsRes, activityRes] = await Promise.all([
                getMyClassrooms(),
                getDashboardOverview(),
                getRecentActivity()
            ]);
            setClassrooms(classesRes.data);
            setStats(statsRes.data);
            setActivity(activityRes.data);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Teacher Command Center
                        </h1>
                        <p className="text-sm text-slate-500">Welcome back, {user.username}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            className="bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20"
                            startContent={<Plus size={18} />}
                            onPress={() => navigate('/classroom/create')}
                        >
                            New Classroom
                        </Button>
                        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 relative">
                            <Bell size={20} />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <Avatar src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`} size="sm" isBordered color="primary" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
                {/* Main Content (Cols 1-8) */}
                <div className="col-span-8 space-y-8">

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow bg-white items-start">
                            <div className="flex items-center gap-3 mb-2 text-indigo-500">
                                <Users size={20} />
                                <span className="font-bold text-xs uppercase tracking-wider">Total Students</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900">{stats?.total_students || 0}</div>
                            <div className="text-sm text-green-500 font-medium flex items-center gap-1 mt-1">
                                <TrendingUp size={14} /> +12% this month
                            </div>
                        </Card>
                        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow bg-white items-start">
                            <div className="flex items-center gap-3 mb-2 text-pink-500">
                                <BookOpen size={20} />
                                <span className="font-bold text-xs uppercase tracking-wider">Active Assignments</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900">{stats?.active_assignments || 0}</div>
                            <div className="text-sm text-slate-400 font-medium mt-1">
                                85% completion rate
                            </div>
                        </Card>
                        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow bg-white items-start">
                            <div className="flex items-center gap-3 mb-2 text-amber-500">
                                <Clock size={20} />
                                <span className="font-bold text-xs uppercase tracking-wider">Teaching Hours</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900">{Math.floor((stats?.total_session_minutes || 0) / 60)}h</div>
                            <div className="text-sm text-slate-400 font-medium mt-1">
                                {(stats?.total_session_minutes || 0) % 60}m this week
                            </div>
                        </Card>
                    </div>

                    {/* Classrooms Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <GraduationCap size={24} className="text-indigo-600" />
                                Your Classrooms
                            </h2>
                            <Button size="sm" variant="light" color="primary" onPress={() => navigate('/teacher/classes')}>View All</Button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {classrooms.map((c) => (
                                <motion.div key={c.id} whileHover={{ y: -4 }}>
                                    <div
                                        className="bg-white rounded-2xl p-0 overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 cursor-pointer group"
                                        onClick={() => navigate(`/classroom/${c.id}`)}
                                    >
                                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative p-6">
                                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-bold">
                                                {c.student_count} Students
                                            </div>
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                            <div className="relative z-10 pt-4">
                                                <h3 className="text-2xl font-black text-white">{c.name}</h3>
                                                <p className="text-indigo-100 font-medium">{c.language_name || 'English'}</p>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map(i => (
                                                        <Avatar key={i} size="sm" className="w-8 h-8 border-2 border-white" src={`https://i.pravatar.cc/150?u=${c.id * 10 + i}`} />
                                                    ))}
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        +{c.student_count > 3 ? c.student_count - 3 : 0}
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                    <span>Progression</span>
                                                    <span>72%</span>
                                                </div>
                                                <Progress value={72} color="primary" size="sm" className="h-2" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {/* Create New Card */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/classroom/create')}
                                    className="h-full min-h-[250px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer text-slate-400 hover:text-indigo-500"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                                        <Plus size={32} />
                                    </div>
                                    <span className="font-bold">Create New Classroom</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Cols 9-12) */}
                <div className="col-span-4 space-y-8">

                    {/* Upcoming Sessions */}
                    <Card className="p-6 bg-white shadow-sm border-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-500" />
                                Upcoming
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {/* Placeholder data - functionality would hook into detailed schedule */}
                            <div className="flex gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                                <div className="flex flex-col items-center justify-center w-12 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <span className="text-xs font-bold text-red-500 uppercase">Today</span>
                                    <span className="text-lg font-black text-slate-900">14</span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Advanced Speaking</div>
                                    <div className="text-xs text-slate-500">Senior Class A • 2:00 PM</div>
                                </div>
                            </div>
                            <div className="flex gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                                <div className="flex flex-col items-center justify-center w-12 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Dec</span>
                                    <span className="text-lg font-black text-slate-900">15</span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">Grammar Review</div>
                                    <div className="text-xs text-slate-500">Junior Class B • 10:00 AM</div>
                                </div>
                            </div>
                            <Button className="w-full font-bold bg-slate-100 text-slate-600" variant="flat">View Calendar</Button>
                        </div>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="p-6 bg-white shadow-sm border-none">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Activity size={18} className="text-orange-500" />
                                Live Activity
                            </h3>
                        </div>
                        <div className="space-y-6 relative">
                            {/* Timeline Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-100" />

                            {activity.slice(0, 5).map((act, i) => (
                                <div key={i} className="flex gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shrink-0">
                                        <Avatar src={act.avatar} size="xs" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            <span className="font-bold">{act.user_name}</span> {act.action} <span className="font-bold text-indigo-600">{act.target}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
