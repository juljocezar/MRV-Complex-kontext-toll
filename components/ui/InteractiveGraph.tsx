import React, { useMemo } from 'react';
import type { CaseEntity } from '../../types';

/**
 * @interface InteractiveGraphProps
 * @description Props for the InteractiveGraph component.
 * @property {CaseEntity[]} entities - The list of entities to display in the graph.
 * @property {(entity: CaseEntity) => void} onSelectEntity - Callback function when an entity node is selected.
 * @property {string | null} selectedEntityId - The ID of the currently selected entity, or null.
 */
interface InteractiveGraphProps {
    entities: CaseEntity[];
    onSelectEntity: (entity: CaseEntity) => void;
    selectedEntityId: string | null;
}

/**
 * @function entityTypeColor
 * @description Determines the background color for an entity node based on its type.
 * @param {CaseEntity['type']} type - The type of the entity.
 * @returns {string} A Tailwind CSS background color class string.
 */
const entityTypeColor = (type: CaseEntity['type']) => {
    switch (type) {
        case 'Person': return 'bg-sky-500';
        case 'Organisation': return 'bg-amber-500';
        case 'Standort': return 'bg-teal-500';
        default: return 'bg-gray-500';
    }
}

/**
 * @component InteractiveGraph
 * @description A component that renders an interactive, node-based graph to visualize entities and their relationships.
 * Node positions are calculated based on entity type to create a structured layout.
 * @param {InteractiveGraphProps} props The props for the component.
 * @returns {React.FC<InteractiveGraphProps>} The rendered interactive graph.
 */
const InteractiveGraph: React.FC<InteractiveGraphProps> = ({ entities, onSelectEntity, selectedEntityId }) => {

    const nodePositions = useMemo(() => {
        const positions: { [key: string]: { x: number; y: number } } = {};
        const width = 800; // canvas width
        const height = 500; // canvas height
        const centerX = width / 2;
        const centerY = height / 2;

        const orgs = entities.filter(e => e.type === 'Organisation');
        const people = entities.filter(e => e.type === 'Person');
        const others = entities.filter(e => e.type !== 'Organisation' && e.type !== 'Person');
        
        // Place orgs in the middle
        orgs.forEach((org, i) => {
            positions[org.id] = { x: centerX + (i - (orgs.length-1)/2) * 150, y: centerY };
        });

        // Place people in a circle around
        const personRadius = Math.min(width, height) / 3;
        people.forEach((person, i) => {
            const angle = (i / people.length) * 2 * Math.PI;
            positions[person.id] = {
                x: centerX + personRadius * Math.cos(angle),
                y: centerY + personRadius * Math.sin(angle)
            };
        });
        
        // Place others at the bottom
        others.forEach((other, i) => {
            positions[other.id] = { x: (width / (others.length + 1)) * (i + 1) , y: height - 50 };
        });


        return positions;
    }, [entities]);
    
    return (
        <div className="w-full h-full" style={{ position: 'relative', minWidth: '800px', minHeight: '500px' }}>
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
                {entities.flatMap(entity => 
                    (entity.relationships || []).map(rel => {
                        const sourcePos = nodePositions[entity.id];
                        const targetPos = nodePositions[rel.targetEntityId];

                        if (!sourcePos || !targetPos) return null;

                        return (
                            <line 
                                key={`${entity.id}-${rel.targetEntityId}`}
                                x1={sourcePos.x} y1={sourcePos.y}
                                x2={targetPos.x} y2={targetPos.y}
                                stroke="rgba(107, 114, 128, 0.5)"
                                strokeWidth="2"
                            />
                        );
                    })
                )}
            </svg>

            {entities.map(entity => {
                const pos = nodePositions[entity.id];
                if (!pos) return null;

                const isSelected = selectedEntityId === entity.id;

                return (
                    <button 
                        key={entity.id} 
                        className={`absolute p-2 rounded-lg text-white text-xs text-center shadow-lg transition-all duration-200 ${entityTypeColor(entity.type)} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-500 scale-110' : 'hover:scale-110'}`}
                        style={{ 
                            left: `${pos.x}px`, 
                            top: `${pos.y}px`, 
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                        }}
                        onClick={() => onSelectEntity(entity)}
                    >
                        <div className="font-bold">{entity.name}</div>
                        <div className="text-gray-200 text-[10px]">({entity.type})</div>
                    </button>
                )
            })}
        </div>
    );
};

export default InteractiveGraph;