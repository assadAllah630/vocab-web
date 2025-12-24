/**
 * AI Settings Page - Manage AI Gateway API Keys
 * 
 * Allows admins to add, view, and manage their API keys for different AI providers.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import {
    Key, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import api from '../../api';

const PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini', color: '#4285f4', description: 'Fast and reliable, 1500 req/day free' },
    { id: 'groq', name: 'Groq', color: '#f97316', description: 'Ultra-fast inference, 14400 req/day free' },
    { id: 'openrouter', name: 'OpenRouter', color: '#8b5cf6', description: 'Access to 100+ models' },
    { id: 'huggingface', name: 'Hugging Face', color: '#fcd34d', description: 'Open models, 1000 req/day free' },
];

export default function AISettings() {
    const { showToast } = useToast();
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newKeyForm, setNewKeyForm] = useState({ provider: 'gemini', api_key: '', label: '' });
    const [validating, setValidating] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        loadKeys();
        loadStatus();
    }, []);

    const loadKeys = async () => {
        try {
            const res = await api.get('/api/ai-gateway/keys/');
            setKeys(res.data);
        } catch (err) {
            console.error('Failed to load keys', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStatus = async () => {
        try {
            const res = await api.get('/api/ai/gateway-status/');
            setStatus(res.data);
        } catch (err) {
            console.error('Failed to load status', err);
        }
    };

    const handleAddKey = async () => {
        if (!newKeyForm.api_key) {
            showToast('API key is required', 'error');
            return;
        }

        setValidating(true);
        try {
            await api.post('/api/ai-gateway/keys/', {
                provider: newKeyForm.provider,
                api_key: newKeyForm.api_key,
                label: newKeyForm.label || `${newKeyForm.provider} key`
            });
            showToast('API key added successfully!', 'success');
            setIsAddDialogOpen(false);
            setNewKeyForm({ provider: 'gemini', api_key: '', label: '' });
            loadKeys();
            loadStatus();
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to add key';
            showToast(msg, 'error');
        } finally {
            setValidating(false);
        }
    };

    const handleDeleteKey = async (keyId) => {
        if (!window.confirm('Delete this API key?')) return;
        try {
            await api.delete(`/api/ai-gateway/keys/${keyId}/`);
            showToast('Key deleted', 'success');
            loadKeys();
            loadStatus();
        } catch (err) {
            showToast('Failed to delete key', 'error');
        }
    };

    const handleToggleKey = async (keyId, isActive) => {
        try {
            await api.patch(`/api/ai-gateway/keys/${keyId}/`, { is_active: !isActive });
            showToast(isActive ? 'Key disabled' : 'Key enabled', 'success');
            loadKeys();
        } catch (err) {
            showToast('Failed to update key', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Key className="w-8 h-8 text-indigo-600" />
                            AI API Keys
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Manage your API keys for AI features
                        </p>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Key
                    </Button>
                </motion.div>

                {/* Status Alert */}
                {status && !status.has_keys && (
                    <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No API Keys Configured</AlertTitle>
                        <AlertDescription>
                            Add at least one API key to use AI features like "Generate Objectives" in the Path Builder.
                        </AlertDescription>
                    </Alert>
                )}

                {status && status.has_keys && (
                    <Alert variant="success">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>AI Gateway Ready</AlertTitle>
                        <AlertDescription>
                            You have {status.key_count} key(s) configured across {status.providers?.length || 0} provider(s).
                        </AlertDescription>
                    </Alert>
                )}

                {/* Keys List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your API Keys</CardTitle>
                        <CardDescription>
                            Keys are encrypted and stored securely. Only the last 4 characters are visible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : keys.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No API keys configured yet.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    Add Your First Key
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {keys.map((key) => {
                                    const provider = PROVIDERS.find(p => p.id === key.provider);
                                    return (
                                        <motion.div
                                            key={key.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex items-center justify-between p-4 rounded-lg border ${key.is_active
                                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: provider?.color || '#6b7280' }}
                                                />
                                                <div>
                                                    <p className="font-medium">{key.label || provider?.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {provider?.name} • ****{key.api_key_last4}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={key.is_active ? 'success' : 'secondary'}>
                                                    {key.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {key.requests_today || 0} today
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleKey(key.id, key.is_active)}
                                                >
                                                    {key.is_active ? 'Disable' : 'Enable'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDeleteKey(key.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Provider Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Supported Providers</CardTitle>
                        <CardDescription>Get free API keys from these providers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PROVIDERS.map((provider) => (
                                <div
                                    key={provider.id}
                                    className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full mt-1"
                                        style={{ backgroundColor: provider.color }}
                                    />
                                    <div>
                                        <p className="font-medium">{provider.name}</p>
                                        <p className="text-sm text-slate-500">{provider.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Key Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add API Key</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Provider</label>
                            <Select
                                value={newKeyForm.provider}
                                onValueChange={(val) => setNewKeyForm({ ...newKeyForm, provider: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PROVIDERS.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key</label>
                            <Input
                                type="password"
                                value={newKeyForm.api_key}
                                onChange={(e) => setNewKeyForm({ ...newKeyForm, api_key: e.target.value })}
                                placeholder="Paste your API key here"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Label (optional)</label>
                            <Input
                                value={newKeyForm.label}
                                onChange={(e) => setNewKeyForm({ ...newKeyForm, label: e.target.value })}
                                placeholder="e.g. My Gemini Key"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddKey} disabled={validating}>
                            {validating ? 'Validating...' : 'Add Key'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
