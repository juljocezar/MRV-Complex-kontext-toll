
import React from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
    };
    
    return (
        <div className="relative flex items-center group">
            {children}
            <div className={`absolute ${positionClasses[position]} w-max max-w-xs p-2 text-xs text-white bg-gray-900 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none`}>
                {text}
            </div>
        </div>
    );
};

export default Tooltip;
