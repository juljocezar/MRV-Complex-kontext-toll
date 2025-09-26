import React from 'react';

/**
 * @interface IconProps
 * @description Props for the Icon component.
 * @property {string} name - The name of the icon to display.
 * @property {string} [className] - Optional CSS classes to apply to the icon.
 */
interface IconProps {
    name: string;
    className?: string;
}

/**
 * @component Icon
 * @description A placeholder icon component that renders an emoji based on a given name.
 * This is used for rapid prototyping and should be replaced with a proper SVG icon system in a full implementation.
 * @param {IconProps} props The props for the component.
 * @returns {React.FC<IconProps>} The rendered icon as a span with an emoji.
 */
const Icon: React.FC<IconProps> = ({ name, className }) => {
    // A simple emoji-based icon system for placeholder purposes
    const getEmoji = (iconName: string) => {
        switch(iconName) {
            case 'dashboard': return '📊';
            case 'documents': return '📄';
            case 'entities': return '👥';
            case 'chronology': return '⏳';
            case 'knowledge': return '🧠';
            case 'graph': return '🕸️';
            case 'analysis': return '🔬';
            case 'reports': return '📈';
            case 'generation': return '✍️';
            case 'library': return '📚';
            case 'dispatch': return '📤';
            case 'strategy': return '♟️';
            case 'argumentation': return '🗣️';
            case 'kpis': return '🎯';
            case 'un': return '🇺🇳';
            case 'hrd': return '🛡️';
            case 'legal': return '⚖️';
            case 'ethics': return '🕊️';
            case 'contradictions': return '🚧';
            case 'agents': return '🤖';
            case 'audit': return '📋';
            case 'settings': return '⚙️';
            default: return '❓';
        }
    }
    return <span className={className} role="img" aria-label={`${name} icon`}>{getEmoji(name)}</span>;
};

export default Icon;