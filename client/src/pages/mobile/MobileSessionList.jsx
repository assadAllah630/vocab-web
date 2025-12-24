import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Clock, Users, ChevronRight, Plus, Calendar } from 'lucide-react';
import { Button, Card, Chip } from '@heroui/react';
import { getUpcomingSessions } from '../../api';

const MobileSessionList = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await getUpcomingSessions();
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === now.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const getSessionTypeIcon = (type) => {
        switch (type) {
            case 'video': return <Video size={16} className="text-blue-400" />;
            case 'audio': return <span className="text-green-400">🎧</span>;
            case 'in_person': return <span className="text-amber-400">🏫</span>;
            default: return <Video size={16} />;
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading Sessions...</div>;

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white p-5">
            <div className="flex items-center justify-between pt-8 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Live Sessions</h1>
                    <p className="text-xs text-gray-500">Upcoming classes</p>
                </div>
                <Button isIconOnly variant="flat" className="bg-indigo-500/20 text-indigo-400">
                    <Calendar size={20} />
                </Button>
            </div>

            {sessions.length === 0 ? (
                <div className="py-20 text-center text-gray-600">
                    <Calendar className="mx-auto mb-4 opacity-20" size={48} />
                    <p>No upcoming sessions</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((s, idx) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card
                                isPressable
                                onPress={() => navigate(`/m/session/${s.id}`)}
                                className="p-4 bg-[#141416] border-[#27272A] hover:border-indigo-500"
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        {getSessionTypeIcon(s.session_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Chip size="sm" variant="flat" color={s.status === 'live' ? 'success' : 'secondary'}>
                                                {s.status === 'live' ? '● Live' : formatDate(s.scheduled_at)}
                                            </Chip>
                                        </div>
                                        <h3 className="font-bold text-sm truncate">{s.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(s.scheduled_at)}</span>
                                            <span>{s.duration_minutes}min</span>
                                            <span className="flex items-center gap-1"><Users size={10} /> {s.attendance?.length || 0}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-700 self-center" />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MobileSessionList;
