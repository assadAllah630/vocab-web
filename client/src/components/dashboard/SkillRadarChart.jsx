import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { Card, CardBody, CardHeader } from "@heroui/react";

const SkillRadarChart = ({ data }) => {
    // Map backend data to recharts format
    // Backend gives: { skill: { name: '...', level: '...' }, mastery_probability: 0.x }
    const chartData = data.map(item => ({
        subject: item.skill.name,
        A: item.mastery_probability * 100,
        fullMark: 100
    }));

    if (!data || data.length === 0) {
        return (
            <Card className="h-full min-h-[300px] flex items-center justify-center">
                <p className="text-default-500">No skill data available yet. Start practicing!</p>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-col items-start px-6 pt-6">
                <h3 className="text-lg font-bold">Skill Proficiency</h3>
                <p className="text-sm text-default-500">Your current mastery across language areas</p>
            </CardHeader>
            <CardBody className="flex justify-center items-center pb-6">
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                            />
                            <Radar
                                name="Mastery"
                                dataKey="A"
                                stroke="#7c3aed"
                                fill="#7c3aed"
                                fillOpacity={0.5}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardBody>
        </Card>
    );
};

export default SkillRadarChart;
