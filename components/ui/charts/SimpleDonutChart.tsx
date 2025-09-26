
import React from 'react';

/**
 * @interface DonutChartProps
 * @description Props for the SimpleDonutChart component.
 * @property {{ label: string; value: number; color: string; }[]} data - An array of data points for the chart segments.
 * @property {number} [size=200] - The width and height of the chart SVG element.
 */
interface DonutChartProps {
    data: {
        label: string;
        value: number;
        color: string;
    }[];
    size?: number;
}

/**
 * @component SimpleDonutChart
 * @description A simple, non-interactive donut chart component created with SVG, including a legend.
 * @param {DonutChartProps} props The props for the component.
 * @returns {React.FC<DonutChartProps>} The rendered donut chart and legend.
 */
const SimpleDonutChart: React.FC<DonutChartProps> = ({ data, size = 200 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="text-center text-gray-500">Keine Daten verfügbar</div>;
    }

    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex items-center justify-center space-x-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
                    {data.map((item, index) => {
                        const dasharray = (item.value / total) * circumference;
                        const segment = (
                            <circle
                                key={index}
                                r={radius}
                                cx="0"
                                cy="0"
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="20"
                                strokeDasharray={`${dasharray} ${circumference - dasharray}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += dasharray;
                        return segment;
                    })}
                </g>
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-3xl font-bold fill-current text-white">
                    {total}
                </text>
                 <text x="50%" y="50%" textAnchor="middle" dy="1.8em" className="text-xs fill-current text-gray-400">
                    Total
                </text>
            </svg>
            <div className="text-sm space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center">
                        <div style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-full mr-2"></div>
                        <span className="text-gray-300">{item.label}:</span>
                        <span className="font-semibold text-white ml-1">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimpleDonutChart;
