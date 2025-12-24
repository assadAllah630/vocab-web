import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Divider } from "@heroui/react";
import { CheckCircle2, ChevronRight, Zap, Target, History, BookOpen } from "lucide-react";
import { getMyRecommendations } from "../../api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const RecommendationList = () => {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const response = await getMyRecommendations();
                setRecs(response.data || []);
            } catch (err) {
                console.error("Failed to fetch recommendations:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, []);

    const getTypeColor = (type) => {
        switch (type) {
            case 'assignment': return "danger";
            case 'practice': return "warning";
            case 'review': return "primary";
            case 'new': return "secondary";
            default: return "default";
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'assignment': return <BookOpen className="w-4 h-4" />;
            case 'practice': return <Target className="w-4 h-4" />;
            case 'review': return <History className="w-4 h-4" />;
            case 'new': return <Zap className="w-4 h-4" />;
            default: return <CheckCircle2 className="w-4 h-4" />;
        }
    };

    if (loading) return <div className="h-[300px] flex items-center justify-center"><p className="text-default-400">Loading action plan...</p></div>;

    return (
        <Card className="h-full">
            <CardHeader className="px-6 pt-6 flex flex-col items-start gap-1">
                <h3 className="text-lg font-bold">Your Action Plan</h3>
                <p className="text-sm text-default-500">Recommended activities for your level</p>
            </CardHeader>
            <CardBody className="px-4 py-4 space-y-3">
                {recs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
                        <CheckCircle2 className="text-success w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm text-default-500">No pressing recommendations. You're following your path perfectly!</p>
                    </div>
                ) : (
                    recs.map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Button
                                fullWidth
                                variant="flat"
                                className="h-auto py-4 px-4 flex flex-col items-start gap-1 bg-default-50 hover:bg-default-100 transition-all border-l-4 border-l-transparent hover:border-l-purple-500"
                                onPress={() => navigate(item.action_url)}
                            >
                                <div className="flex w-full justify-between items-center mb-1">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={getTypeColor(item.type)}
                                        startContent={getTypeIcon(item.type)}
                                        className="h-6"
                                    >
                                        <span className="capitalize">{item.type}</span>
                                    </Chip>
                                    <ChevronRight className="w-4 h-4 text-default-400" />
                                </div>
                                <div className="text-left w-full">
                                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                                    <p className="text-xs text-default-500 line-clamp-1">{item.reason}</p>
                                </div>
                            </Button>
                        </motion.div>
                    ))
                )}
            </CardBody>
        </Card>
    );
};

export default RecommendationList;
