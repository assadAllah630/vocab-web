import React from 'react';
import CountUp from 'react-countup';
import ReactECharts from 'echarts-for-react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';

const StatCard = ({
    title,
    value,
    trend,
    trendValue,
    data = [],
    prefix = '',
    suffix = '',
    color = 'primary'
}) => {
    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    const trendColor = isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-slate-500';
    const TrendIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

    const chartOption = {
        grid: { top: 0, right: 0, bottom: 0, left: 0 },
        xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
        yAxis: { type: 'value', show: false },
        series: [{
            data: data,
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: {
                width: 2,
                color: isPositive ? '#00C853' : isNegative ? '#F44336' : '#3B82F6'
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{
                        offset: 0, color: isPositive ? 'rgba(0, 200, 83, 0.2)' : isNegative ? 'rgba(244, 67, 54, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                    }, {
                        offset: 1, color: 'rgba(255, 255, 255, 0)'
                    }]
                }
            }
        }]
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            {title}
                        </p>
                        <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                            {prefix}
                            <CountUp end={value} duration={2} separator="," />
                            {suffix}
                        </h3>
                    </div>
                    <div className={cn("flex items-center text-sm font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full", trendColor)}>
                        <TrendIcon className="w-4 h-4 mr-1" />
                        {trendValue}%
                    </div>
                </div>

                <div className="mt-4 h-12 w-full">
                    <ReactECharts
                        option={chartOption}
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export { StatCard };
