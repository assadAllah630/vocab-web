import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, BookOpen, Settings, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Avatar } from '../ui/Avatar';

const activities = [
    { id: 1, type: 'user_signup', user: 'Alice Smith', action: 'signed up', time: new Date(Date.now() - 1000 * 60 * 5) },
    { id: 2, type: 'vocab_added', user: 'Bob Jones', action: 'added 50 new words', time: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 3, type: 'system_alert', user: 'System', action: 'High CPU usage detected', time: new Date(Date.now() - 1000 * 60 * 60) },
    { id: 4, type: 'user_login', user: 'Charlie Brown', action: 'logged in', time: new Date(Date.now() - 1000 * 60 * 120) },
    { id: 5, type: 'settings_change', user: 'Admin', action: 'updated AI settings', time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
];

const getActivityIcon = (type) => {
    switch (type) {
        case 'user_signup': return <User className="w-4 h-4 text-blue-500" />;
        case 'vocab_added': return <BookOpen className="w-4 h-4 text-green-500" />;
        case 'system_alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
        case 'settings_change': return <Settings className="w-4 h-4 text-gray-500" />;
        default: return <User className="w-4 h-4 text-gray-500" />;
    }
};

export function ActivityFeed({ activities = [] }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {activities.length === 0 ? (
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No recent activity</p>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex gap-4">
                                <div className="relative mt-1">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <span className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                                            {activity.user}
                                        </p>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                        {activity.action}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
