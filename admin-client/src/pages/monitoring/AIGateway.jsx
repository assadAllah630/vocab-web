/**
 * AI Gateway Dashboard - Model-Centric View (v2.0)
 * 
 * Beautiful visualization of AI model health, quotas, and intelligent selection.
 * Uses shadcn-style components, Recharts, and Framer Motion.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import { Progress } from '../../components/ui/Progress';
import {
    Zap, Brain, Shield, AlertTriangle, CheckCircle2, XCircle,
    Clock, Activity, Sparkles, TrendingUp, RefreshCw, Server
} from 'lucide-react';
import api from '../../api';

const COLORS = {
    healthy: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    blocked: '#6b7280',
    info: '#3b82f6',
    purple: '#8b5cf6',
    gradient: ['#3b82f6', '#8b5cf6', '#10b981'],
};

const PROVIDER_COLORS = {
    gemini: '#4285f4',
    openrouter: '#8b5cf6',
    groq: '#f97316',
    huggingface: '#fcd34d',
    cohere: '#14b8a6',
    deepinfra: '#ec4899',
    pollinations: '#22c55e',
};

export default function AIGateway() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = async () => {
        try {
            setRefreshing(true);
            const response = await api.get('/ai-gateway/dashboard/');
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        // Refresh every 30 seconds
        const interval = setInterval(fetchDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const { summary, quota_status, reset_times, providers, models, failures } = data;

    // Health pie chart data
    const healthPieData = [
        { name: 'Healthy', value: models?.healthy || 0, color: COLORS.healthy },
        { name: 'Degraded', value: models?.degraded || 0, color: COLORS.warning },
        { name: 'Blocked', value: models?.blocked || 0, color: COLORS.blocked },
    ].filter(d => d.value > 0);

    // Failure by type chart data
    const failureChartData = (failures?.by_type || []).map(f => ({
        name: f.error_type.replace('_', ' '),
        count: f.count,
        color: f.error_type === 'QUOTA_EXCEEDED' ? COLORS.warning :
            f.error_type === 'RATE_LIMITED' ? COLORS.info :
                f.error_type === 'INVALID_KEY' ? COLORS.danger : COLORS.blocked
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Brain className="w-10 h-10 text-indigo-600" />
                            AI Gateway
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Intelligent model selection • 99%+ accuracy
                        </p>
                    </div>
                    <button
                        onClick={fetchDashboard}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </motion.div>

                {/* Status Alert */}
                {quota_status?.status !== 'ok' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Alert variant={quota_status.status === 'critical' ? 'destructive' : 'warning'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>{quota_status.status === 'critical' ? 'Critical' : 'Warning'}</AlertTitle>
                            <AlertDescription>{quota_status.message}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <StatsCard
                        title="Model Health"
                        value={`${models?.avg_health || 100}%`}
                        icon={Shield}
                        color={models?.avg_health >= 80 ? 'green' : models?.avg_health >= 50 ? 'yellow' : 'red'}
                        subtitle={`${models?.healthy || 0} healthy models`}
                    />
                    <StatsCard
                        title="Daily Remaining"
                        value={summary?.remaining_today?.toLocaleString() || 0}
                        icon={Zap}
                        color="blue"
                        subtitle={`${summary?.usage_percent || 0}% used`}
                    />
                    <StatsCard
                        title="Active Models"
                        value={models?.total || 0}
                        icon={Sparkles}
                        color="purple"
                        subtitle={`${models?.blocked || 0} blocked`}
                    />
                    <StatsCard
                        title="Next Reset"
                        value={`${reset_times?.next_daily_reset_hours || 0}h`}
                        icon={Clock}
                        color="indigo"
                        subtitle="until quota reset"
                    />
                </motion.div>

                <Tabs defaultValue="models" className="space-y-6">
                    <TabsList className="bg-white dark:bg-slate-800 shadow-sm">
                        <TabsTrigger value="models">Models</TabsTrigger>
                        <TabsTrigger value="providers">Providers</TabsTrigger>
                        <TabsTrigger value="health">Health</TabsTrigger>
                        <TabsTrigger value="failures">Failures</TabsTrigger>
                    </TabsList>

                    {/* MODELS TAB */}
                    <TabsContent value="models" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Models by Confidence */}
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        Top Models by Confidence
                                    </CardTitle>
                                    <CardDescription>Ranked by intelligent selection score</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(models?.top_models || []).slice(0, 6).map((model, idx) => (
                                            <motion.div
                                                key={model.model_id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: PROVIDER_COLORS[model.provider] || '#6b7280' }}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                            {model.display_name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {model.provider} • {model.quality_tier}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={model.is_text ? 'default' : 'secondary'}>
                                                        {model.is_text ? 'Text' : 'Image'}
                                                    </Badge>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-indigo-600">
                                                            {(model.confidence_score * 100).toFixed(1)}%
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {model.remaining_daily}/{model.daily_quota}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Blocked Models */}
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20">
                                    <CardTitle className="flex items-center gap-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        Blocked Models
                                    </CardTitle>
                                    <CardDescription>Temporarily unavailable</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {(models?.blocked_list || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                                            <p className="text-slate-600 dark:text-slate-400">
                                                All models healthy!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {models.blocked_list.map((model, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                            {model.model_id}
                                                        </p>
                                                        <p className="text-xs text-red-600">
                                                            {model.block_reason}
                                                        </p>
                                                    </div>
                                                    {model.block_until && (
                                                        <Badge variant="destructive">
                                                            Until {new Date(model.block_until).toLocaleTimeString()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* PROVIDERS TAB */}
                    <TabsContent value="providers" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(providers || []).map((provider, idx) => (
                                <motion.div
                                    key={provider.name}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="overflow-hidden hover:shadow-lg transition-all">
                                        <CardHeader
                                            className="pb-2"
                                            style={{
                                                background: `linear-gradient(135deg, ${PROVIDER_COLORS[provider.name?.toLowerCase()] || '#6b7280'}20, transparent)`
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: PROVIDER_COLORS[provider.name?.toLowerCase()] || '#6b7280' }}
                                                    />
                                                    {provider.name}
                                                </CardTitle>
                                                <Badge variant={provider.usage_percent < 80 ? 'success' : provider.usage_percent < 95 ? 'warning' : 'destructive'}>
                                                    {provider.usage_percent}%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <Progress value={provider.usage_percent} className="h-2" />
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-slate-500">Remaining</p>
                                                        <p className="font-bold">{provider.remaining_today?.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500">Health</p>
                                                        <p className="font-bold text-green-600">{provider.avg_health}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* HEALTH TAB */}
                    <TabsContent value="health" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Health Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-green-600" />
                                        Model Health Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={healthPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {healthPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-6 mt-4">
                                        {healthPieData.map((item) => (
                                            <div key={item.name} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-sm">{item.name}: {item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Health Score Radial */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Overall Health Score</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <div className="h-48 w-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                cx="50%" cy="50%"
                                                innerRadius="60%" outerRadius="100%"
                                                barSize={20}
                                                data={[{ value: models?.avg_health || 100, fill: COLORS.healthy }]}
                                                startAngle={90} endAngle={-270}
                                            >
                                                <RadialBar
                                                    minAngle={15}
                                                    background={{ fill: '#e2e8f0' }}
                                                    clockWise
                                                    dataKey="value"
                                                    cornerRadius={10}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-4xl font-bold text-green-600 -mt-24">
                                        {models?.avg_health || 100}%
                                    </p>
                                    <p className="text-slate-500 mt-2">Average Health Score</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* FAILURES TAB */}
                    <TabsContent value="failures" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Failures by Type Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        Failures by Type (24h)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {failureChartData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                                            <p className="text-lg font-medium text-slate-900 dark:text-white">No failures!</p>
                                            <p className="text-slate-500">All models performing well</p>
                                        </div>
                                    ) : (
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={failureChartData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" />
                                                    <YAxis dataKey="name" type="category" width={120} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                        {failureChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Failures List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Failures</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(failures?.recent || []).length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            No recent failures
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {failures.recent.map((fail, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{fail.model_id}</p>
                                                        <p className="text-xs text-slate-500 truncate">{fail.error_message}</p>
                                                    </div>
                                                    <div className="ml-3 flex flex-col items-end">
                                                        <Badge variant={
                                                            fail.error_type === 'QUOTA_EXCEEDED' ? 'warning' :
                                                                fail.error_type === 'RATE_LIMITED' ? 'secondary' : 'destructive'
                                                        }>
                                                            {fail.error_type}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 mt-1">
                                                            {new Date(fail.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color, subtitle }) {
    const colorClasses = {
        green: 'from-green-500/10 to-emerald-500/10 text-green-600',
        blue: 'from-blue-500/10 to-cyan-500/10 text-blue-600',
        purple: 'from-purple-500/10 to-pink-500/10 text-purple-600',
        indigo: 'from-indigo-500/10 to-violet-500/10 text-indigo-600',
        yellow: 'from-yellow-500/10 to-amber-500/10 text-yellow-600',
        red: 'from-red-500/10 to-rose-500/10 text-red-600',
    };

    return (
        <Card className={`overflow-hidden bg-gradient-to-br ${colorClasses[color]} border-0`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
                        <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
                        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                    </div>
                    <Icon className="w-10 h-10 opacity-60" />
                </div>
            </CardContent>
        </Card>
    );
}
