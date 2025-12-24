import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import {
    Cpu, Key, Plus, Trash2, RefreshCw, Zap, Clock, AlertCircle,
    CheckCircle, Sparkles, TrendingUp, Shield, Settings, BarChart3, ChevronLeft, Lock
} from 'lucide-react';

/**
 * Mobile AI Gateway - Clean Tab-Based Design
 * 
 * 3 Simple Tabs:
 * 1. Overview - Simple usage stats for regular users
 * 2. Models - Model health and intelligent selection
 * 3. Keys - API key management (advanced)
 */
const MobileAIGateway = () => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [providers, setProviders] = useState([]);
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddKey, setShowAddKey] = useState(false);
    const [newKey, setNewKey] = useState({ provider: '', api_key: '', nickname: '', skip_validation: false });
    const [testingKey, setTestingKey] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        setError('');
        try {
            const [dashRes, provRes, keysRes] = await Promise.all([
                api.get('/ai-gateway/dashboard/'),
                api.get('/ai-gateway/providers/'),
                api.get('/ai-gateway/keys/')
            ]);
            setDashboard(dashRes.data || null);
            setProviders(provRes.data?.providers || []);
            setApiKeys(Array.isArray(keysRes.data?.keys) ? keysRes.data.keys : []);
        } catch (err) {
            console.error('AI Gateway error:', err);
            if (!isBackground) {
                setError(err.response?.data?.error || 'Failed to load');
            }
        }
        setLoading(false);
    };

    const addKey = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/ai-gateway/keys/', newKey);
            setSuccess('Key added!');
            setShowAddKey(false);
            setNewKey({ provider: '', api_key: '', nickname: '', skip_validation: false });
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add key');
        }
    };

    const testKey = async (keyId) => {
        setTestingKey(keyId);
        try {
            const res = await api.post(`/ai-gateway/keys/${keyId}/test/`);
            setSuccess(`Key healthy! ${res.data.latency_ms}ms`);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Key test failed');
        }
        setTestingKey(null);
    };

    const deleteKey = async (keyId) => {
        if (!window.confirm('Remove this key?')) return;
        try {
            await api.delete(`/ai-gateway/keys/${keyId}/`);
            loadData();
        } catch (err) {
            setError('Failed to delete key');
        }
    };

    const getHealthColor = (score) => {
        if (score >= 80) return '#22C55E';
        if (score >= 50) return '#F59E0B';
        return '#EF4444';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error && !dashboard) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: 'transparent' }}>
                <AlertCircle size={48} style={{ color: '#EF4444' }} className="mb-4" />
                <p className="text-lg font-medium mb-2" style={{ color: '#FAFAFA' }}>Connection Error</p>
                <p className="text-sm mb-6 text-center" style={{ color: '#71717A' }}>{error}</p>
                <button
                    onClick={loadData}
                    className="px-6 py-3 rounded-xl font-medium"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#FFFFFF' }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'models', label: 'Models', icon: Sparkles },
        { id: 'keys', label: 'Keys', icon: Key },
    ];

    return (
        <div className="min-h-screen pb-28" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div className="pt-14 pb-4 px-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                            <ChevronLeft size={24} style={{ color: '#71717A' }} />
                        </button>
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <Cpu size={20} style={{ color: '#FFFFFF' }} />
                        </div>
                        <h1 className="text-xl font-bold" style={{ color: '#FAFAFA' }}>AI Gateway</h1>
                    </div>
                    <button
                        onClick={loadData}
                        className="p-2.5 rounded-xl"
                        style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                    >
                        <RefreshCw size={18} style={{ color: '#71717A' }} />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#18181B' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                            style={{
                                backgroundColor: activeTab === tab.id ? '#6366F1' : 'transparent',
                                color: activeTab === tab.id ? '#FFFFFF' : '#71717A'
                            }}
                        >
                            <tab.icon size={16} />
                            <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="px-5 mb-4"
                    >
                        <div
                            className="rounded-xl p-3 flex items-center gap-3"
                            style={{
                                backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                            }}
                        >
                            {error ? <AlertCircle size={18} style={{ color: '#EF4444' }} /> : <CheckCircle size={18} style={{ color: '#22C55E' }} />}
                            <p className="text-sm" style={{ color: error ? '#EF4444' : '#22C55E' }}>{error || success}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <OverviewTab key="overview" dashboard={dashboard} />
                )}
                {activeTab === 'models' && (
                    <ModelsTab key="models" dashboard={dashboard} />
                )}
                {activeTab === 'keys' && (
                    <KeysTab
                        key="keys"
                        apiKeysList={apiKeys}
                        providers={providers}
                        showAddKey={showAddKey}
                        setShowAddKey={setShowAddKey}
                        newKey={newKey}
                        setNewKey={setNewKey}
                        addKey={addKey}
                        testKey={testKey}
                        deleteKey={deleteKey}
                        testingKey={testingKey}
                        getHealthColor={getHealthColor}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// =============================================================================
// OVERVIEW TAB - Simple usage stats for regular users
// =============================================================================
const OverviewTab = ({ dashboard }) => {
    if (!dashboard) return null;

    const { summary, quota_status, reset_times, models, blocked_keys, blocked_models } = dashboard;
    const isHealthy = quota_status?.status === 'ok';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-5 space-y-4"
        >
            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-3">
                <StatusCard
                    label="Active Keys"
                    value={summary?.active_keys || 0}
                    color="#10B981"
                    bgColor="rgba(16, 185, 129, 0.1)"
                />
                <StatusCard
                    label="Blocked Keys"
                    value={blocked_keys?.length || 0}
                    color="#EF4444"
                    bgColor="rgba(239, 68, 68, 0.1)"
                />
                <StatusCard
                    label="Blocked Models"
                    value={blocked_models?.length || 0}
                    color="#F59E0B"
                    bgColor="rgba(245, 158, 11, 0.1)"
                />
            </div>

            {/* Blocked Keys Section (NEW) */}
            {blocked_keys && blocked_keys.length > 0 && (
                <div className="bg-[#18181B] rounded-2xl p-4 border border-red-900/30 bg-red-900/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock size={16} className="text-red-500" />
                        <h3 className="text-sm font-semibold text-red-100">Blocked Keys (Circuit Breaker)</h3>
                    </div>
                    <div className="space-y-3">
                        {blocked_keys.map(key => (
                            <div key={key.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-medium text-red-200">{key.nickname}</span>
                                    <span className="text-xs font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">BLOCKED</span>
                                </div>
                                <div className="text-xs text-red-300/70 mb-2">{key.block_reason}</div>
                                {key.block_until && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-300 font-medium">
                                        <Clock size={12} />
                                        <Countdown target={key.block_until} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Blocked Models (Filtered) */}
            {blocked_models && blocked_models.length > 0 && (
                <div className="bg-[#18181B] rounded-2xl p-4 border border-red-900/20 bg-red-900/5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={16} className="text-red-500" />
                        <h3 className="text-sm font-semibold text-red-400">Blocked Models</h3>
                    </div>
                    <div className="space-y-3">
                        {blocked_models.map(model => (
                            <div key={model.id} className="flex flex-col gap-1 pb-3 border-b border-red-500/10 last:border-0">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-200">{model.display_name}</span>
                                    <span className="text-xs text-red-400 font-medium">{model.key_nickname}</span>
                                </div>
                                <p className="text-xs text-red-400/80">{model.block_reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Remaining Today"
                    value={summary?.remaining_daily_capacity?.toLocaleString() || 0}
                    icon={Zap}
                    color="#6366F1"
                />
                <StatCard
                    label="Resets In"
                    value={`${reset_times?.next_daily_reset_hours || 0}h`}
                    icon={Clock}
                    color="#8B5CF6"
                />
            </div>
        </motion.div>
    );
};

// =============================================================================
// MODELS TAB - Model health and intelligent selection
// =============================================================================
const ModelsTab = ({ dashboard }) => {
    if (!dashboard?.models) {
        return (
            <div className="px-5 py-12 text-center">
                <Sparkles size={48} className="mx-auto mb-4" style={{ color: '#3F3F46' }} />
                <p style={{ color: '#71717A' }}>No model data available</p>
            </div>
        );
    }

    const { models, blocked_keys } = dashboard;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-5 space-y-4"
        >
            {/* Health Status */}
            <div className="grid grid-cols-3 gap-2">
                <StatusPill label="Healthy" value={models.healthy} color="#22C55E" />
                <StatusPill label="Degraded" value={models.degraded} color="#F59E0B" />
                <StatusPill label="Blocked" value={(models.blocked_list?.length || 0) + (blocked_keys?.length || 0)} color="#EF4444" />
            </div>

            {/* Top Models */}
            {models.top_models?.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1F1F23' }}>
                        <TrendingUp size={16} style={{ color: '#6366F1' }} />
                        <span className="text-sm font-medium" style={{ color: '#FAFAFA' }}>Best Available Models</span>
                    </div>
                    {models.top_models.slice(0, 5).map((model, i) => (
                        <div
                            key={`${model.model_id}-${model.key_id}`}
                            className="px-4 py-3 flex items-center justify-between"
                            style={{ borderBottom: i < 4 ? '1px solid #1F1F23' : 'none' }}
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: '#6366F120', color: '#6366F1' }}
                                >
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>
                                        {model.display_name.length > 18 ? model.display_name.slice(0, 18) + '...' : model.display_name}
                                    </p>
                                    <div className="flex flex-col">
                                        <p className="text-xs" style={{ color: '#71717A' }}>
                                            {model.provider} • <span style={{ color: '#8B5CF6' }}>{model.key_nickname || 'Key ' + model.key_id}</span>
                                        </p>
                                        {model.is_blocked && (
                                            <p className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                Blocked: {model.block_until ? <Countdown target={model.block_until} /> : 'Indefinitely'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: '#22C55E' }}>
                                    {(model.confidence_score * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Blocked Keys (Circuit Breaker) - CRITICAL: Show these in Models Tab too */}
            {blocked_keys && blocked_keys.length > 0 && (
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Lock size={16} style={{ color: '#EF4444' }} />
                        <h3 className="text-sm font-semibold text-red-400">Blocked Keys</h3>
                    </div>
                    {blocked_keys.map(key => (
                        <div key={key.id} className="mb-3 last:mb-0 p-3 rounded bg-red-500/10 border border-red-500/10">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-red-200">{key.nickname}</span>
                                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">BLOCKED</span>
                            </div>
                            <p className="text-xs text-red-300/70 mb-1">{key.block_reason}</p>
                            {key.block_until && (
                                <div className="flex items-center gap-1 text-xs text-red-300">
                                    <Clock size={10} />
                                    <Countdown target={key.block_until} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Blocked Models (Specific) */}
            {models.blocked_list?.length > 0 && (
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={16} style={{ color: '#F59E0B' }} />
                        <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>Model Specific Issues</span>
                    </div>
                    {models.blocked_list.map((m, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                            <p className="text-sm" style={{ color: '#FAFAFA' }}>{m.model_id}</p>
                            <p className="text-xs" style={{ color: '#FCA5A5' }}>{m.block_reason}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// =============================================================================
// KEYS TAB - API key management (advanced users)
// =============================================================================
const KeysTab = ({ apiKeysList, providers, showAddKey, setShowAddKey, newKey, setNewKey, addKey, testKey, deleteKey, testingKey, getHealthColor }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-5 space-y-4"
        >
            {/* Add Key Button */}
            <button
                onClick={() => setShowAddKey(!showAddKey)}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#FFFFFF' }}
            >
                <Plus size={18} />
                Add API Key
            </button>

            {/* Add Key Form */}
            <AnimatePresence>
                {showAddKey && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={addKey}
                        className="rounded-xl p-4 overflow-hidden"
                        style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                    >
                        <select
                            value={newKey.provider}
                            onChange={e => setNewKey({ ...newKey, provider: e.target.value })}
                            required
                            className="w-full mb-3 p-3 rounded-lg text-sm"
                            style={{ backgroundColor: '#1F1F23', border: '1px solid #27272A', color: '#FAFAFA' }}
                        >
                            <option value="">Select Provider</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input
                            type="text"
                            placeholder="API Key"
                            value={newKey.api_key}
                            onChange={e => setNewKey({ ...newKey, api_key: e.target.value })}
                            required
                            className="w-full mb-3 p-3 rounded-lg text-sm"
                            style={{ backgroundColor: '#1F1F23', border: '1px solid #27272A', color: '#FAFAFA' }}
                        />
                        <input
                            type="text"
                            placeholder="Nickname (optional)"
                            value={newKey.nickname}
                            onChange={e => setNewKey({ ...newKey, nickname: e.target.value })}
                            className="w-full mb-4 p-3 rounded-lg text-sm"
                            style={{ backgroundColor: '#1F1F23', border: '1px solid #27272A', color: '#FAFAFA' }}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 py-2.5 rounded-lg font-medium text-sm" style={{ background: '#6366F1', color: '#FFFFFF' }}>
                                Add Key
                            </button>
                            <button type="button" onClick={() => setShowAddKey(false)} className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}>
                                Cancel
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Keys List */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}>
                {apiKeysList.length === 0 ? (
                    <div className="p-8 text-center">
                        <Key size={32} className="mx-auto mb-3" style={{ color: '#3F3F46' }} />
                        <p className="text-sm" style={{ color: '#71717A' }}>No API keys configured</p>
                    </div>
                ) : (
                    apiKeysList.map((key, i) => (
                        <div key={key.id} className="p-4" style={{ borderBottom: i < apiKeysList.length - 1 ? '1px solid #1F1F23' : 'none' }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{key.nickname || key.provider}</p>
                                        {key.is_blocked && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500">
                                                BLOCKED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: '#71717A' }}>{key.provider}</p>
                                </div>
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: `${getHealthColor(key.health_score)}20`, color: getHealthColor(key.health_score) }}
                                >
                                    {key.health_score}%
                                </span>
                            </div>

                            {/* Block Reason Display */}
                            {key.is_blocked && (
                                <div className="mb-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20">
                                    <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                                        <Clock size={12} />
                                        {key.block_until ? <Countdown target={key.block_until} /> : 'Blocked indefinitely'}
                                    </p>
                                    <p className="text-[10px] text-red-400/70 truncate">{key.block_reason}</p>
                                </div>
                            )}

                            <div className="flex justify-between text-xs mb-3" style={{ color: '#71717A' }}>
                                <span>{key.requests_today}/{key.daily_quota} today</span>
                                <span>{key.avg_latency_ms}ms latency</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => testKey(key.id)}
                                    disabled={testingKey === key.id}
                                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                                    style={{ backgroundColor: '#27272A', color: '#A1A1AA' }}
                                >
                                    {testingKey === key.id ? 'Testing...' : 'Test'}
                                </button>
                                <button
                                    onClick={() => deleteKey(key.id)}
                                    className="px-4 py-2 rounded-lg text-xs"
                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================
const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#141416', border: '1px solid #1F1F23' }}>
        <Icon size={24} className="mx-auto mb-2" style={{ color }} />
        <p className="text-2xl font-bold" style={{ color: '#FAFAFA' }}>{value}</p>
        <p className="text-xs" style={{ color: '#71717A' }}>{label}</p>
    </div>
);

const StatusPill = ({ label, value, color }) => (
    <div className="rounded-xl py-3 text-center" style={{ backgroundColor: `${color}15` }}>
        <p className="text-xl font-bold" style={{ color }}>{value}</p>
        <p className="text-[10px] uppercase" style={{ color }}>{label}</p>
    </div>
);

const Countdown = ({ target }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const end = new Date(target);
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('Ready to retry');
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            setTimeLeft(`Retry in ${h}h ${m}m ${s}s`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [target]);

    return <span>{timeLeft}</span>;
};

export default MobileAIGateway;

const StatusCard = ({ label, value, color, bgColor = 'rgba(255,255,255,0.05)' }) => (
    <div className="rounded-xl p-3 text-center border border-white/5" style={{ backgroundColor: bgColor }}>
        <p className="text-xl font-bold" style={{ color }}>{value}</p>
        <p className="text-[10px] uppercase font-medium tracking-wider" style={{ color: '#A1A1AA' }}>{label}</p>
    </div>
);
