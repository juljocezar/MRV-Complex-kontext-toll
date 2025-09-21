import React from 'react';
import type { AppState } from '../../types';

interface GraphTabProps {
    appState: AppState;
}

const GraphTab: React.FC<GraphTabProps> = ({ appState }) => {
    // This is a placeholder for a graph visualization library like D3, Vis.js, or React Flow.
    // For now, it will just list the entities and their relationships.

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Beziehungs-Graph</h1>
            <p className="text-gray-400">
                Dieser Bereich visualisiert die Beziehungen zwischen den verschiedenen Entitäten (Personen, Organisationen, Orte) im Fall.
                Die Analyse der Beziehungen muss auf dem "Entitäten"-Tab gestartet werden.
            </p>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Beziehungs-Daten (Text-Repräsentation)</h2>
                {appState.caseEntities.length > 0 ? (
                    <div className="space-y-4">
                        {appState.caseEntities.map(entity => (
                            <div key={entity.id}>
                                <h3 className="font-bold text-lg text-blue-400">{entity.name} <span className="text-sm font-normal text-gray-400">({entity.type})</span></h3>
                                {entity.relationships && entity.relationships.length > 0 ? (
                                    <ul className="list-disc list-inside ml-4 text-gray-300">
                                        {entity.relationships.map(rel => (
                                            <li key={rel.targetEntityId}>
                                                {rel.description} <span className="font-semibold text-indigo-300">{rel.targetEntityName}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 ml-4">Keine analysierten Beziehungen.</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        Keine Entitäten vorhanden, um einen Graphen zu erstellen.
                    </p>
                )}
            </div>
             <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
                <div className="text-center text-gray-500">
                    <h2 className="text-2xl font-semibold">Visualisierung in Entwicklung</h2>
                    <p>Eine grafische Darstellung der Beziehungen wird in einer zukünftigen Version verfügbar sein.</p>
                </div>
            </div>
        </div>
    );
};

export default GraphTab;
