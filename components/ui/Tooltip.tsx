
import React from 'react';

/**
 * @interface TooltipProps
 * @description Props for the Tooltip component.
 * @property {string} text - The text to display inside the tooltip.
 * @property {React.ReactElement} children - The child element that will trigger the tooltip on hover.
 * @property {'top' | 'bottom' | 'left' | 'right'} [position='top'] - The position of the tooltip relative to the child element.
 */
interface TooltipProps {
    text: string;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * @component Tooltip
 * @description A reusable component that wraps a child element to provide a descriptive tooltip on hover.
 * @param {TooltipProps} props The props for the component.
 * @returns {React.FC<TooltipProps>} The rendered tooltip wrapper.
 */
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
