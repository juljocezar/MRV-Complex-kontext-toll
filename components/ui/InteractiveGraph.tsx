
import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
} from 'reactflow';
import type { CaseEntity } from '../../types';

interface InteractiveGraphProps {
    entities: CaseEntity[];
    onSelectEntity: (entity: CaseEntity) => void;
    selectedEntityId: string | null;
}

const nodeColor = (node: Node) => {
    switch (node.data.type) {
        case 'Person':
            return '#3b82f6'; // blue-500
        case 'Organisation':
            return '#8b5cf6'; // violet-500 (Used for Perpetrator Orgs too)
        case 'Event':
            return '#ef4444'; // red-500 (ESF Events)
        case 'Act':
            return '#f97316'; // orange-500 (ESF Acts)
        case 'Standort':
            return '#10b981'; // emerald-500
        case 'Source': // Implicit type via relationship context if we had it, but mostly Persons act as sources
            return '#22c55e'; 
        default:
            return '#6b7280'; // gray-500
    }
};

const InteractiveGraph: React.FC<InteractiveGraphProps> = ({ entities, onSelectEntity, selectedEntityId }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useMemo(() => {
        const positions = new Map<string, { x: number, y: number }>();
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        const width = 800;
        const height = 600;

        // Categorize for Layout
        const events = entities.filter(e => e.type === 'Event');
        const acts = entities.filter(e => e.type === 'Act');
        const people = entities.filter(e => e.type === 'Person');
        const others = entities.filter(e => !['Person', 'Event', 'Act'].includes(e.type));

        // Hierarchical Layout Attempt (Events Top, Acts Middle, People Bottom)
        // This acts as a pseudo-force simulation start point
        
        // Level 1: Events (Top Center)
        events.forEach((entity, i) => {
            positions.set(entity.id, { x: width / 2 + (i - (events.length - 1) / 2) * 300, y: 50 });
        });

        // Level 2: Acts (Middle)
        acts.forEach((entity, i) => {
            // Spread acts out more
            const row = Math.floor(i / 5);
            const col = i % 5;
            positions.set(entity.id, { x: 100 + col * 200, y: 250 + row * 150 });
        });

        // Level 3: People (Bottom / Periphery)
        people.forEach((entity, i) => {
            const angle = (i / Math.max(1, people.length)) * 2 * Math.PI; 
            const radius = 400; // Large circle around center
            positions.set(entity.id, { 
                x: width / 2 + radius * Math.cos(angle), 
                y: 400 + radius * Math.sin(angle) 
            });
        });
        
        // Others scattered
        others.forEach((entity, i) => {
             positions.set(entity.id, { x: -200, y: 100 + i * 80 });
        });


        entities.forEach(entity => {
            const position = positions.get(entity.id) || { x: Math.random() * width, y: Math.random() * height };
            
            // Visual style variations based on type
            let shapeStyle = {
                background: nodeColor({ data: { type: entity.type } } as Node),
                color: 'white',
                border: '1px solid #333',
                width: 140,
                fontSize: 11,
                borderRadius: entity.type === 'Event' ? '50%' : entity.type === 'Act' ? '0px' : '8px', // Circle for Events, Square for Acts, Rounded for People
                height: entity.type === 'Event' ? 140 : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center' as const,
                padding: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            };

            initialNodes.push({
                id: entity.id,
                position,
                data: { label: entity.name, type: entity.type },
                style: shapeStyle
            });

            (entity.relationships || []).forEach(rel => {
                // Determine edge styling based on relationship type text
                const desc = rel.description.toLowerCase();
                let edgeColor = '#6b7280';
                let animated = false;

                if (desc.includes('opfer')) { edgeColor = '#ef4444'; } // Red for harm
                else if (desc.includes('täter') || desc.includes('beteiligt')) { edgeColor = '#f97316'; } // Orange for perp
                else if (desc.includes('bericht') || desc.includes('quelle')) { edgeColor = '#10b981'; animated = true; } // Green/Flow for info

                initialEdges.push({
                    id: `e-${entity.id}-${rel.targetEntityId}`,
                    source: entity.id,
                    target: rel.targetEntityId,
                    label: rel.description.length > 20 ? rel.description.substring(0,18)+'..' : rel.description, 
                    animated: animated,
                    style: { stroke: edgeColor, strokeWidth: 1.5 },
                    labelStyle: { fill: '#cbd5e1', fontSize: 9, fontWeight: 500 },
                    labelBgStyle: { fill: '#1f2937', fillOpacity: 0.8 },
                });
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [entities, setNodes, setEdges]);
    
    // Highlight Selection Logic
    useMemo(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const isSelected = selectedEntityId === node.id;
                // Check if neighbor
                const isNeighbor = edges.some(e => 
                    (e.source === selectedEntityId && e.target === node.id) || 
                    (e.target === selectedEntityId && e.source === node.id)
                );
                
                const highlight = isSelected || (selectedEntityId && isNeighbor);
                const dim = selectedEntityId && !highlight;

                return {
                    ...node,
                    style: {
                        ...node.style,
                        border: isSelected ? '2px solid #fff' : '1px solid #333',
                        boxShadow: isSelected ? '0 0 20px rgba(255, 255, 255, 0.6)' : '0 4px 6px rgba(0,0,0,0.3)',
                        opacity: dim ? 0.2 : 1,
                        zIndex: isSelected ? 10 : 1
                    },
                }
            })
        );
        
        setEdges((eds) => 
            eds.map((edge) => {
                const isConnected = selectedEntityId && (edge.source === selectedEntityId || edge.target === selectedEntityId);
                return {
                    ...edge,
                    style: {
                        ...edge.style,
                        stroke: isConnected ? '#fff' : (edge.style?.stroke || '#4b5563'),
                        strokeWidth: isConnected ? 3 : 1.5,
                        opacity: selectedEntityId ? (isConnected ? 1 : 0.1) : 1
                    },
                    animated: isConnected ? true : edge.animated
                }
            })
        );

    }, [selectedEntityId, setNodes, setEdges, edges]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        const entity = entities.find(e => e.id === node.id);
        if (entity) {
            onSelectEntity(entity);
        }
    }, [entities, onSelectEntity]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            className="bg-gray-900"
            minZoom={0.1}
        >
            <Controls />
            <MiniMap nodeColor={nodeColor} style={{ backgroundColor: '#1f2937' }} />
            <Background gap={20} size={1} color="#374151" />
        </ReactFlow>
    );
};

export default InteractiveGraph;
