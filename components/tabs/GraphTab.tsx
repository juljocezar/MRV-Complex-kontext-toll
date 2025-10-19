import React, { useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { AppState } from '../../types';

interface GraphTabProps {
    appState: AppState;
}

const GraphTab: React.FC<GraphTabProps> = ({ appState }) => {
    const fgRef = useRef();

    const graphData = useMemo(() => {
        if (!appState.caseEntities || !appState.caseEntityLinks) {
            return { nodes: [], links: [] };
        }
        const nodes = appState.caseEntities.map(entity => ({
            id: entity.id,
            name: entity.name,
            type: entity.type,
        }));

        const links = appState.caseEntityLinks.map(link => ({
            source: link.source,
            target: link.target,
            description: link.description,
        }));

        return { nodes, links };
    }, [appState.caseEntities, appState.caseEntityLinks]);

    const handleNodePaint = useCallback((node, ctx, globalScale) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        let color = '#CBD5E1'; // gray-300
        if (node.type === 'Person') color = '#93C5FD'; // blue-300
        if (node.type === 'Organisation') color = '#A78BFA'; // violet-400
        if (node.type === 'Standort') color = '#6EE7B7'; // emerald-300

        ctx.fillStyle = 'rgba(17, 24, 39, 0.8)'; // gray-900 with opacity
        ctx.fillRect(node.x - 6, node.y - 6, 12, 12);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(label, node.x, node.y + 10);
    }, []);

    const handleLinkPaint = useCallback((link, ctx, globalScale) => {
        const { source, target } = link;
        if (typeof source !== 'object' || typeof target !== 'object') return;

        const label = link.description;
        const fontSize = 8 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        const x = source.x + (target.x - source.x) / 2;
        const y = source.y + (target.y - source.y) / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(156, 163, 175, 0.7)'; // gray-400
        ctx.fillText(label, x, y);
    }, []);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Beziehungs-Graph</h1>
            <p className="text-gray-400">
                Visualisierung der Beziehungen zwischen Entitäten. Starten Sie die "Beziehungen analysieren"-Aktion im Entitäten-Tab, um den Graphen zu füllen.
            </p>
            <div className="w-full h-[70vh] bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                {graphData.nodes.length > 0 ? (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeAutoColorBy="type"
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={1}
                        linkCurvature={0.25}
                        nodeCanvasObject={handleNodePaint}
                        linkCanvasObject={handleLinkPaint}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <h2 className="text-2xl font-semibold">Keine Daten für den Graphen</h2>
                            <p>Führen Sie zuerst eine Tiefenanalyse und dann eine Beziehungs-Analyse durch.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphTab;