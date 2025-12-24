import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft, FileText, UserPlus, CheckCircle,
    Clock, RefreshCw, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRecentActivity } from '../../api';

const ActivityItem = ({ item }) => {
    const getIcon = () => {
        switch (item.type) {
            case 'submission':
                return <FileText size={18} className="text-green-400" />;
            case 'join':
                return <UserPlus size={18} className="text-blue-400" />;
            case 'grade':
                return <CheckCircle size={18} className="text-purple-400" />;
            default:
                return <BookOpen size={18} className="text-gray-400" />;
        }
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-4 bg-[#1C1C1F] rounded-xl border border-[#27272A]"
        >
            <div className="p-2 bg-[#27272A] rounded-full">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                    <span className="font-medium">{item.student_name}</span>
                    {' '}
                    <span className="text-gray-400">{item.details}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-indigo-400">{item.classroom}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {getTimeAgo(item.timestamp)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const MobileActivityFeed = () => {
    const navigate = useNavigate();
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadActivity();
    }, []);

    const loadActivity = async () => {
        try {
            const res = await getRecentActivity();
            setActivity(res.data);
        } catch (error) {
            console.error('Failed to load activity:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadActivity();
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0B] z-10 p-4 border-b border-[#27272A] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-[#1C1C1F] rounded-lg">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="font-bold text-lg">Recent Activity</h1>
                </div>
                <button
                    onClick={handleRefresh}
                    className={`p-2 bg-[#1C1C1F] rounded-lg ${refreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={18} className="text-gray-400" />
                </button>
            </div>

            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activity.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">No recent activity</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Student submissions and joins will appear here
                        </p>
                    </div>
                ) : (
                    activity.map((item, idx) => (
                        <ActivityItem key={idx} item={item} />
                    ))
                )}
            </div>
        </div>
    );
};

export default MobileActivityFeed;
