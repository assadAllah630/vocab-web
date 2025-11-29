import React from 'react';
import { motion } from 'framer-motion';

const StatsDemo = () => {
    // Fake data points for the graph
    const points = [10, 25, 18, 40, 35, 60, 55, 85, 90, 100];
    const width = 400;
    const height = 150;
    const pathData = points.map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - (p / 100) * height;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-md mx-auto overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-slate-900 font-bold text-lg">Learning Velocity</h3>
                    <p className="text-slate-500 text-xs">+124% this week</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    Top 5%
                </div>
            </div>

            <div className="relative h-40 w-full">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    {/* Gradient Area */}
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d={areaPath}
                        fill="url(#gradient)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />

                    {/* Line */}
                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* Points */}
                    {points.map((p, i) => {
                        const x = (i / (points.length - 1)) * width;
                        const y = height - (p / 100) * height;
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="white"
                                stroke="#4F46E5"
                                strokeWidth="2"
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ delay: 1 + i * 0.1 }}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="flex justify-between mt-4 text-xs text-slate-400 font-medium">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
            </div>
        </div>
    );
};

export default StatsDemo;
