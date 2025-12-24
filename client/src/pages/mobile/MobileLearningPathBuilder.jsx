import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import {
    Plus, Save, Layout, ChevronLeft, Trash2,
    BookOpen, Target, Sparkles, MapPin,
    Settings, Play, Eye, GripVertical, AlertTriangle, Link as LinkIcon
} from 'lucide-react';
import {
    Button, Input, Card, Chip, Modal,
    ModalContent, ModalHeader, ModalBody,
    ModalFooter, useDisclosure, Select, SelectItem
} from '@heroui/react';
import {
    createPath, updatePath, getPathDetail,
    getPathNodes, createPathNode, deletePathNode
} from '../../api';
import ContentSelector from '../../components/ContentSelector';

const MobileLearningPathBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [path, setPath] = useState({
        title: '',
        description: '',
        level: 'A1',
        language: 'de',
        is_published: false,
        is_sequential: true
    });
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Safety check for user
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    // Admin Check
    useEffect(() => {
        if (!user.is_superuser && !user.is_staff) {
            navigate('/m/paths');
        }
    }, [user, navigate]);

    // Node Modal State
    const [newNode, setNewNode] = useState({
        node_type: 'lesson',
        title: '',
        description: '',
        duration_minutes: 15,
        content_type: null,
        content_id: null,
        pass_threshold: 70
    });

    const [selectedContentMeta, setSelectedContentMeta] = useState(null);

    useEffect(() => {
        if (id) {
            loadPath();
        } else {
            setLoading(false);
        }
    }, [id]);

    const loadPath = async () => {
        try {
            const [pRes, nRes] = await Promise.all([
                getPathDetail(id),
                getPathNodes(id)
            ]);
            setPath(pRes.data);
            setNodes(nRes.data.sort((a, b) => a.order - b.order));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePath = async () => {
        try {
            if (id) {
                await updatePath(id, path);
            } else {
                const res = await createPath(path);
                navigate(`/m/path/${res.data.id}/build`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNode = async () => {
        try {
            const nodeData = {
                ...newNode,
                path: id,
                order: nodes.length,
                content_type: selectedContentMeta ? selectedContentMeta.type : null,
                content_id: selectedContentMeta ? selectedContentMeta.id : null
            };
            const res = await createPathNode(nodeData);
            setNodes([...nodes, res.data]);
            onClose();
            setNewNode({
                node_type: 'lesson',
                title: '',
                description: '',
                duration_minutes: 15,
                content_type: null,
                content_id: null,
                pass_threshold: 70
            });
            setSelectedContentMeta(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteNode = async (nodeId) => {
        try {
            await deletePathNode(nodeId);
            setNodes(nodes.filter(n => n.id !== nodeId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleReorder = async (newOrder) => {
        // Optimistic update
        setNodes(newOrder);
        // Backend reorder logic commented out temporarily to check for crash
        // const orders = newOrder.map((node, index) => ({ id: node.id, order: index }));
        // await reorderPathNodes({ orders });
    };

    const getNodeIcon = (type) => {
        switch (type) {
            case 'lesson': return <BookOpen size={18} className="text-blue-400" />;
            case 'exercise': return <Target size={18} className="text-indigo-400" />;
            case 'exam': return <Sparkles size={18} className="text-amber-400" />;
            case 'checkpoint': return <MapPin size={18} className="text-green-400" />;
            default: return <Layout size={18} />;
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#141416] pb-24 text-white">
            <div className="sticky top-0 z-50 bg-[#141416]/80 backdrop-blur-md border-b border-[#27272A] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-400">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">Path Builder</h1>
                </div>
                <Button size="sm" color="primary" startContent={<Save size={16} />} onPress={handleSavePath}>
                    Save
                </Button>
            </div>

            <div className="p-5 space-y-6">
                <Card className="p-5 bg-[#1C1C1F] border-[#27272A]">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Path Title</label>
                            <Input
                                placeholder="e.g. Master German B1"
                                variant="bordered"
                                value={path.title}
                                onValueChange={(val) => setPath({ ...path, title: val })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <Input
                                placeholder="Tell students what they will learn"
                                variant="bordered"
                                value={path.description}
                                onValueChange={(val) => setPath({ ...path, description: val })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Target Level</label>
                                <Select
                                    placeholder="Select level"
                                    variant="bordered"
                                    selectedKeys={path.level ? [path.level] : []}
                                    onSelectionChange={(keys) => setPath({ ...path, level: Array.from(keys)[0] })}
                                    aria-label="Target Level"
                                >
                                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                                        <SelectItem key={lvl} textValue={lvl}>{lvl}</SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                                <Select
                                    placeholder="Select language"
                                    variant="bordered"
                                    selectedKeys={path.language ? [path.language] : []}
                                    onSelectionChange={(keys) => setPath({ ...path, language: Array.from(keys)[0] })}
                                    aria-label="Language"
                                >
                                    {[{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }].map(lang => (
                                        <SelectItem key={lang.code} textValue={lang.name}>{lang.name}</SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                </Card>

                {id && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                Path Steps ({nodes.length})
                            </h2>
                            <Button size="sm" variant="flat" color="secondary" startContent={<Plus size={16} />} onPress={onOpen}>
                                Add Step
                            </Button>
                        </div>

                        <Reorder.Group axis="y" values={nodes} onReorder={handleReorder} className="space-y-3">
                            {nodes.map((node) => (
                                <Reorder.Item key={node.id} value={node} whileDrag={{ scale: 1.05 }}>
                                    <Card className="p-4 bg-[#1C1C1F] border-[#27272A] flex flex-col gap-2">
                                        <div className="flex flex-row items-center gap-4 w-full">
                                            <div className="text-gray-600"><GripVertical size={20} /></div>
                                            <div className="w-10 h-10 rounded-lg bg-[#27272A] flex items-center justify-center">
                                                {getNodeIcon(node.node_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate">{node.title}</h4>
                                                <div className="flex gap-2">
                                                    <p className="text-[10px] text-gray-500 uppercase">{node.node_type} • {node.duration_minutes}m</p>
                                                    {node.content_id && (
                                                        <p className="text-[10px] text-indigo-400 flex items-center gap-1">
                                                            <LinkIcon size={10} /> Linked
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteNode(node.id)} className="p-2 text-gray-500 hover:text-red-400">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </Card>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {nodes.length === 0 && (
                            <div className="py-12 text-center text-gray-600 border-2 border-dashed border-[#27272A] rounded-2xl">
                                <Layout className="mx-auto mb-2 opacity-20" size={48} />
                                <p className="text-sm">No steps yet. Add your first lesson!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur" className="dark text-white" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>Add Path Step</ModalHeader>
                    <ModalBody className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Step Type</label>
                            <Select
                                placeholder="Select step type"
                                variant="bordered"
                                selectedKeys={newNode.node_type ? [newNode.node_type] : []}
                                onSelectionChange={(k) => setNewNode({ ...newNode, node_type: Array.from(k)[0] })}
                                aria-label="Step Type"
                            >
                                <SelectItem key="lesson">Lesson (Text/Video)</SelectItem>
                                <SelectItem key="exercise">Exercise (Practice)</SelectItem>
                                <SelectItem key="exam">Assessment / Exam</SelectItem>
                                <SelectItem key="checkpoint">Milestone / Checkpoint</SelectItem>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Step Title</label>
                            <Input
                                placeholder="e.g. Past Tense Intro"
                                variant="bordered"
                                value={newNode.title}
                                onValueChange={(val) => setNewNode({ ...newNode, title: val })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Step Instructions</label>
                            <Input
                                placeholder="What should the student do?"
                                variant="bordered"
                                value={newNode.description}
                                onValueChange={(val) => setNewNode({ ...newNode, description: val })}
                            />
                        </div>
                        <div className="bg-[#1C1C1F] p-4 rounded-xl border border-[#27272A]">
                            <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                <LinkIcon size={14} /> Link Content (Optional)
                            </h3>
                            {selectedContentMeta ? (
                                <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                                    <div>
                                        <p className="font-bold text-sm text-indigo-300">{selectedContentMeta.title}</p>
                                        <p className="text-[10px] text-indigo-400 capitalize">{selectedContentMeta.type}</p>
                                    </div>
                                    <button onClick={() => setSelectedContentMeta(null)} className="text-gray-400 hover:text-white">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ) : (
                                <ContentSelector
                                    onSelect={(item) => {
                                        if (item) {
                                            setSelectedContentMeta(item);
                                            if (!newNode.title) setNewNode(prev => ({ ...prev, title: item.title }));
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (min)</label>
                                <Input
                                    type="number"
                                    placeholder="15"
                                    variant="bordered"
                                    value={newNode.duration_minutes}
                                    onValueChange={(val) => setNewNode({ ...newNode, duration_minutes: parseInt(val) || 0 })}
                                />
                            </div>
                            {newNode.node_type === 'exam' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Pass Score %</label>
                                    <Input
                                        type="number"
                                        placeholder="70"
                                        variant="bordered"
                                        value={newNode.pass_threshold}
                                        onValueChange={(val) => setNewNode({ ...newNode, pass_threshold: parseInt(val) || 0 })}
                                    />
                                </div>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>Cancel</Button>
                        <Button color="primary" onPress={handleAddNode}>Add to Path</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default MobileLearningPathBuilder;
