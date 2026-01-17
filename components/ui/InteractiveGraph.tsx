
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
            return '#f59e0b'; // amber-500
        case 'Standort':
            return '#10b981'; // emerald-500
        case 'Event':
            return '#ef4444'; // red-500 (ESF Events)
        case 'Act':
            return '#f97316'; // orange-500 (ESF Acts)
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
        
        // Level 1: Events
        events.forEach((entity, i) => {
            positions.set(entity.id, { x: width / 2 + (i - (events.length - 1) / 2) * 250, y: 100 });
        });

        // Level 2: Acts
        acts.forEach((entity, i) => {
            positions.set(entity.id, { x: width / 2 + (i - (acts.length - 1) / 2) * 150, y: 300 });
        });

        // Level 3: People (Circular below Acts)
        people.forEach((entity, i) => {
            const angle = (i / people.length) * Math.PI; // Semicircle
            const radius = 300;
            // Distribute in a semi-circle at the bottom
            positions.set(entity.id, { 
                x: width / 2 + radius * Math.cos(angle + Math.PI), // Start from left
                y: 500 + radius * Math.sin(angle) 
            });
        });
        
        // Others scattered
        others.forEach((entity, i) => {
             positions.set(entity.id, { x: 100 + i * 100, y: 50 });
        });


        entities.forEach(entity => {
            const position = positions.get(entity.id) || { x: Math.random() * width, y: Math.random() * height };
            initialNodes.push({
                id: entity.id,
                position,
                data: { label: entity.name, type: entity.type },
                style: {
                    background: nodeColor({ data: { type: entity.type } } as Node),
                    color: 'white',
                    border: '1px solid #333',
                    width: 120,
                    fontSize: 11,
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                }
            });

            (entity.relationships || []).forEach(rel => {
                initialEdges.push({
                    id: `e-${entity.id}-${rel.targetEntityId}`,
                    source: entity.id,
                    target: rel.targetEntityId,
                    label: rel.description, // Show description on edge
                    animated: true,
                    style: { stroke: '#6b7280', strokeWidth: 1 },
                    labelStyle: { fill: '#cbd5e1', fontSize: 9, fontWeight: 600 },
                    labelBgStyle: { fill: '#1f2937', fillOpacity: 0.8 },
                });
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [entities, setNodes, setEdges]);
    
    // Highlight Selection
    useMemo(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                style: {
                    ...node.style,
                    border: selectedEntityId === node.id ? '2px solid #fff' : '1px solid #333',
                    boxShadow: selectedEntityId === node.id ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none',
                    opacity: selectedEntityId ? (selectedEntityId === node.id ? 1 : 0.5) : 1
                },
            }))
        );
        
        setEdges((eds) => 
            eds.map((edge) => ({
                ...edge,
                style: {
                    ...edge.style,
                    stroke: (selectedEntityId && (edge.source === selectedEntityId || edge.target === selectedEntityId)) ? '#fff' : '#4b5563',
                    strokeWidth: (selectedEntityId && (edge.source === selectedEntityId || edge.target === selectedEntityId)) ? 2 : 1,
                    opacity: selectedEntityId ? ((edge.source === selectedEntityId || edge.target === selectedEntityId) ? 1 : 0.2) : 1
                },
                animated: selectedEntityId === edge.source
            }))
        );

    }, [selectedEntityId, setNodes, setEdges]);

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
        >
            <Controls />
            <MiniMap nodeColor={nodeColor} style={{ backgroundColor: '#1f2937' }} />
            <Background gap={16} size={1} color="#374151" />
        </ReactFlow>
    );
};

export default InteractiveGraph;
