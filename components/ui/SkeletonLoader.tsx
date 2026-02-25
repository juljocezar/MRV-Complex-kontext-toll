
import React from 'react';

interface SkeletonLoaderProps {
    className?: string;
    count?: number;
    type?: 'text' | 'rect' | 'circle';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = "", count = 1, type = 'text' }) => {
    const items = Array.from({ length: count });

    const baseClasses = "animate-pulse bg-gray-700/50 rounded";
    
    const getTypeStyles = () => {
        switch (type) {
            case 'circle': return "rounded-full";
            case 'rect': return "rounded-md";
            default: return "rounded";
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {items.map((_, index) => (
                <div 
                    key={index} 
                    className={`${baseClasses} ${getTypeStyles()} ${type === 'text' ? 'h-4 w-full' : 'h-full w-full'}`}
                    style={{ 
                        opacity: 1 - (index * 0.15), // Slight fade for lists
                        animationDelay: `${index * 100}ms`
                    }}
                ></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
