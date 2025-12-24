import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, BookOpen, Settings, MoreVertical, Plus, Video, Clock, ChevronRight, Copy } from 'lucide-react';
import { Button, Tabs, Tab, Card, Avatar, AvatarGroup, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { getClassroom, getClassroomSessions, getAssignments } from '../api';

const ClassroomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [classRes, sessRes, assignRes] = await Promise.all([
                getClassroom(id),
                getClassroomSessions(id),
                getAssignments({ classroom: id }) // Assuming API supports filter
            ]);
            setClassroom(classRes.data);
            setSessions(sessRes.data);
            setAssignments(assignRes.data); // Placeholder if API doesn't return
        } catch (err) {
            console.error("Failed to load classroom data", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!classroom) return <div className="p-10 text-center">Classroom not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Hero Header */}
            <div className="h-64 bg-slate-900 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-8 relative z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-5xl font-black text-white mb-2">{classroom.name}</h1>
                            <div className="flex items-center gap-4 text-indigo-100">
                                <span className="font-bold">{classroom.language_name || 'English'}</span>
                                <span>•</span>
                                <span>{classroom.level || 'Intermediate'}</span>
                                <div className="px-3 py-1 rounded bg-white/10 backdrop-blur border border-white/20 text-xs font-mono flex items-center gap-2 cursor-pointer hover:bg-white/20 transition-colors" onClick={() => navigator.clipboard.writeText(classroom.invite_code)}>
                                    Code: {classroom.invite_code} <Copy size={12} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button isIconOnly variant="flat" className="bg-white/10 text-white"><Settings size={20} /></Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Tabs
                    variant="underlined"
                    color="primary"
                    classNames={{
                        tabList: "gap-6 mb-8 border-b border-slate-200 w-full",
                        cursor: "w-full bg-indigo-600 h-1",
                        tabContent: "group-data-[selected=true]:text-indigo-600 font-bold text-lg"
                    }}
                >
                    <Tab key="stream" title="Overview">
                        <div className="grid grid-cols-12 gap-8">
                            {/* Feed */}
                            <div className="col-span-8 space-y-6">
                                <Card className="p-6 bg-white shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors" onPress={() => navigate(`/classroom/${id}/schedule`)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Video size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">Schedule a Live Session</div>
                                            <div className="text-sm text-slate-500">Plan a video class or in-person meetup</div>
                                        </div>
                                    </div>
                                    <Button size="sm" color="primary" variant="flat">Start</Button>
                                </Card>

                                {/* Placeholder for Activity Feed updates */}
                                <div className="text-center py-20 text-slate-400">
                                    <div className="inline-block p-4 rounded-full bg-slate-100 mb-4"><BookOpen size={24} /></div>
                                    <p>No recent activity updates.</p>
                                </div>
                            </div>

                            {/* Updates Sidebar */}
                            <div className="col-span-4 space-y-6">
                                <Card className="p-6 bg-white shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-900 mb-4">Upcoming</h3>
                                    <div className="text-sm text-slate-500">No work due soon</div>
                                    <Button className="w-full mt-4 font-bold" variant="light" color="primary">View All</Button>
                                </Card>
                            </div>
                        </div>
                    </Tab>

                    <Tab key="people" title="People">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-indigo-600">Teachers</h2>
                                <Button isIconOnly variant="light"><Plus size={20} /></Button>
                            </div>
                            <Card className="p-4 bg-white border border-slate-100 flex items-center gap-4">
                                <Avatar src={classroom.teacher?.avatar || `https://i.pravatar.cc/150?u=${classroom.teacher?.id}`} size="lg" />
                                <div className="font-bold text-lg">{classroom.teacher?.username || 'Teacher'}</div>
                            </Card>

                            <div className="flex justify-between items-center mt-12 mb-6 border-b border-indigo-600 pb-2">
                                <h2 className="text-2xl font-bold text-indigo-600">Students</h2>
                                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                    {classroom.students?.length || 0} Students
                                    <Button isIconOnly variant="light"><Plus size={20} /></Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {classroom.students?.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border-b border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <Avatar src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} />
                                            <span className="font-medium text-slate-900">{s.username}</span>
                                        </div>
                                        <Button isIconOnly variant="light" size="sm"><MoreVertical size={16} /></Button>
                                    </div>
                                ))}
                                {(!classroom.students || classroom.students.length === 0) && (
                                    <div className="p-8 text-center text-slate-400">No students enrolled yet. share the invite code!</div>
                                )}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="sessions" title="Sessions">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Live Sessions</h2>
                            <Button
                                color="primary"
                                className="font-bold shadow-lg shadow-indigo-500/20"
                                startContent={<Plus size={18} />}
                                onPress={() => navigate(`/classroom/${id}/schedule`)}
                            >
                                Schedule Session
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sessions.map((session) => (
                                <Card
                                    key={session.id}
                                    isPressable
                                    onPress={() => navigate(`/session/${session.id}`)}
                                    className="border border-slate-200 hover:border-indigo-500 transition-colors shadow-sm hover:shadow-md"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <Chip
                                                size="sm"
                                                color={session.status === 'live' ? 'success' : session.status === 'completed' ? 'default' : 'primary'}
                                                variant="flat"
                                                className="font-bold"
                                            >
                                                {session.status === 'live' ? '● LIVE' : session.status.toUpperCase()}
                                            </Chip>
                                            <div className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                                                {session.session_type}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{session.title}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{session.description}</p>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium border-t border-slate-100 pt-4">
                                            <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(session.scheduled_at).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-1"><Clock size={14} /> {session.duration_minutes}m</div>
                                            <div className="flex items-center gap-1"><Users size={14} /> {session.attendance?.length || 0}</div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {sessions.length === 0 && (
                                <div className="col-span-2 text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Video size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">No sessions scheduled.</p>
                                    <Button variant="light" color="primary" className="mt-2" onPress={() => navigate(`/classroom/${id}/schedule`)}>Create your first session</Button>
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
};

export default ClassroomDetail;
