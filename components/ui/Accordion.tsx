import React, { useState } from 'react';

/**
 * Props for the Accordion component.
 */
interface AccordionProps {
    /** The title displayed in the accordion header. */
    title: string;
    /** The content to be displayed when the accordion is open. */
    children: React.ReactNode;
    /** Whether the accordion should be open by default. */
    defaultOpen?: boolean;
}

/**
 * A collapsible accordion component to show and hide content.
 * @param {AccordionProps} props - The props for the component.
 */
const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 font-semibold text-white text-lg hover:bg-gray-700/50 focus:outline-none"
            >
                <span>{title}</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                   &#9660;
                </span>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700 bg-gray-900/20">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;
