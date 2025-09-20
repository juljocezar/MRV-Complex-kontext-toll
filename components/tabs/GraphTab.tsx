import React, { useMemo } from 'react';
import type { CaseEntity } from '../../types';

interface GraphTabProps {
    entities: CaseEntity[];
}

const GraphTab: React.FC<GraphTabProps> = ({ entities }) => {
    const nodeSize = 80;
    const padding = 20;

    const nodes = useMemo(() => {
        const hasRelationships = entities.some(e => e.relationships && e.relationships.length > 0);
        if (!hasRelationships) return [];

        const entitiesWithRelationships = entities.filter(e => 
            (e.relationships && e.relationships.length > 0) || 
            entities.some(source => source.relationships?.some(rel => rel.targetEntityId === e.id))
        );

        const count = entitiesWithRelationships.length;
        if (count === 0) return [];
        
        const center = { x: 400, y: 300 };
        const radius = Math.min(center.x, center.y) - (nodeSize / 2) - padding;

        return entitiesWithRelationships.map((entity, i) => {
            const angle = (i / count) * 2 * Math.PI;
            return {
                id: entity.id,
                name: entity.name,
                type: entity.type,
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle),
            };
        });
    }, [entities]);

    const edges = useMemo(() => {
        const edgesArr: any[] = [];
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        entities.forEach(entity => {
            if (entity.relationships) {
                entity.relationships.forEach(rel => {
                    const sourceNode = nodeMap.get(entity.id);
                    const targetNode = nodeMap.get(rel.targetEntityId);

                    if (sourceNode && targetNode) {
                        edgesArr.push({
                            id: `${entity.id}-${rel.targetEntityId}`,
                            source: sourceNode,
                            target: targetNode,
                            label: rel.description,
                        });
                    }
                });
            }
        });
        return edgesArr;
    }, [entities, nodes]);

    if (entities.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-500">Keine Entitäten vorhanden, um einen Graphen zu erstellen.</p>
                <p className="text-gray-500 text-sm mt-1">Fügen Sie Entitäten im Tab "Stammdaten" hinzu.</p>
            </div>
        );
    }
    
    if (edges.length === 0) {
        return (
             <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-500">Keine Beziehungen zwischen Entitäten gefunden.</p>
                <p className="text-gray-500 text-sm mt-1">Führen Sie die Beziehungsanalyse im Tab "Stammdaten" aus.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Beziehungs-Graph</h1>
            <p className="text-gray-400">Visuelle Darstellung der Beziehungen zwischen den Entitäten des Falles.</p>

            <div className="w-full h-[600px] bg-gray-800 rounded-lg relative overflow-hidden">
                <svg width="100%" height="100%" className="absolute top-0 left-0">
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
                        </marker>
                    </defs>
                    {edges.map(edge => {
                        const dx = edge.target.x - edge.source.x;
                        const dy = edge.target.y - edge.source.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const normDx = dx / dist;
                        const normDy = dy / dist;
                        const targetX = edge.target.x - normDx * (nodeSize / 2 + 5);
                        const targetY = edge.target.y - normDy * (nodeSize / 2 + 5);

                        return (
                           <g key={edge.id}>
                                <line
                                    x1={edge.source.x} y1={edge.source.y}
                                    x2={targetX} y2={targetY}
                                    stroke="#4f46e5" strokeWidth="2"
                                    markerEnd="url(#arrow)"
                                />
                                <text
                                    x={(edge.source.x + edge.target.x) / 2}
                                    y={(edge.source.y + edge.target.y) / 2}
                                    fill="#a5b4fc"
                                    fontSize="10"
                                    textAnchor="middle"
                                    dy="-5"
                                >
                                    {edge.label}
                                </text>
                           </g>
                        )
                    })}
                </svg>

                {nodes.map(node => (
                    <div
                        key={node.id}
                        className="absolute bg-gray-700 border-2 border-indigo-500 rounded-full flex flex-col items-center justify-center p-2 text-center"
                        style={{
                            left: node.x - nodeSize / 2,
                            top: node.y - nodeSize / 2,
                            width: nodeSize,
                            height: nodeSize,
                        }}
                    >
                        <span className="text-xs font-bold text-white leading-tight">{node.name}</span>
                        <span className="text-[10px] text-indigo-300">{node.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GraphTab;