import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Lightbulb, AlertTriangle, Target, Zap, ChevronRight, History, BookOpen } from 'lucide-react';
import { getMySkills, getCoachInsights, getMyRecommendations } from '../../api';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip as ChartTooltip
} from 'recharts';

export const MobileSkillRadarChart = ({ data }) => {
    const chartData = data.map(item => ({
        subject: item.skill.name,
        A: item.mastery_probability * 100,
        fullMark: 100
    }));

    if (!data || data.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5 mb-4"
            style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-indigo-400" />
                <h3 className="font-bold text-white">Skill Mastery</h3>
            </div>
            <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                        <PolarGrid stroke="#27272A" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#71717A', fontSize: 10 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                        />
                        <Radar
                            name="Mastery"
                            dataKey="A"
                            stroke="#6366F1"
                            fill="#6366F1"
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export const MobileCoachWidget = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const res = await getCoachInsights();
            setInsights(res.data.insights || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || insights.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl p-5 mb-4"
            style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #000000 100%)',
                border: '1px solid #312e81'
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={18} className="text-purple-400" />
                    <h3 className="font-bold text-white">Coach Insights</h3>
                </div>
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
            </div>
            <div className="space-y-4">
                {insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3">
                        <div className="mt-1">
                            {insight.type === 'praise' ? <Sparkles size={14} className="text-green-400" /> :
                                insight.type === 'alert' ? <AlertTriangle size={14} className="text-red-400" /> :
                                    <Lightbulb size={14} className="text-blue-400" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-200">{insight.title}</p>
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{insight.body}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export const MobileRecommendationList = ({ onSelect }) => {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getMyRecommendations();
                setRecs(res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading || recs.length === 0) return null;

    return (
        <div className="px-5 mb-6">
            <h2 className="text-sm font-semibold mb-3 text-gray-400 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                Action Plan
            </h2>
            <div className="space-y-3">
                {recs.map((item, idx) => (
                    <motion.button
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(item.action_url)}
                        className="w-full rounded-xl p-4 flex items-center justify-between"
                        style={{ backgroundColor: '#141416', border: '1px solid #27272A' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${item.type === 'assignment' ? '#ef4444' : '#6366f1'}20` }}
                            >
                                {item.type === 'assignment' ? <BookOpen size={18} className="text-red-400" /> :
                                    item.type === 'practice' ? <Target size={18} className="text-indigo-400" /> :
                                        <History size={18} className="text-amber-400" />}
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                                <p className="text-[10px] text-gray-500">{item.reason}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-600" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
