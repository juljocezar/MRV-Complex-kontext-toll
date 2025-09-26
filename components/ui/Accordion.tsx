import React, { useState } from 'react';

/**
 * @interface AccordionProps
 * @description Props for the Accordion component.
 * @property {string} title - The title displayed in the accordion header.
 * @property {React.ReactNode} children - The content to be displayed within the collapsible section.
 * @property {boolean} [defaultOpen=false] - Whether the accordion should be open by default.
 */
interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

/**
 * @component Accordion
 * @description A reusable UI component that displays a collapsible content section.
 * @param {AccordionProps} props The props for the component.
 * @returns {React.FC<AccordionProps>} The rendered accordion component.
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
