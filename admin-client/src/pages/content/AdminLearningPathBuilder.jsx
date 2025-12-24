import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    Bars3Icon,
    PencilIcon,
    SparklesIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';
import api from '../../api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import AdminContentSelector from '../../components/AdminContentSelector';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLearningPathBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Path State
    const [path, setPath] = useState({
        title: '',
        description: '',
        speaking_language: 'en', // Native
        target_language: 'de',   // Learning
        is_published: false,
        estimated_hours: 100
    });
    const [sublevels, setSublevels] = useState([]); // [{id, title, nodes: []}]
    const [loading, setLoading] = useState(true);
    const [expandedSublevels, setExpandedSublevels] = useState({});

    // Node Dialog State
    const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
    const [isContentSelectorOpen, setIsContentSelectorOpen] = useState(false);
    const [editingNode, setEditingNode] = useState(null);
    const [targetSublevelId, setTargetSublevelId] = useState(null);

    const [nodeForm, setNodeForm] = useState({
        title: '',
        description: '',
        node_type: 'lesson',
        duration_minutes: 15,
        content_type: null,
        content_id: null,
        pass_threshold: 70,
        objectives: '',
        resources: '',
        skills: '',
        student_summary: '',
        teacher_guide: '',
        materials: []
    });
    const [selectedContentDisplay, setSelectedContentDisplay] = useState(null);

    // AI Generation State
    const [generatingObjectives, setGeneratingObjectives] = useState(null); // sublevelId
    const [aiStatus, setAiStatus] = useState({ has_keys: true, providers: [] }); // Default optimistic

    // Check AI Gateway status on load
    useEffect(() => {
        const checkAiStatus = async () => {
            try {
                const res = await api.get('/api/ai/gateway-status/');
                setAiStatus(res.data);
                if (!res.data.has_keys) {
                    showToast('⚠️ No AI keys configured. Add keys in Settings to use AI features.', 'warning');
                }
            } catch (err) {
                console.error('Failed to check AI status', err);
            }
        };
        checkAiStatus();
    }, []);

    useEffect(() => {
        if (id) {
            loadPath();
        } else {
            setLoading(false);
        }
    }, [id]);

    const loadPath = async () => {
        try {
            setLoading(true);
            // Fetch structure (Path -> SubLevels -> Nodes)
            const res = await api.get(`/api/paths/${id}/structure/`);
            setPath({
                title: res.data.title,
                description: res.data.description || '',
                speaking_language: res.data.speaking_language || 'en',
                target_language: res.data.target_language || 'de',
                is_published: res.data.is_published || false,
                estimated_hours: res.data.estimated_hours || 100
            });
            setSublevels(res.data.sublevels || []);

            // Auto expand active ones or all? Let's expand first one
            if (res.data.sublevels?.length > 0) {
                setExpandedSublevels({ [res.data.sublevels[0].id]: true });
            }
        } catch (err) {
            // Fallback to regular fetch if structure endpoint fails/doesn't exist yet
            console.error(err);
            try {
                const legacyRes = await api.get(`/api/paths/${id}/`);
                setPath(legacyRes.data);
            } catch (e) {
                showToast('Failed to load path', 'error');
                navigate('/content/paths');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSavePath = async () => {
        try {
            let res;
            if (id) {
                res = await api.put(`/api/paths/${id}/`, path);
                showToast('Path updated successfully', 'success');
            } else {
                res = await api.post('/api/paths/', path);
                showToast('Path created successfully', 'success');
                navigate(`/content/paths/${res.data.id}/build`, { replace: true });
            }
        } catch (err) {
            showToast('Failed to save path', 'error');
        }
    };

    const handleGenerateStructure = async () => {
        if (!window.confirm("This will generate 12 sublevels (A1.1 to C2.2). Continue?")) return;
        setLoading(true);

        try {
            // Standard CEFR structure
            const levels = [
                { code: 'A1', subs: ['A1.1', 'A1.2'] },
                { code: 'A2', subs: ['A2.1', 'A2.2'] },
                { code: 'B1', subs: ['B1.1', 'B1.2'] },
                { code: 'B2', subs: ['B2.1', 'B2.2'] },
                { code: 'C1', subs: ['C1.1', 'C1.2'] },
                { code: 'C2', subs: ['C2.1', 'C2.2'] }
            ];

            let order = 0;
            for (const lvl of levels) {
                for (const sub of lvl.subs) {
                    await api.post('/api/path-sublevels/', {
                        path: id,
                        level_code: lvl.code,
                        sublevel_code: sub,
                        title: `${sub} - ${lvl.code} Module ${sub.split('.')[1]}`,
                        order: order++,
                        estimated_hours: 10
                    });
                }
            }

            showToast('Structure generated!', 'success');
            loadPath(); // Reload to see new structure
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'Generation failed';
            showToast(errorMsg, 'error');
            setLoading(false);
        }
    };

    const handleGenerateObjectives = async (sublevelId) => {
        setGeneratingObjectives(sublevelId);
        try {
            await api.post(`/api/path-sublevels/${sublevelId}/generate_objectives/`);
            showToast('Objectives generated!', 'success');
            loadPath();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'AI Generation failed';
            showToast(errorMsg, 'error');
        } finally {
            setGeneratingObjectives(null);
        }
    };

    // --- NODE MANAGEMENT ---

    const openNodeDialog = (sublevelId, node = null) => {
        setTargetSublevelId(sublevelId);
        if (node) {
            setEditingNode(node);
            // Pre-fill form (omitted specific fields for brevity, assuming standard matching)
            setNodeForm({
                title: node.title,
                description: node.description,
                node_type: node.node_type || 'lesson',
                duration_minutes: node.duration_minutes || 15,
                content_type: node.content_type,
                content_id: node.content_id,
                pass_threshold: node.pass_threshold || 70,
                objectives: Array.isArray(node.objectives) ? node.objectives.join('\n') : (node.objectives || ''),
                resources: node.resources || '', // Simplify handling
                skills: node.skills?.join(', ') || '',
                student_summary: node.student_summary || '',
                teacher_guide: node.teacher_guide || '',
                materials: []
            });
            // Fetch materials separately if needed
            setSelectedContentDisplay(node.content_id ? { title: `ID: ${node.content_id}`, type: node.content_type } : null);
            // Load materials for this node
            loadNodeMaterials(node.id);
        } else {
            setEditingNode(null);
            setNodeForm({
                title: '',
                description: '',
                node_type: 'lesson',
                duration_minutes: 15,
                content_type: null,
                content_id: null,
                pass_threshold: 70,
                objectives: '',
                resources: '',
                skills: '',
                student_summary: '',
                teacher_guide: '',
                materials: []
            });
            setSelectedContentDisplay(null);
        }
        setIsNodeDialogOpen(true);
    };

    const handleSaveNode = async () => {
        try {
            // Process form data
            const objectivesList = nodeForm.objectives.split('\n').filter(s => s.trim());

            const payload = {
                ...nodeForm,
                objectives: objectivesList,
                sublevel: targetSublevelId,
                skills: [],
                // Django CharField with blank=True needs '' not null
                content_type: nodeForm.content_type || '',
                content_id: nodeForm.content_id || null,
            };

            // Calculate order
            if (!editingNode) {
                // Find current max order in this sublevel
                const sl = sublevels.find(s => s.id === targetSublevelId);
                const maxOrder = sl?.nodes?.length || 0;
                payload.order = maxOrder;
            } else {
                payload.order = editingNode.order;
            }

            if (editingNode) {
                await api.put(`/api/path-nodes/${editingNode.id}/`, payload);
                showToast('Node updated', 'success');
            } else {
                await api.post('/api/path-nodes/', payload);
                showToast('Node created', 'success');
            }
            setIsNodeDialogOpen(false);
            loadPath();
        } catch (err) {
            console.error('Save node error:', err.response?.data || err);
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            showToast(`Failed to save node: ${errorMsg}`, 'error');
        }
    };

    const handleDeleteNode = async (nodeId) => {
        if (!window.confirm("Delete this step?")) return;
        try {
            await api.delete(`/api/path-nodes/${nodeId}/`);
            loadPath();
            showToast('Deleted', 'success');
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    const handleContentSelect = (item) => {
        setNodeForm(prev => ({
            ...prev,
            content_type: item.type,
            content_id: item.id,
            title: prev.title || item.title
        }));
        setSelectedContentDisplay({ title: item.title, type: item.type });
    };

    // --- MATERIALS MANAGEMENT ---
    const loadNodeMaterials = async (nodeId) => {
        try {
            const res = await api.get(`/api/path-nodes/${nodeId}/materials/`);
            setNodeForm(prev => ({ ...prev, materials: res.data }));
        } catch (err) {
            console.error('Failed to load materials', err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editingNode) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('is_teacher_only', 'false');

        try {
            await api.post(`/api/path-nodes/${editingNode.id}/materials/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('File uploaded!', 'success');
            loadNodeMaterials(editingNode.id);
        } catch (err) {
            console.error(err);
            showToast('Upload failed', 'error');
        }
        // Clear input
        e.target.value = '';
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm('Delete this file?')) return;
        try {
            await api.delete(`/api/path-node-materials/${materialId}/`);
            showToast('Deleted', 'success');
            if (editingNode) loadNodeMaterials(editingNode.id);
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    if (loading && !path.title) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/content/paths')}>
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {id ? 'Edit Learning Path' : 'New Learning Path'}
                        </h1>
                    </div>
                </div>
                <Button onClick={handleSavePath} className="bg-primary text-white">
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SETTINGS PANEL */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Path Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={path.title} onChange={e => setPath({ ...path, title: e.target.value })} placeholder="e.g. German from Scratch" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Speaking (Native)</label>
                                    <Select value={path.speaking_language} onValueChange={val => setPath({ ...path, speaking_language: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="ar">Arabic</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Learning (Target)</label>
                                    <Select value={path.target_language} onValueChange={val => setPath({ ...path, target_language: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="ar">Arabic</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea value={path.description} onChange={e => setPath({ ...path, description: e.target.value })} rows={4} />
                            </div>
                            <div className="pt-4 flex items-center gap-2">
                                <input type="checkbox" checked={path.is_published} onChange={e => setPath({ ...path, is_published: e.target.checked })} className="rounded border-slate-300" />
                                <span className="text-sm font-medium">Published</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* HIERARCHY BUILDER */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Curriculum Structure</h2>
                        {sublevels.length === 0 && id && (
                            <Button size="sm" variant="outline" onClick={handleGenerateStructure}>
                                <SparklesIcon className="h-4 w-4 mr-2 text-amber-500" />
                                Auto-Generate Structure (A1-C2)
                            </Button>
                        )}
                    </div>

                    {!id ? (
                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-500">
                            Save the path settings first to build the curriculum.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sublevels.map(sublevel => (
                                <div key={sublevel.id} className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                                    {/* Sublevel Header */}
                                    <div
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        onClick={() => setExpandedSublevels(prev => ({ ...prev, [sublevel.id]: !prev[sublevel.id] }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedSublevels[sublevel.id] ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                                            <Badge variant="outline" className="bg-white dark:bg-slate-950 font-mono">{sublevel.sublevel_code}</Badge>
                                            <span className="font-semibold">{sublevel.title}</span>
                                            <span className="text-xs text-slate-500">({sublevel.nodes?.length || 0} steps)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={(e) => { e.stopPropagation(); handleGenerateObjectives(sublevel.id); }}
                                                disabled={generatingObjectives === sublevel.id}
                                                title="Generate Objectives with AI"
                                            >
                                                {generatingObjectives === sublevel.id ? (
                                                    <span className="animate-spin">🔄</span>
                                                ) : (
                                                    <SparklesIcon className="h-4 w-4 text-purple-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Sublevel Content (Nodes) */}
                                    <AnimatePresence>
                                        {expandedSublevels[sublevel.id] && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                exit={{ height: 0 }}
                                                className="border-t border-slate-100 dark:border-slate-800"
                                            >
                                                <div className="p-4 space-y-4">
                                                    {/* Objectives */}
                                                    {sublevel.objectives && sublevel.objectives.length > 0 && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded text-xs text-blue-800 dark:text-blue-200">
                                                            <strong>Objectives:</strong> {sublevel.objectives.join(', ')}
                                                        </div>
                                                    )}

                                                    {/* Node List */}
                                                    <div className="space-y-2 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                                                        {(sublevel.nodes || []).map((node, idx) => (
                                                            <div key={node.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded hover:shadow-sm transition-shadow">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-sm">{node.title}</div>
                                                                        <div className="text-xs text-slate-400 capitalize">{node.node_type} • {node.duration_minutes}m</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button size="xs" variant="ghost" onClick={() => openNodeDialog(sublevel.id, node)}>
                                                                        <PencilIcon className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button size="xs" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteNode(node.id)}>
                                                                        <TrashIcon className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full border border-dashed border-slate-200 dark:border-slate-800 text-slate-500"
                                                            onClick={() => openNodeDialog(sublevel.id)}
                                                        >
                                                            <PlusIcon className="h-4 w-4 mr-2" />
                                                            Add Step to {sublevel.sublevel_code}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Node Edit Dialog */}
            <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingNode ? 'Edit Step' : 'New Step'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select value={nodeForm.node_type} onValueChange={val => setNodeForm({ ...nodeForm, node_type: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lesson">Lesson (Text/Video)</SelectItem>
                                    <SelectItem value="exercise">Exercise (Practice)</SelectItem>
                                    <SelectItem value="exam">Assessment / Exam</SelectItem>
                                    <SelectItem value="checkpoint">Milestone / Checkpoint</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input value={nodeForm.title} onChange={e => setNodeForm({ ...nodeForm, title: e.target.value })} placeholder="Step title" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content Link</label>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                {selectedContentDisplay ? (
                                    <div className="flex items-center gap-2">
                                        <Badge>{selectedContentDisplay.type}</Badge>
                                        <span className="text-sm font-medium">{selectedContentDisplay.title}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400">No content linked</span>
                                )}
                                {selectedContentDisplay ? (
                                    <Button size="xs" variant="ghost" className="text-red-500" onClick={() => { setSelectedContentDisplay(null); setNodeForm({ ...nodeForm, content_id: null, content_type: null }); }}>Unlink</Button>
                                ) : (
                                    <Button size="xs" variant="outline" onClick={() => setIsContentSelectorOpen(true)}>Select</Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Learning Objectives (One per line)</label>
                            <Textarea
                                value={nodeForm.objectives}
                                onChange={e => setNodeForm({ ...nodeForm, objectives: e.target.value })}
                                placeholder="- Learn greeting words..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (min)</label>
                                <Input type="number" value={nodeForm.duration_minutes} onChange={e => setNodeForm({ ...nodeForm, duration_minutes: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pass Score %</label>
                                <Input type="number" value={nodeForm.pass_threshold} onChange={e => setNodeForm({ ...nodeForm, pass_threshold: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>

                        {/* Materials / File Upload Section */}
                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-sm font-medium flex items-center gap-2">
                                📎 Materials & Files
                            </label>
                            {editingNode ? (
                                <div className="space-y-2">
                                    {/* Display existing materials */}
                                    {nodeForm.materials?.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                            {nodeForm.materials.map(m => (
                                                <li key={m.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                                                    <span>{m.filename}</span>
                                                    <Button size="xs" variant="ghost" className="text-red-500" onClick={() => handleDeleteMaterial(m.id)}>Delete</Button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-400">No files uploaded yet.</p>
                                    )}
                                    {/* Upload new file */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            id="material-upload"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => document.getElementById('material-upload').click()}
                                        >
                                            Upload File
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                                    💡 Save this step first, then click edit to upload files.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNodeDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveNode}>{editingNode ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AdminContentSelector
                isOpen={isContentSelectorOpen}
                onClose={() => setIsContentSelectorOpen(false)}
                onSelect={handleContentSelect}
            />
        </div>
    );
}
