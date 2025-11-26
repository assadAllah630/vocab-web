import React, { useState } from 'react';
import { SignalIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

function HLRStatsCard({ hlrStats, showDetails = false }) {
    const [expanded, setExpanded] = useState(false);

    if (!hlrStats) return null;

    const { recall_probability, half_life, days_since_practice, priority_score,
        correct_count, wrong_count, total_practice_count } = hlrStats;

    // Calculate percentage
    const recallPercent = Math.round(recall_probability * 100);

    // Determine color based on recall probability
    const getColor = () => {
        if (recall_probability < 0.5) return {
            bg: 'bg-red-50',
            text: 'text-red-700',
            border: 'border-red-200',
            signal: 'bg-red-500'
        };
        if (recall_probability < 0.8) return {
            bg: 'bg-yellow-50',
            text: 'text-yellow-700',
            border: 'border-yellow-200',
            signal: 'bg-yellow-500'
        };
        return {
            bg: 'bg-green-50',
            text: 'text-green-700',
            border: 'border-green-200',
            signal: 'bg-green-500'
        };
    };

    const colors = getColor();

    // WiFi signal bars (0-4 bars based on recall %)
    const getSignalBars = () => {
        if (recallPercent < 20) return 0;
        if (recallPercent < 40) return 1;
        if (recallPercent < 60) return 2;
        if (recallPercent < 80) return 3;
        return 4;
    };

    const signalBars = getSignalBars();

    return (
        <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-3`}>
            {/* Header with WiFi Signal and Percentage */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {/* WiFi Signal Indicator */}
                    <div className="flex items-end gap-0.5 h-5" title={`Memory Strength: ${recallPercent}%`}>
                        {[1, 2, 3, 4].map((bar) => (
                            <div
                                key={bar}
                                className={`w-1.5 rounded-sm transition-all ${bar <= signalBars ? colors.signal : 'bg-slate-200'
                                    }`}
                                style={{ height: `${bar * 25}%` }}
                            />
                        ))}
                    </div>
                    <span className={`text-sm font-bold ${colors.text}`}>
                        {recallPercent}% Recall
                    </span>
                </div>

                {showDetails && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`text-xs font-medium ${colors.text} flex items-center gap-1 hover:underline`}
                    >
                        {expanded ? (
                            <>Hide Details <ChevronUpIcon className="w-3 h-3" /></>
                        ) : (
                            <>Show Details <ChevronDownIcon className="w-3 h-3" /></>
                        )}
                    </button>
                )}
            </div>

            {/* Memory Status Label */}
            <div className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>
                {recall_probability < 0.5 ? '⚠️ Needs Review' :
                    recall_probability < 0.8 ? '📚 Learning' : '✅ Mastered'}
            </div>

            {/* Expanded Details */}
            {showDetails && expanded && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-slate-500">Half-life:</span>
                            <span className="ml-1 font-bold text-slate-700">
                                {half_life > 0 ? `${half_life} days` : 'New word'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">Last seen:</span>
                            <span className="ml-1 font-bold text-slate-700">
                                {days_since_practice !== null ? `${days_since_practice} days ago` : 'Never'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">Priority:</span>
                            <span className="ml-1 font-bold text-slate-700">
                                {priority_score.toFixed(2)}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500">Practice:</span>
                            <span className="ml-1 font-bold text-slate-700">
                                {total_practice_count}x
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                        <div className="text-slate-500 mb-1">Performance:</div>
                        <div className="flex gap-2 text-xs">
                            <span className="text-green-600 font-bold">✓ {correct_count}</span>
                            <span className="text-red-600 font-bold">✗ {wrong_count}</span>
                        </div>
                    </div>

                    {/* HLR Formula Explanation */}
                    <div className="pt-2 border-t border-slate-200 text-slate-500">
                        <div className="font-mono text-[10px]">
                            p = 2^(-Δ/h)
                        </div>
                        <div className="text-[10px] mt-1">
                            Δ={days_since_practice || 0} days, h={half_life} days
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HLRStatsCard;
