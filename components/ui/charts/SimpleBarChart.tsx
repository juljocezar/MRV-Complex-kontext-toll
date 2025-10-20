
import React from 'react';

interface BarChartProps {
    data: {
        label: string;
        value: number;
    }[];
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0);
    if (maxValue === 0) {
        return <div className="text-center text-gray-500">Keine Daten verfügbar</div>;
    }

    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

    return (
        <div className="flex justify-around items-end h-48 w-full p-4 space-x-4">
            {data.map((item, index) => (
                <div key={item.label} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full rounded-t-md"
                        style={{
                            height: `${(item.value / maxValue) * 100}%`,
                            backgroundColor: colors[index % colors.length],
                            transition: 'height 0.3s ease-out'
                        }}
                        title={`${item.label}: ${item.value}`}
                    >
                    </div>
                    <span className="mt-2 text-xs text-gray-400 font-semibold truncate">{item.label} ({item.value})</span>
                </div>
            ))}
        </div>
    );
};

export default SimpleBarChart;
