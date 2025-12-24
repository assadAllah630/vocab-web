import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, ArrowRight, BookOpen, Target, Sparkles } from 'lucide-react';
import { Button, Progress } from '@heroui/react';
import { getPathNodes, startPathNode, completePathNode } from '../../api';

// This component acts as a high-level wrapper that loads the node content
const MobilePathNodePlayer = () => {
    const { pathId, nodeId } = useParams();
    const navigate = useNavigate();
    const [node, setNode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        loadNode();
    }, [nodeId]);

    const loadNode = async () => {
        try {
            const res = await getPathNodes(pathId);
            const foundNode = res.data.find(n => n.id === parseInt(nodeId));
            setNode(foundNode);

            // Mark as started in backend
            await startPathNode(nodeId);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            // In a real app, this would be triggered by the child component (Quiz result, etc.)
            // Here we simulate completion for now
            await completePathNode(nodeId, { score: 100 });
            setCompleted(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading step...</div>;
    if (!node) return <div className="p-10 text-center text-white">Step not found</div>;

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
            {/* Minimal Header */}
            <div className="p-4 flex items-center justify-between border-b border-[#27272A]">
                <button onClick={() => navigate(-1)} className="text-gray-400">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {node.node_type}
                    </p>
                    <h1 className="text-xs font-bold truncate max-w-[200px]">{node.title}</h1>
                </div>
                <div className="w-6" /> {/* Spacer */}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 relative">
                {completed ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-6"
                    >
                        <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                            >
                                <CheckCircle size={48} className="text-green-500" />
                            </motion.div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Step Completed!</h2>
                            <p className="text-gray-400">You're one step closer to mastery.</p>
                        </div>
                        <Button
                            color="success"
                            size="lg"
                            className="w-full font-bold mt-8"
                            endContent={<ArrowRight size={20} />}
                            onPress={() => navigate(`/m/path/${pathId}`)}
                        >
                            Return to Roadmap
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Placeholder for actual content types */}
                        <div className="bg-[#141416] border border-[#27272A] rounded-2xl p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                {node.node_type === 'lesson' ? <BookOpen size={32} className="text-blue-400" /> :
                                    node.node_type === 'exercise' ? <Target size={32} className="text-indigo-400" /> :
                                        <Sparkles size={32} className="text-amber-400" />}
                            </div>
                            <h3 className="text-xl font-bold">{node.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {node.description || "This feature is coming soon. In the production app, we would load the Story Reader, Flashcard game, or Exam player here based on node.content_type."}
                            </p>

                            <div className="pt-8">
                                <Button
                                    color="primary"
                                    variant="shadow"
                                    size="lg"
                                    className="w-full font-bold"
                                    onPress={handleComplete}
                                >
                                    Finish Step
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 text-center">
                            Estimaged time: {node.duration_minutes} minutes
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MobilePathNodePlayer;
