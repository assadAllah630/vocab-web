/**
 * Dashboard - Official shadcn/ui Overview Layout
 * Replicating the exact structure and design of the official example
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Avatar } from '../components/ui/Avatar';
import { Users, Activity, BookOpen, Sparkles, Download } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [userGrowth, setUserGrowth] = useState(null);
    const [aiStats, setAiStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { Authorization: `Token ${token}` };

            const [statsRes, growthRes, aiRes] = await Promise.all([
                axios.get('http://localhost:8000/api/admin/analytics/dashboard/', { headers }),
                axios.get('http://localhost:8000/api/admin/analytics/users/?days=30', { headers }),
                axios.get('http://localhost:8000/api/admin/analytics/ai/', { headers })
            ]);

            setStats(statsRes.data);
            setUserGrowth(growthRes.data);
            setAiStats(aiRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    // Transform data for the Bar Chart
    const chartData = userGrowth?.daily_signups?.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: item.count
    })) || [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 bg-white dark:bg-slate-950 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <DateRangePicker />
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics" disabled>Analytics</TabsTrigger>
                    <TabsTrigger value="reports" disabled>Reports</TabsTrigger>
                    <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Users
                                </CardTitle>
                                <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Total registered users
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Today
                                </CardTitle>
                                <Activity className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.active_users_today || 0}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Users active in last 24h
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vocabulary</CardTitle>
                                <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.total_vocabulary || 0}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Total words added
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    AI Content
                                </CardTitle>
                                <Sparkles className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {aiStats?.content_generated || 0}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Stories & conversations
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>User Growth</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={chartData}>
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="#0f172a" // slate-900
                                            radius={[4, 4, 0, 0]}
                                            className="fill-slate-900 dark:fill-slate-50"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest actions across the platform.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {stats?.recent_activity?.slice(0, 5).map((activity, index) => (
                                        <div key={index} className="flex items-center">
                                            <Avatar className="h-9 w-9">
                                                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs">
                                                    {activity.user?.substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                            </Avatar>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {activity.user || 'Unknown User'}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {activity.action}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs text-slate-500">
                                                {activity.time ? new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    )) || (
                                            <p className="text-sm text-slate-500">No recent activity</p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
