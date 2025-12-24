import { useState, useEffect } from 'react';
import {
    ClipboardDocumentListIcon,
    UserPlusIcon,
    AcademicCapIcon,
    UsersIcon,
    ClockIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { formatDistanceToNow } from 'date-fns';

export default function AdminGlobalActivity() {
    const { showToast } = useToast();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivity();
        const interval = setInterval(loadActivity, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const loadActivity = async () => {
        try {
            const res = await api.get('/api/admin/activity/');
            setActivities(res.data);
        } catch (err) {
            showToast('Failed to load activity feed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'submission': return <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-500" />;
            case 'join': return <UserPlusIcon className="h-5 w-5 text-emerald-500" />;
            default: return <ClockIcon className="h-5 w-5 text-slate-400" />;
        }
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Activity</h1>
                    <p className="text-slate-500 mt-1">Real-time feed of educational actions across the platform</p>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                    Live Updates Active
                </Badge>
            </div>

            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ClockIcon className="h-5 w-5 text-primary" />
                        Recent Action Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activities.map((activity, idx) => (
                            <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex gap-4 items-start">
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                        {getIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {activity.user_name}
                                            </p>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {activity.action} <span className="font-medium text-slate-900 dark:text-white">{activity.subject}</span>
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                                {activity.context}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="h-4 w-4 text-slate-300 self-center" />
                                </div>
                            </div>
                        ))}

                        {activities.length === 0 && (
                            <div className="p-12 text-center">
                                <p className="text-slate-500 italic">No recent activity recorded</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
