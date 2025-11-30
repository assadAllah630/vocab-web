/**
 * AI Analytics Dashboard - Upgraded with shadcn/ui & Recharts
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Bot, Zap, DollarSign, Activity, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fadeIn, slideUp } from '../../utils/animations';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export default function AIAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');

            if (!token) throw new Error('Not authenticated');

            const response = await axios.get('http://localhost:8000/api/admin/analytics/ai/', {
                headers: { Authorization: `Token ${token}` }
            });
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch AI analytics', err);
            setError('Failed to load AI analytics');
            showToast('Failed to load AI analytics', 'error');
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

    // Prepare chart data
    const usageData = data ? [
        { name: 'Vocab Enriched', value: data.vocab_enriched || 0 },
        { name: 'Content Generated', value: data.content_generated || 0 },
    ] : [];

    const performanceData = data ? [
        { name: 'Success', value: data.success_rate || 0, fill: '#10b981' },
        { name: 'Error', value: 100 - (data.success_rate || 0), fill: '#ef4444' },
    ] : [];

    return (
        <motion.div
            className="p-8 space-y-8"
            variants={fadeIn}
            initial="initial"
            animate="animate"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Usage & Costs</h1>
                    <p className="text-muted-foreground mt-1">Monitor AI provider performance and consumption.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                ) : (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                                <Bot className="h-4 w-4 text-violet-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.total_ai_requests || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Across all providers</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Est. Cost</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${(data.estimated_cost || 0).toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Current billing cycle</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Latency</CardTitle>
                                <Zap className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.avg_response_time || 0}s</div>
                                <p className="text-xs text-muted-foreground mt-1">Response time</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div variants={slideUp} custom={0}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Performance Metrics</CardTitle>
                            <CardDescription>Success rate and system reliability</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {loading ? (
                                <Skeleton className="h-[200px] w-full" />
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Success Rate
                                            </span>
                                            <span className="font-bold">{data.success_rate || 0}%</span>
                                        </div>
                                        <Progress value={data.success_rate || 0} className="h-2" />
                                    </div>

                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={performanceData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {performanceData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={slideUp} custom={1}>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Usage Breakdown</CardTitle>
                            <CardDescription>Distribution of AI tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : (
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={usageData} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                                {usageData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
