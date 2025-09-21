import React from 'react';

/**
 * Props for the Icon component.
 */
interface IconProps {
    /** The name of the icon to display. */
    name: string;
    /** Optional CSS class name(s) to apply to the icon. */
    className?: string;
}

/**
 * A placeholder component that renders an emoji based on a name.
 * In a real implementation, this would likely render an SVG icon.
 * @param {IconProps} props - The props for the component.
 */
const Icon: React.FC<IconProps> = ({ name, className }) => {
    /**
     * Maps an icon name to a corresponding emoji.
     * @param {string} iconName - The name of the icon.
     * @returns {string} The emoji character.
     */
    const getEmoji = (iconName: string): string => {
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
