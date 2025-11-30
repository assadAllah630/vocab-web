import React from 'react';


function ActivityHeatmap({ activityLog }) {
    // Generate dates for the last 365 days
    const today = new Date();
    const dates = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d);
    }

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const getCount = (date) => {
        const dateStr = formatDate(date);
        return activityLog[dateStr] || 0;
    };

    const getColor = (count) => {
        if (count === 0) return 'bg-slate-100';
        if (count <= 2) return 'bg-green-200';
        if (count <= 5) return 'bg-green-400';
        return 'bg-green-600';
    };

    // Group dates by week for the grid layout
    // We want columns to be weeks, rows to be days (Sun-Sat)
    const weeks = [];
    let currentWeek = [];

    // Pad the first week if necessary
    const firstDay = dates[0].getDay(); // 0 = Sunday
    for (let i = 0; i < firstDay; i++) {
        currentWeek.push(null);
    }

    dates.forEach(date => {
        currentWeek.push(date);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    // Push remaining days
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span> Learning Activity
            </h2>

            <div className="min-w-[700px]">
                <div className="flex gap-1">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-1">
                            {week.map((date, dIndex) => {
                                if (!date) return <div key={`empty-${dIndex}`} className="w-3 h-3" />;

                                const count = getCount(date);
                                const color = getColor(count);
                                const dateStr = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                                return (
                                    <div
                                        key={date.toISOString()}
                                        className={`w-3 h-3 rounded-sm ${color} relative group cursor-pointer transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-indigo-300`}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                            <div className="font-bold">{count} activities</div>
                                            <div className="text-slate-400">{dateStr}</div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-slate-100" />
                    <div className="w-3 h-3 rounded-sm bg-green-200" />
                    <div className="w-3 h-3 rounded-sm bg-green-400" />
                    <div className="w-3 h-3 rounded-sm bg-green-600" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}

export default ActivityHeatmap;
