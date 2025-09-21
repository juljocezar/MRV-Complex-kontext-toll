import React from 'react';

// This is a placeholder. A real implementation would use SVG icons.
interface IconProps {
    name: string;
    className?: string;
}

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
