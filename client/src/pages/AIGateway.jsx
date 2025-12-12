import React, { useState, useEffect } from 'react';
import api from '../api';
import './AIGateway.css';
import {
    Cpu,
    Key,
    Plus,
    Trash2,
    RefreshCw,
    Zap,
    Activity,
    Clock,
    AlertCircle,
    CheckCircle,
    Server,
    Sparkles,
    TrendingUp,
    Shield,
    BarChart3,
    PlayCircle,
    History,
    Gauge,
    ChevronDown,
    ChevronUp,
    Star,
    XCircle,
    Timer
} from 'lucide-react';

const AIGateway = () => {
    const [dashboard, setDashboard] = useState(null);
    const [providers, setProviders] = useState([]);
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddKey, setShowAddKey] = useState(false);
    const [newKey, setNewKey] = useState({ provider: '', api_key: '', nickname: '', skip_validation: false });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [testingKey, setTestingKey] = useState(null);
    const [testingAllKeys, setTestingAllKeys] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);
    const [showActivity, setShowActivity] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [dashRes, provRes, keysRes] = await Promise.all([
                api.get('/ai-gateway/dashboard/'),
                api.get('/ai-gateway/providers/'),
                api.get('/ai-gateway/keys/')
            ]);
            setDashboard(dashRes.data);
            setProviders(provRes.data.providers);
            setKeys(keysRes.data.keys);

            // Try to load recent activity
            try {
                const activityRes = await api.get('/ai-gateway/stats/recent/');
                setRecentActivity(activityRes.data.logs || []);
            } catch {
                // Stats endpoint might not exist, use mock data for demo
                setRecentActivity([]);
            }
        } catch (err) {
            console.error('AI Gateway error:', err);
            if (err.response?.status === 401) {
                setError('Please log in to access AI Gateway');
            } else if (err.response?.status === 404) {
                setError('API not found - restart Django server');
            } else if (!err.response) {
                setError('Cannot connect to server');
            } else {
                setError(`Failed to load: ${err.message}`);
            }
        }
        setLoading(false);
    };

    const addKey = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/ai-gateway/keys/', newKey);
            setSuccess('Key added successfully!');
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
            setSuccess(`Key healthy! Latency: ${res.data.latency_ms}ms`);
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Key test failed');
            setTimeout(() => setError(''), 3000);
        }
        setTestingKey(null);
    };

    const testAllKeys = async () => {
        if (keys.length === 0) return;
        setTestingAllKeys(true);
        let passed = 0;
        let failed = 0;

        for (const key of keys) {
            try {
                await api.post(`/ai-gateway/keys/${key.id}/test/`);
                passed++;
            } catch {
                failed++;
            }
        }

        setTestingAllKeys(false);
        loadData();
        if (failed === 0) {
            setSuccess(`All ${passed} keys are healthy! ✓`);
        } else {
            setSuccess(`Health check: ${passed} passed, ${failed} failed`);
        }
        setTimeout(() => setSuccess(''), 4000);
    };

    const deleteKey = async (keyId) => {
        if (!window.confirm('Deactivate this key?')) return;
        try {
            await api.delete(`/ai-gateway/keys/${keyId}/`);
            loadData();
        } catch (err) {
            setError('Failed to delete key');
        }
    };

    const getHealthClass = (score) => {
        if (score >= 80) return 'good';
        if (score >= 50) return 'medium';
        return 'poor';
    };

    const getHealthColor = (score) => {
        if (score >= 80) return '#22c55e';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const getStatusClass = (status) => {
        if (status === 'healthy' || status === 'ok') return 'healthy';
        if (status === 'warning') return 'warning';
        return 'critical';
    };

    const formatTimeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    // Calculate best key recommendation
    const getBestKey = () => {
        if (keys.length === 0) return null;
        return keys.reduce((best, key) => {
            if (!best) return key;
            const score = key.health_score - (key.requests_today / key.daily_quota * 20) - (key.avg_latency_ms / 100);
            const bestScore = best.health_score - (best.requests_today / best.daily_quota * 20) - (best.avg_latency_ms / 100);
            return score > bestScore ? key : best;
        }, null);
    };

    const bestKey = getBestKey();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (error && !dashboard) {
        return (
            <div className="error-container">
                <div className="error-icon">
                    <AlertCircle size={40} color="#ef4444" />
                </div>
                <h2>Connection Error</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={loadData}>
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="ai-gateway">
            <div className="ai-gateway-container">
                {/* Header */}
                <div className="gateway-header">
                    <div className="gateway-title">
                        <div className="gateway-icon">
                            <Cpu size={28} color="#fff" />
                        </div>
                        <div>
                            <h1>AI Gateway</h1>
                            <p>Multi-provider AI management & intelligent routing</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={testAllKeys}
                            disabled={testingAllKeys || keys.length === 0}
                            title="Test all keys health"
                        >
                            {testingAllKeys ? (
                                <RefreshCw size={18} className="spinning" />
                            ) : (
                                <Gauge size={18} />
                            )}
                            Health Check
                        </button>
                        <button className="btn btn-secondary" onClick={loadData}>
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowAddKey(true)}>
                            <Plus size={18} />
                            Add Key
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="gateway-alert error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="gateway-alert success">
                        <CheckCircle size={20} />
                        <span>{success}</span>
                    </div>
                )}

                {/* Quick Stats */}
                {dashboard && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                                <Zap size={24} color="#6366f1" />
                            </div>
                            <div className="value">{dashboard.summary?.used_today?.toLocaleString() || 0}</div>
                            <div className="label">Requests Today</div>
                        </div>
                        <div className="stat-card">
                            <div className="icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                                <TrendingUp size={24} color="#22c55e" />
                            </div>
                            <div className="value">{dashboard.summary?.remaining_today?.toLocaleString() || 0}</div>
                            <div className="label">Remaining</div>
                        </div>
                        <div className="stat-card">
                            <div className="icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                                <Key size={24} color="#f59e0b" />
                            </div>
                            <div className="value">{keys.length}</div>
                            <div className="label">Active Keys</div>
                        </div>
                        <div className="stat-card">
                            <div className="icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                                <Server size={24} color="#8b5cf6" />
                            </div>
                            <div className="value">{dashboard.providers?.length || 0}</div>
                            <div className="label">Providers</div>
                        </div>
                    </div>
                )}

                {/* Best Key Recommendation */}
                {bestKey && (
                    <div className="recommendation-card">
                        <div className="recommendation-header">
                            <Star size={18} color="#f59e0b" />
                            <span>Recommended Key</span>
                        </div>
                        <div className="recommendation-content">
                            <div className="recommendation-key">
                                <div className="key-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                                    <Key size={18} color="#f59e0b" />
                                </div>
                                <div>
                                    <div className="key-name">{bestKey.nickname || bestKey.provider}</div>
                                    <div className="key-provider">{bestKey.provider}</div>
                                </div>
                            </div>
                            <div className="recommendation-stats">
                                <div className="rec-stat">
                                    <span style={{ color: getHealthColor(bestKey.health_score) }}>
                                        {bestKey.health_score}%
                                    </span>
                                    <span>Health</span>
                                </div>
                                <div className="rec-stat">
                                    <span>{bestKey.avg_latency_ms}ms</span>
                                    <span>Latency</span>
                                </div>
                                <div className="rec-stat">
                                    <span>{Math.round((1 - bestKey.requests_today / bestKey.daily_quota) * 100)}%</span>
                                    <span>Quota Left</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Usage Card */}
                {dashboard && (
                    <div className="usage-card">
                        <div className="usage-header">
                            <div className="usage-title">
                                <Activity size={22} color="#6366f1" />
                                <h2>Daily Usage Overview</h2>
                            </div>
                            <div className={`status-pill ${getStatusClass(dashboard.quota_status?.status)}`}>
                                {dashboard.quota_status?.status === 'healthy' ? (
                                    <CheckCircle size={14} />
                                ) : (
                                    <AlertCircle size={14} />
                                )}
                                {dashboard.quota_status?.status?.toUpperCase() || 'HEALTHY'}
                            </div>
                        </div>

                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${Math.min(dashboard.summary?.usage_percent || 0, 100)}%` }}
                                />
                            </div>
                            <div className="progress-labels">
                                <span>{dashboard.summary?.usage_percent?.toFixed(1) || 0}% used</span>
                                <span>
                                    <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    Resets in {dashboard.reset_times?.next_daily_reset_hours || 0}h
                                </span>
                            </div>
                        </div>

                        <div className="usage-stats-row">
                            <div className="usage-stat">
                                <div className="value">{dashboard.summary?.used_today?.toLocaleString() || 0}</div>
                                <div className="label">Used Today</div>
                            </div>
                            <div className="usage-stat">
                                <div className="value">{dashboard.summary?.remaining_today?.toLocaleString() || 0}</div>
                                <div className="label">Remaining</div>
                            </div>
                            <div className="usage-stat">
                                <div className="value">{dashboard.summary?.total_daily_capacity?.toLocaleString() || 0}</div>
                                <div className="label">Total Capacity</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="gateway-columns">
                    {/* Left Column - Providers */}
                    <div className="gateway-section">
                        <div className="section-header">
                            <div className="section-title">
                                <Sparkles size={18} />
                                Active Providers
                            </div>
                        </div>

                        {dashboard?.providers?.length > 0 ? (
                            <div className="provider-grid">
                                {dashboard.providers.map(p => (
                                    <div key={p.name} className="provider-item">
                                        <div className="provider-header">
                                            <div className="provider-name">
                                                <Server size={16} color="#8b5cf6" />
                                                <span>{p.name}</span>
                                            </div>
                                            <span className="provider-count">
                                                {p.keys_count} key{p.keys_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="provider-info">
                                            <span>{p.used_today} / {p.daily_capacity} today</span>
                                            <span className="provider-health">Health: {p.avg_health}%</span>
                                        </div>
                                        <div className="provider-bar">
                                            <div
                                                className="provider-bar-fill"
                                                style={{ width: `${p.usage_percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Server size={40} />
                                <h3>No Providers Active</h3>
                                <p>Add an API key to get started</p>
                            </div>
                        )}

                        {/* Recent Activity Section */}
                        <div className="activity-section">
                            <div
                                className="activity-header"
                                onClick={() => setShowActivity(!showActivity)}
                            >
                                <div className="section-title">
                                    <History size={18} />
                                    Recent Activity
                                </div>
                                {showActivity ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>

                            {showActivity && (
                                <div className="activity-list">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.slice(0, 5).map((log, i) => (
                                            <div key={i} className="activity-item">
                                                {log.success ? (
                                                    <CheckCircle size={14} color="#22c55e" />
                                                ) : (
                                                    <XCircle size={14} color="#ef4444" />
                                                )}
                                                <div className="activity-info">
                                                    <span className="activity-model">{log.model || 'AI Request'}</span>
                                                    <span className="activity-time">{formatTimeAgo(log.created_at)}</span>
                                                </div>
                                                <span className="activity-latency">{log.latency_ms || 0}ms</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="activity-empty">
                                            <Timer size={20} color="#52525b" />
                                            <p>No recent activity</p>
                                            <span>AI requests will appear here</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - API Keys */}
                    <div className="gateway-section">
                        <div className="section-header">
                            <div className="section-title">
                                <Key size={18} />
                                API Keys ({keys.length})
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddKey(true)}>
                                <Plus size={16} />
                                Add Key
                            </button>
                        </div>

                        {/* Add Key Form */}
                        {showAddKey && (
                            <form className="add-key-form" onSubmit={addKey}>
                                <div className="form-row">
                                    <select
                                        className="form-input"
                                        value={newKey.provider}
                                        onChange={e => setNewKey({ ...newKey, provider: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Provider</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="API Key"
                                        value={newKey.api_key}
                                        onChange={e => setNewKey({ ...newKey, api_key: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nickname"
                                        value={newKey.nickname}
                                        onChange={e => setNewKey({ ...newKey, nickname: e.target.value })}
                                    />
                                </div>
                                <div className="form-checkbox-row">
                                    <label title="Use this if key is valid but quota temporarily exceeded">
                                        <input
                                            type="checkbox"
                                            checked={newKey.skip_validation}
                                            onChange={e => setNewKey({ ...newKey, skip_validation: e.target.checked })}
                                        />
                                        Skip validation (force add)
                                    </label>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary">
                                        <Plus size={16} />
                                        Add Key
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddKey(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Keys List */}
                        {keys.length > 0 ? (
                            <div className="keys-list">
                                {keys.map(key => (
                                    <div
                                        key={key.id}
                                        className={`key-item ${!key.is_active ? 'inactive' : ''} ${bestKey?.id === key.id ? 'recommended' : ''}`}
                                    >
                                        {bestKey?.id === key.id && (
                                            <div className="best-badge">
                                                <Star size={12} /> Best Choice
                                            </div>
                                        )}
                                        <div className="key-header">
                                            <div className="key-icon">
                                                <Key size={18} color="#a5b4fc" />
                                            </div>
                                            <div className="key-info">
                                                <div className="key-name">
                                                    {key.nickname || key.provider}
                                                </div>
                                                <div className="key-provider">{key.provider}</div>
                                            </div>
                                            <div className={`health-badge ${getHealthClass(key.health_score)}`}>
                                                {key.health_score}%
                                            </div>
                                        </div>

                                        <div className="key-stats">
                                            <div className="key-stat">
                                                <div className="value">{key.requests_today}/{key.daily_quota}</div>
                                                <div className="label">Today</div>
                                            </div>
                                            <div className="key-stat">
                                                <div className="value">{key.avg_latency_ms}ms</div>
                                                <div className="label">Latency</div>
                                            </div>
                                            <div className="key-stat">
                                                <div className="value">{key.error_count_last_hour}</div>
                                                <div className="label">Errors/hr</div>
                                            </div>
                                        </div>

                                        {/* Model Usage Breakdown */}
                                        {key.model_usage && key.model_usage.length > 0 && (
                                            <div className="model-usage-section">
                                                <div className="model-usage-title">Model Usage</div>
                                                <div className="model-usage-list">
                                                    {key.model_usage.map((mu) => (
                                                        <div key={mu.model} className="model-usage-item">
                                                            <div className="model-usage-header">
                                                                <span className="mu-name">{mu.model.split('/').pop().split(':')[0]}</span>
                                                                <span className="mu-count">{mu.requests_today} / {mu.daily_quota}</span>
                                                            </div>
                                                            <div className="mu-bar-bg">
                                                                <div
                                                                    className="mu-bar-fill"
                                                                    style={{
                                                                        width: `${mu.percentage}%`,
                                                                        backgroundColor: mu.percentage > 90 ? '#ef4444' : mu.percentage > 70 ? '#f59e0b' : '#6366f1'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="key-actions">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => testKey(key.id)}
                                                disabled={testingKey === key.id}
                                            >
                                                {testingKey === key.id ? (
                                                    <RefreshCw size={14} className="spinning" />
                                                ) : (
                                                    <Shield size={14} />
                                                )}
                                                Test Key
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteKey(key.id)}
                                            >
                                                <Trash2 size={14} />
                                                {key.is_active ? 'Disable' : 'Disabled'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Key size={40} />
                                <h3>No API Keys</h3>
                                <p>Add a key to start using AI Gateway</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Models */}
                {providers.length > 0 && (
                    <div className="gateway-section" style={{ marginTop: 32 }}>
                        <div className="section-header">
                            <div className="section-title">
                                <BarChart3 size={18} />
                                Available Models
                            </div>
                        </div>
                        <div className="models-container">
                            {providers.map(p => (
                                <div key={p.id} className="model-provider">
                                    <div className="model-provider-header">
                                        <span className="model-provider-name">{p.name}</span>
                                        {p.user_keys > 0 && (
                                            <span className="model-provider-keys">
                                                {p.user_keys} key{p.user_keys !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="model-tags">
                                        {p.models.slice(0, 5).map(m => (
                                            <span key={m.id} className="model-tag">
                                                {m.name}
                                            </span>
                                        ))}
                                        {p.models.length > 5 && (
                                            <span className="more-models">
                                                +{p.models.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="gateway-footer">
                    AI Gateway powered by VocabMaster ✨
                </div>
            </div>
        </div>
    );
};

export default AIGateway;
