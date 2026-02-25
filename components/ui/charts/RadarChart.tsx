
import React from 'react';

interface RadarChartProps {
    data: { label: string; value: number; fullMark: number }[]; // Value 0-10
    size?: number;
    color?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300, color = '#6366f1' }) => {
    const center = size / 2;
    const radius = (size / 2) - 40; // Padding for labels
    const angleSlice = (Math.PI * 2) / data.length;

    // Helper to calculate coordinates
    const getCoordinates = (value: number, index: number, max: number) => {
        const angle = index * angleSlice - Math.PI / 2; // Start at top
        const r = (value / max) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Build the main polygon points
    const points = data.map((d, i) => {
        const coords = getCoordinates(d.value, i, d.fullMark);
        return `${coords.x},${coords.y}`;
    }).join(' ');

    // Build grid levels (concentric polygons)
    const levels = 5;
    const gridPolygons = Array.from({ length: levels }).map((_, levelIndex) => {
        const levelFactor = (levelIndex + 1) / levels;
        const levelPoints = data.map((d, i) => {
            const coords = getCoordinates(d.fullMark * levelFactor, i, d.fullMark);
            return `${coords.x},${coords.y}`;
        }).join(' ');
        return (
            <polygon
                key={levelIndex}
                points={levelPoints}
                fill="none"
                stroke="#374151" // gray-700
                strokeWidth="1"
                className="opacity-50"
            />
        );
    });

    // Build axes
    const axes = data.map((d, i) => {
        const end = getCoordinates(d.fullMark, i, d.fullMark);
        return (
            <line
                key={i}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="#374151"
                strokeWidth="1"
            />
        );
    });

    // Labels
    const labels = data.map((d, i) => {
        const coords = getCoordinates(d.fullMark * 1.15, i, d.fullMark); // Push label out a bit
        return (
            <text
                key={i}
                x={coords.x}
                y={coords.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-400 font-bold uppercase tracking-wider"
                style={{ fontSize: '10px' }}
            >
                {d.label}
            </text>
        );
    });

    return (
        <div className="flex justify-center items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g>
                    {gridPolygons}
                    {axes}
                    <polygon
                        points={points}
                        fill={color}
                        fillOpacity="0.2"
                        stroke={color}
                        strokeWidth="2"
                    />
                    {data.map((d, i) => {
                        const coords = getCoordinates(d.value, i, d.fullMark);
                        return (
                            <circle
                                key={i}
                                cx={coords.x}
                                cy={coords.y}
                                r="4"
                                fill={color}
                                stroke="#1f2937"
                                strokeWidth="2"
                            />
                        );
                    })}
                    {labels}
                </g>
            </svg>
        </div>
    );
};

export default RadarChart;
