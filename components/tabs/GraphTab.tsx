import React, { useState } from 'react';
import type { AppState, CaseEntity } from '../../types';
import InteractiveGraph from '../ui/InteractiveGraph';

interface GraphTabProps {
    appState: AppState;
}

const GraphTab: React.FC<GraphTabProps> = ({ appState }) => {
    const [selectedEntity, setSelectedEntity] = useState<CaseEntity | null>(null);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Beziehungs-Graph</h1>
            <p className="text-gray-400">
                Dieser Bereich visualisiert die Beziehungen zwischen den verschiedenen Entitäten (Personen, Organisationen, Orte) im Fall.
                Klicken Sie auf einen Knoten für Details. Die Analyse der Beziehungen muss auf dem "Stammdaten"-Tab gestartet werden.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-gray-800 p-2 rounded-lg h-[70vh] relative">
                    <InteractiveGraph 
                        entities={appState.caseEntities} 
                        onSelectEntity={setSelectedEntity}
                        selectedEntityId={selectedEntity?.id || null}
                    />
                 </div>
                 <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-[70vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold text-white mb-4">Details</h2>
                    {selectedEntity ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-lg text-blue-400">{selectedEntity.name}</h3>
                                <p className="text-sm font-normal text-gray-400">({selectedEntity.type})</p>
                            </div>
                            <p className="text-gray-300">{selectedEntity.description}</p>
                             {selectedEntity.relationships && selectedEntity.relationships.length > 0 ? (
                                <div>
                                    <h4 className="font-semibold text-gray-300 border-t border-gray-700 pt-3 mt-3">Beziehungen:</h4>
                                    <ul className="list-disc list-inside mt-2 text-gray-300 space-y-2">
                                        {selectedEntity.relationships.map(rel => (
                                            <li key={rel.targetEntityId}>
                                                {rel.description} <button onClick={() => setSelectedEntity(appState.caseEntities.find(e => e.id === rel.targetEntityId) || null)} className="font-semibold text-indigo-300 hover:underline">{rel.targetEntityName}</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Keine analysierten Beziehungen für diese Entität.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 pt-16">
                            Wählen Sie einen Knoten im Graphen aus, um Details anzuzeigen.
                        </p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default GraphTab;