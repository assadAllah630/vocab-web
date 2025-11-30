import React from 'react';
import ReactECharts from 'echarts-for-react';

export default function LineChart({ title, xAxisData, seriesData, seriesName, color = '#4f46e5' }) {
    const option = {
        title: {
            text: title,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: seriesName,
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: color
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: color },
                            { offset: 1, color: 'rgba(255, 255, 255, 0)' }
                        ]
                    }
                },
                data: seriesData
            }
        ]
    };

    return <ReactECharts option={option} style={{ height: '300px' }} />;
}
