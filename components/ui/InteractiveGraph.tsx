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

        // Basic layout algorithm
        const orgs = entities.filter(e => e.type === 'Organisation');
        const people = entities.filter(e => e.type === 'Person');
        const others = entities.filter(e => !['Person', 'Organisation'].includes(e.type));

        orgs.forEach((entity, i) => {
            positions.set(entity.id, { x: width / 2 + (i - (orgs.length - 1) / 2) * 200, y: height / 2 });
        });

        people.forEach((entity, i) => {
            const angle = (i / people.length) * 2 * Math.PI;
            const radius = 250;
            positions.set(entity.id, { x: width / 2 + radius * Math.cos(angle), y: height / 2 + radius * Math.sin(angle) });
        });

        others.forEach((entity, i) => {
            positions.set(entity.id, { x: (width / (others.length + 1)) * (i + 1), y: height - 100 });
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
                    width: 120
                }
            });

            (entity.relationships || []).forEach(rel => {
                initialEdges.push({
                    id: `e-${entity.id}-${rel.targetEntityId}`,
                    source: entity.id,
                    target: rel.targetEntityId,
                    label: rel.description,
                    animated: true,
                    style: { stroke: '#a0a0a0' },
                    labelStyle: { fill: '#ddd', fontSize: 10 },
                });
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [entities, setNodes, setEdges]);
    
    useMemo(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                style: {
                    ...node.style,
                    border: selectedEntityId === node.id ? '2px solid #fff' : '1px solid #333',
                    boxShadow: selectedEntityId === node.id ? '0 0 15px rgba(59, 130, 246, 0.7)' : 'none',
                },
            }))
        );
    }, [selectedEntityId, setNodes]);

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
            className="bg-gray-800"
        >
            <Controls />
            <MiniMap nodeColor={nodeColor} />
            <Background gap={12} size={1} color="#4a5568" />
        </ReactFlow>
    );
};

export default InteractiveGraph;
