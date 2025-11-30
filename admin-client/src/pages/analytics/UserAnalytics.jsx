/**
 * User Analytics Dashboard - Upgraded with shadcn/ui & Recharts
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { fadeIn, slideUp } from '../../utils/animations';

export default function UserAnalytics() {
    const [data, setData] = useState(null);
    const [days, setDays] = useState("30");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [days]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const response = await axios.get(`http://localhost:8000/api/admin/analytics/users/?days=${days}`, {
                headers: { Authorization: `Token ${token}` }
            });
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch user analytics', err);
            setError('Failed to load user analytics');
            showToast('Failed to load user analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Failed to load analytics</h3>
                <p className="text-muted-foreground mt-1 mb-4">{error}</p>
                <Button onClick={fetchData} variant="outline">Try Again</Button>
            </div>
        );
    }

    // Transform data for Recharts if needed (assuming API returns arrays of values)
    // We need an array of objects: [{ date: '...', total: 10, active: 5 }]
    const chartData = data?.dates?.map((date, i) => ({
        date,
        total_users: data.total_users[i],
        active_users: data.active_users[i]
    })) || [];

    return (
        <motion.div
            className="p-8 space-y-8"
            variants={fadeIn}
            initial="initial"
            animate="animate"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">User Analytics</h1>
                    <p className="text-muted-foreground mt-1">Track user growth and daily activity.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={days} onValueChange={setDays}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div variants={slideUp} custom={0}>
                    <Card className="h-[400px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Total User Growth
                            </CardTitle>
                            <CardDescription>Cumulative registered users over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Area type="monotone" dataKey="total_users" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" name="Total Users" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={slideUp} custom={1}>
                    <Card className="h-[400px]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Daily Active Users
                            </CardTitle>
                            <CardDescription>Users who logged in or performed an action</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Line type="monotone" dataKey="active_users" stroke="#10b981" strokeWidth={2} dot={false} name="Active Users" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
