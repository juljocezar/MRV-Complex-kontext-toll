
import React, { useState, useMemo } from 'react';
import type { AppState, CaseEntity, EntityRelationship } from '../../types';
import InteractiveGraph from '../ui/InteractiveGraph';

interface GraphTabProps {
    appState: AppState;
}

const GraphTab: React.FC<GraphTabProps> = ({ appState }) => {
    const [selectedEntity, setSelectedEntity] = useState<CaseEntity | null>(null);

    // Hybrid Graph Generation: Merges Generic CaseEntities with Strict ESF Records
    const hybridEntities = useMemo(() => {
        const generatedEntities: CaseEntity[] = [];
        const entityMap = new Map<string, CaseEntity>();

        // 1. Add Generic Entities (Legacy / AI suggestions)
        appState.caseEntities.forEach(e => {
            const entity = { ...e };
            entityMap.set(entity.id, entity);
            generatedEntities.push(entity);
        });

        // 2. Add ESF Events as Nodes
        appState.esfEvents.forEach(event => {
            if (!entityMap.has(event.eventRecordNumber)) {
                const node: CaseEntity = {
                    id: event.eventRecordNumber,
                    name: event.eventTitle || `Ereignis ${event.eventRecordNumber}`,
                    type: 'Event',
                    description: event.description || '',
                    roles: [],
                    relationships: []
                };
                entityMap.set(node.id, node);
                generatedEntities.push(node);
            }
        });

        // 3. Add ESF Persons as Nodes
        appState.esfPersons.forEach(person => {
            if (!entityMap.has(person.personRecordNumber)) {
                const node: CaseEntity = {
                    id: person.personRecordNumber,
                    name: person.fullNameOrGroupName,
                    type: 'Person',
                    description: `HURIDOCS Person. Rolle: ${person.roles?.join(', ')}`,
                    roles: [],
                    relationships: []
                };
                entityMap.set(node.id, node);
                generatedEntities.push(node);
            }
        });

        // 4. Add ESF Acts as Nodes and Links
        appState.esfActLinks.forEach(act => {
            // Create Act Node
            const actId = act.fromRecordId; // Convention: fromRecordId in ActLink is the ACT ID
            if (!entityMap.has(actId)) {
                const actNode: CaseEntity = {
                    id: actId,
                    name: act.actClassification || `Tat ${actId}`,
                    type: 'Act',
                    description: act.actDescription || 'Keine Details.',
                    relationships: []
                };
                
                // Link Act -> Victim (toRecordId)
                if (act.toRecordId) {
                    const victim = entityMap.get(act.toRecordId);
                    const victimName = victim ? victim.name : 'Unbekanntes Opfer';
                    actNode.relationships!.push({
                        targetEntityId: act.toRecordId,
                        targetEntityName: victimName,
                        description: 'verübt gegen (Opfer)'
                    });
                }

                // Link Act -> Event (eventId)
                if (act.eventId) {
                    const event = entityMap.get(act.eventId);
                    const eventName = event ? event.name : 'Unbekanntes Event';
                    actNode.relationships!.push({
                        targetEntityId: act.eventId,
                        targetEntityName: eventName,
                        description: 'Teil von'
                    });
                }

                entityMap.set(actId, actNode);
                generatedEntities.push(actNode);
            }
        });

        // 5. Process Involvements (Perpetrator -> Act/Event)
        appState.esfInvolvementLinks.forEach(inv => {
            const perpId = inv.fromRecordId;
            const targetId = inv.toRecordId; // Can be ActID or EventID

            const perpNode = entityMap.get(perpId);
            const targetNode = entityMap.get(targetId);

            if (perpNode && targetNode) {
                if (!perpNode.relationships) perpNode.relationships = [];
                // Avoid duplicates
                if (!perpNode.relationships.find(r => r.targetEntityId === targetId)) {
                    perpNode.relationships.push({
                        targetEntityId: targetId,
                        targetEntityName: targetNode.name,
                        description: inv.involvementRole || 'beteiligt an'
                    });
                }
            }
        });

        return generatedEntities;
    }, [appState.caseEntities, appState.esfEvents, appState.esfPersons, appState.esfActLinks, appState.esfInvolvementLinks]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Fall-Graph (ESF Hybrid)</h1>
            <p className="text-gray-400">
                Visualisiert das Beziehungsgeflecht aus Ereignissen (Rot), Personen (Blau) und konkreten Handlungen/Acts (Orange).
                Klicken Sie auf Knoten für Details.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-gray-800 p-2 rounded-lg h-[70vh] relative border border-gray-700 shadow-xl">
                    <InteractiveGraph 
                        entities={hybridEntities} 
                        onSelectEntity={setSelectedEntity}
                        selectedEntityId={selectedEntity?.id || null}
                    />
                 </div>
                 <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-[70vh] overflow-y-auto border border-gray-700 custom-scrollbar">
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Knoten-Details</h2>
                    {selectedEntity ? (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <h3 className="font-bold text-lg text-blue-400">{selectedEntity.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase
                                        ${selectedEntity.type === 'Person' ? 'bg-blue-900 text-blue-200' :
                                          selectedEntity.type === 'Event' ? 'bg-red-900 text-red-200' :
                                          selectedEntity.type === 'Act' ? 'bg-orange-900 text-orange-200' :
                                          'bg-gray-700 text-gray-300'}`}>
                                        {selectedEntity.type}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">{selectedEntity.id}</span>
                                </div>
                            </div>
                            
                            <div className="bg-gray-700/30 p-3 rounded border border-gray-600">
                                <h4 className="text-xs uppercase font-bold text-gray-500 mb-1">Beschreibung</h4>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedEntity.description || "Keine Beschreibung verfügbar."}</p>
                            </div>

                             {selectedEntity.relationships && selectedEntity.relationships.length > 0 ? (
                                <div>
                                    <h4 className="font-semibold text-gray-300 border-t border-gray-700 pt-3 mt-3 mb-2">Ausgehende Verbindungen:</h4>
                                    <ul className="space-y-2">
                                        {selectedEntity.relationships.map((rel, idx) => (
                                            <li key={`${rel.targetEntityId}-${idx}`} className="bg-gray-900/40 p-2 rounded text-sm border border-gray-700/50 flex items-center justify-between">
                                                <span className="text-gray-400 italic mr-2">{rel.description}</span> 
                                                <span className="text-gray-600 mr-2">➜</span>
                                                <button onClick={() => setSelectedEntity(hybridEntities.find(e => e.id === rel.targetEntityId) || null)} className="font-semibold text-indigo-300 hover:text-white truncate max-w-[150px] text-right">
                                                    {rel.targetEntityName}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mt-4 italic">Endknoten (Keine ausgehenden Verbindungen).</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <span className="text-5xl mb-4 opacity-30">🕸️</span>
                            <p className="text-center text-sm">Wählen Sie einen Knoten im Graphen aus, um Details und Beziehungen zu sehen.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default GraphTab;
