import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, CircularProgress, Tooltip } from "@heroui/react";
import { Sparkles, RefreshCcw, BrainCircuit, Lightbulb, AlertTriangle } from "lucide-react";
import { getCoachInsights } from "../../api";
import { motion, AnimatePresence } from "framer-motion";

const CoachWidget = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getCoachInsights();
            setInsights(response.data.insights || []);
        } catch (err) {
            console.error("Failed to fetch coach insights:", err);
            setError("The coach is busy thinking. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'praise': return <Sparkles className="text-success w-5 h-5" />;
            case 'alert': return <AlertTriangle className="text-warning w-5 h-5" />;
            case 'tip': return <Lightbulb className="text-primary w-5 h-5" />;
            default: return <BrainCircuit className="text-secondary w-5 h-5" />;
        }
    };

    return (
        <Card className="h-full border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
            <CardHeader className="flex justify-between items-center px-6 pt-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg shadow-inner">
                        <BrainCircuit className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Personal Coach</h3>
                        <p className="text-xs text-default-500 italic">AI-powered insights</p>
                    </div>
                </div>
                <Tooltip content="Refine analysis">
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={fetchInsights}
                        isLoading={loading}
                    >
                        <RefreshCcw className="w-4 h-4 text-default-400" />
                    </Button>
                </Tooltip>
            </CardHeader>
            <CardBody className="px-6 py-4">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[200px] gap-3"
                        >
                            <CircularProgress size="lg" aria-label="Analyzing performance..." />
                            <p className="text-sm text-default-500 animate-pulse">Analyzing your progress...</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[200px] text-center"
                        >
                            <AlertTriangle className="text-danger w-8 h-8 mb-2" />
                            <p className="text-sm text-default-500">{error}</p>
                            <Button variant="flat" size="sm" onPress={fetchInsights} className="mt-4">Retry</Button>
                        </motion.div>
                    ) : insights.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[200px] text-center"
                        >
                            <Sparkles className="text-warning w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm text-default-500 italic">"You're doing great! Keep practicing to uncover more insights."</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {insights.map((insight, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-4 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 transition-colors"
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {getIcon(insight.type)}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">{insight.title}</h4>
                                        <p className="text-xs text-default-500 mt-1 leading-relaxed">
                                            {insight.body}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardBody>
        </Card>
    );
};

export default CoachWidget;
