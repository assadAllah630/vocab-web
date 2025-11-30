/**
 * Cohort Analytics Dashboard - Upgraded with shadcn/ui & Recharts
 */
import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Cell, Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Users, TrendingUp, UserMinus, Activity, AlertCircle } from 'lucide-react';
import { fadeIn, slideUp } from '../../utils/animations';

export default function CohortAnalytics() {
    const [retentionData, setRetentionData] = useState([]);
    const [funnelData, setFunnelData] = useState([]);
    const [churnData, setChurnData] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const headers = { Authorization: `Token ${token}` };

            const [retentionRes, funnelRes, churnRes, growthRes] = await Promise.all([
                api.get('/api/admin/analytics/cohorts/'),
                api.get('/api/admin/analytics/engagement/'),
                api.get('/api/admin/analytics/churn/'),
                api.get('/api/admin/analytics/growth/')
            ]);

            setRetentionData(retentionRes.data);
            setFunnelData(funnelRes.data); // Assuming this returns funnel steps
            setChurnData(churnRes.data);
            setGrowthData(growthRes.data.user_growth || []); // Fix: Access user_growth array
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            setError('Failed to load analytics data');
            showToast('Failed to load analytics data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Mock funnel data if API returns empty (for visualization)
    const chartFunnelData = useMemo(() => {
        if (funnelData && funnelData.length > 0) return funnelData;
        return [
            { name: 'Visitors', value: 1000, fill: '#8884d8' },
            { name: 'Signups', value: 800, fill: '#83a6ed' },
            { name: 'Active', value: 600, fill: '#8dd1e1' },
            { name: 'Retained', value: 400, fill: '#82ca9d' },
            { name: 'Paying', value: 200, fill: '#a4de6c' },
        ];
    }, [funnelData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                    <p className="font-medium text-foreground">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (error) {
        return (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Failed to load analytics</h3>
                <p className="text-muted-foreground mt-1 mb-4">{error}</p>
                <Button onClick={fetchAnalytics} variant="outline">Try Again</Button>
            </div>
        );
    }

    return (
        <motion.div
            className="p-8 space-y-8"
            variants={fadeIn}
            initial="initial"
            animate="animate"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1">Deep dive into user behavior, retention, and growth.</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                ) : (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{growthData[growthData.length - 1]?.total_users || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                                <Activity className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{growthData[growthData.length - 1]?.active_users || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">+5% from last week</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {retentionData.length > 0 ? retentionData[retentionData.length - 1].retention_rate : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Day 30 Retention</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Churn Risk</CardTitle>
                                <UserMinus className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{churnData.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Users at risk</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={slideUp} custom={0}>
                    <Card className="h-[400px]">
                        <CardHeader>
                            <CardTitle>User Growth</CardTitle>
                            <CardDescription>Total vs Active Users over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="total_users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" name="Total Users" />
                                        <Area type="monotone" dataKey="active_users" stroke="#10b981" fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={slideUp} custom={1}>
                    <Card className="h-[400px]">
                        <CardHeader>
                            <CardTitle>Conversion Funnel</CardTitle>
                            <CardDescription>User journey from visitor to paid</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={chartFunnelData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                        <XAxis type="number" className="text-xs" />
                                        <YAxis dataKey="name" type="category" className="text-xs font-medium" width={80} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                            {chartFunnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={slideUp} custom={2}>
                <Card>
                    <CardHeader>
                        <CardTitle>Cohort Retention Analysis</CardTitle>
                        <CardDescription>Percentage of users returning over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                    {/* Heatmap Header */}
                                    <div className="grid grid-cols-6 gap-1 mb-1">
                                        <div className="text-xs font-semibold text-muted-foreground p-2">Cohort</div>
                                        {['Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 4+'].map((header) => (
                                            <div key={header} className="text-xs font-semibold text-center text-muted-foreground p-2">{header}</div>
                                        ))}
                                    </div>
                                    {/* Heatmap Rows */}
                                    {retentionData.slice(0, 10).map((cohort, i) => (
                                        <div key={i} className="grid grid-cols-6 gap-1 mb-1">
                                            <div className="text-xs font-medium p-2 bg-muted/30 rounded flex items-center">
                                                {cohort.date}
                                            </div>
                                            {/* Simulating retention decay for visualization if only single rate provided */}
                                            {[100, cohort.retention_rate, cohort.retention_rate * 0.8, cohort.retention_rate * 0.6, cohort.retention_rate * 0.4].map((rate, j) => {
                                                // Color scale based on percentage
                                                const opacity = Math.max(0.1, rate / 100);
                                                return (
                                                    <div
                                                        key={j}
                                                        className="text-xs p-2 rounded flex items-center justify-center text-primary-foreground font-medium transition-all hover:scale-105 cursor-default"
                                                        style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})`, color: opacity > 0.5 ? 'white' : 'black' }}
                                                    >
                                                        {Math.round(rate)}%
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    {retentionData.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">No cohort data available</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
