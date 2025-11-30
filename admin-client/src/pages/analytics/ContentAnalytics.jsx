/**
 * Content Analytics Dashboard - Upgraded with shadcn/ui & Recharts
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileText, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { fadeIn, slideUp } from '../../utils/animations';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ContentAnalytics() {
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

            const response = await axios.get('http://localhost:8000/api/admin/analytics/content/', {
                headers: { Authorization: `Token ${token}` }
            });
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch content analytics', err);
            setError('Failed to load content analytics');
            showToast('Failed to load content analytics', 'error');
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

    const chartData = data?.content_by_type?.map(item => ({
        name: item.type,
        value: item.count
    })) || [];

    return (
        <motion.div
            className="p-8 space-y-8"
            variants={fadeIn}
            initial="initial"
            animate="animate"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Analytics</h1>
                    <p className="text-muted-foreground mt-1">Overview of vocabulary and generated content.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {loading ? (
                    <>
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                    </>
                ) : (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
                                <FileText className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{data.total_content || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Generated articles & stories</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Vocabulary</CardTitle>
                                <BookOpen className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{data.total_vocabulary || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Words in database</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <motion.div variants={slideUp} custom={1}>
                <Card className="h-[500px]">
                    <CardHeader>
                        <CardTitle>Content Distribution</CardTitle>
                        <CardDescription>Breakdown by content type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[400px] w-full" />
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                                <FileText className="w-12 h-12 mb-4 opacity-20" />
                                <p>No content distribution data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
