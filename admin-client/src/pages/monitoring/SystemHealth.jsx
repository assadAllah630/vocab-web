/**
 * System Health - Upgraded with shadcn/ui and Recharts
 * Features: Real-time metrics, Historical trends, Configurable alerts
 */
import { useState, useEffect } from 'react';
import {
    RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Slider } from '../../components/ui/Slider';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import { Activity, Cpu, HardDrive, MemoryStick, Clock, Server, AlertTriangle, Settings } from 'lucide-react';

const COLORS = {
    good: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
};

export default function SystemHealth() {
    const { metrics, history, loading, error } = useSystemHealth();

    // Alert Thresholds State (persisted in localStorage could be a future enhancement)
    const [thresholds, setThresholds] = useState({
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 }
    });

    const getStatusColor = (value, type) => {
        if (value >= thresholds[type].critical) return COLORS.danger;
        if (value >= thresholds[type].warning) return COLORS.warning;
        return COLORS.good;
    };

    const getStatusText = (value, type) => {
        if (value >= thresholds[type].critical) return 'Critical';
        if (value >= thresholds[type].warning) return 'Warning';
        return 'Healthy';
    };

    // Format uptime
    const formatUptime = (seconds) => {
        if (!seconds) return 'N/A';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    // Generate active alerts
    const activeAlerts = [];
    if (metrics.cpu >= thresholds.cpu.warning) {
        activeAlerts.push({
            type: 'cpu',
            level: metrics.cpu >= thresholds.cpu.critical ? 'critical' : 'warning',
            message: `High CPU Usage: ${metrics.cpu.toFixed(1)}%`
        });
    }
    if (metrics.memory >= thresholds.memory.warning) {
        activeAlerts.push({
            type: 'memory',
            level: metrics.memory >= thresholds.memory.critical ? 'critical' : 'warning',
            message: `High Memory Usage: ${metrics.memory.toFixed(1)}%`
        });
    }
    if (metrics.disk >= thresholds.disk.warning) {
        activeAlerts.push({
            type: 'disk',
            level: metrics.disk >= thresholds.disk.critical ? 'critical' : 'warning',
            message: `High Disk Usage: ${metrics.disk.toFixed(1)}%`
        });
    }

    // Radial chart data helpers
    const getRadialData = (name, value, type) => [{
        name,
        value: value || 0,
        fill: getStatusColor(value || 0, type)
    }];

    // Metric Card Component
    const MetricCard = ({ title, value, icon: Icon, type, unit = '%', additionalInfo }) => (
        <Card className="overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: getStatusColor(value, type) }} />
                        {title}
                    </CardTitle>
                    <Badge variant={value < thresholds[type].warning ? 'success' : value < thresholds[type].critical ? 'warning' : 'destructive'}>
                        {getStatusText(value, type)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                        <ResponsiveContainer width={120} height={120}>
                            <RadialBarChart
                                cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
                                barSize={12} data={getRadialData(title, value, type)}
                                startAngle={90} endAngle={-270}
                            >
                                <RadialBar minAngle={15} background={{ fill: '#e2e8f0' }} clockWise dataKey="value" cornerRadius={10} />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-slate-900 dark:fill-white">
                                    {value?.toFixed(1)}{unit}
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                    {additionalInfo && (
                        <div className="flex-1 ml-4 space-y-1">
                            {additionalInfo.map((info, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                    <span className="text-slate-600 dark:text-slate-400">{info.label}:</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{info.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    if (loading && !metrics.uptime) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)}
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
                    <AlertDescription>Failed to load system metrics: {error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
                            <Server className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            System Health
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Real-time server monitoring & alerts</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Live</span>
                    </div>
                </div>

                {/* Active Alerts */}
                {activeAlerts.length > 0 && (
                    <div className="space-y-2">
                        {activeAlerts.map((alert, idx) => (
                            <Alert key={idx} variant={alert.level === 'critical' ? 'destructive' : 'warning'}>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{alert.level === 'critical' ? 'Critical Alert' : 'Warning'}</AlertTitle>
                                <AlertDescription>{alert.message}</AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard
                                title="CPU Usage" value={metrics.cpu} icon={Cpu} type="cpu"
                            />
                            <MetricCard
                                title="Memory Usage" value={metrics.memory} icon={MemoryStick} type="memory"
                                additionalInfo={[
                                    { label: 'Used', value: `${metrics.memory_used_gb?.toFixed(2) || 0} GB` },
                                    { label: 'Total', value: `${metrics.memory_total_gb?.toFixed(2) || 0} GB` }
                                ]}
                            />
                            <MetricCard
                                title="Disk Usage" value={metrics.disk} icon={HardDrive} type="disk"
                                additionalInfo={[
                                    { label: 'Used', value: `${metrics.disk_used_gb?.toFixed(2) || 0} GB` },
                                    { label: 'Total', value: `${metrics.disk_total_gb?.toFixed(2) || 0} GB` }
                                ]}
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    System Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Server Uptime</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatUptime(metrics.uptime)}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Last Updated</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {metrics.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance History (Last 5 Minutes)</CardTitle>
                                <CardDescription>Real-time trend of CPU and Memory usage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history}>
                                            <defs>
                                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                className="text-xs"
                                            />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip
                                                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                                            <Area type="monotone" dataKey="memory" name="Memory %" stroke="#10b981" fillOpacity={1} fill="url(#colorMem)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Alert Thresholds
                                </CardTitle>
                                <CardDescription>Configure when to trigger warning and critical alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {['cpu', 'memory', 'disk'].map((type) => (
                                    <div key={type} className="space-y-4">
                                        <h3 className="text-lg font-medium capitalize">{type} Thresholds</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-yellow-600">Warning Threshold</span>
                                                    <span className="text-sm font-bold">{thresholds[type].warning}%</span>
                                                </div>
                                                <Slider
                                                    value={[thresholds[type].warning]}
                                                    max={100} step={1}
                                                    onValueChange={(val) => setThresholds(prev => ({
                                                        ...prev, [type]: { ...prev[type], warning: val[0] }
                                                    }))}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-red-600">Critical Threshold</span>
                                                    <span className="text-sm font-bold">{thresholds[type].critical}%</span>
                                                </div>
                                                <Slider
                                                    value={[thresholds[type].critical]}
                                                    max={100} step={1}
                                                    onValueChange={(val) => setThresholds(prev => ({
                                                        ...prev, [type]: { ...prev[type], critical: val[0] }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
