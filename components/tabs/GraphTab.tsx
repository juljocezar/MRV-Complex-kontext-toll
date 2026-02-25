
import React, { useState, useMemo } from 'react';
import type { AppState, CaseEntity } from '../../types';
import { EsfActRecord, EsfEventRecord, EsfInformationRecord, EsfInvolvementRecord, EsfPersonRecord } from '../../types/esf';
import InteractiveGraph from '../ui/InteractiveGraph';

interface GraphTabProps {
    appState: AppState;
}

const GraphTab: React.FC<GraphTabProps> = ({ appState }) => {
    const [selectedEntity, setSelectedEntity] = useState<CaseEntity | null>(null);

    // --- Detail Lookup Helper ---
    // Retrieves the specific ESF record based on the generic CaseEntity ID/Type
    const getDetailRecord = () => {
        if (!selectedEntity) return null;
        if (selectedEntity.type === 'Event') return appState.esfEvents.find(e => e.recordNumber === selectedEntity.id);
        if (selectedEntity.type === 'Person') return appState.esfPersons.find(p => p.recordNumber === selectedEntity.id);
        if (selectedEntity.type === 'Act') return appState.esfActLinks.find(a => a.recordNumber === selectedEntity.id);
        return null;
    };

    const detailRecord = getDetailRecord();

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
            if (!entityMap.has(event.recordNumber)) {
                const node: CaseEntity = {
                    id: event.recordNumber,
                    name: event.eventTitle || `Ereignis ${event.recordNumber}`,
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
            if (!entityMap.has(person.recordNumber)) {
                const node: CaseEntity = {
                    id: person.recordNumber,
                    name: person.fullNameOrGroupName,
                    type: 'Person',
                    description: `HURIDOCS Person.`,
                    roles: [],
                    relationships: []
                };
                entityMap.set(node.id, node);
                generatedEntities.push(node);
            }
        });

        // 4. Add ESF Acts as Nodes (Intermediate Node Strategy)
        appState.esfActLinks.forEach(act => {
            if (!entityMap.has(act.recordNumber)) {
                const actNode: CaseEntity = {
                    id: act.recordNumber,
                    name: act.actType || `Tat ${act.recordNumber}`,
                    type: 'Act',
                    description: `Methode: ${act.method || 'Unbekannt'}`,
                    relationships: []
                };
                
                // Link Act -> Victim
                if (act.victimId) {
                    const victim = entityMap.get(act.victimId);
                    actNode.relationships!.push({
                        targetEntityId: act.victimId,
                        targetEntityName: victim ? victim.name : 'Unbekannt',
                        description: 'verübt gegen (Opfer)'
                    });
                }

                // Link Event -> Act (Inverse relation for graph flow usually Event -> Act -> Victim)
                // But here we add relationship to ActNode.
                if (act.eventId) {
                    const event = entityMap.get(act.eventId);
                    if (event) {
                        if (!event.relationships) event.relationships = [];
                        event.relationships.push({
                            targetEntityId: act.recordNumber,
                            targetEntityName: actNode.name,
                            description: 'umfasst Handlung'
                        });
                    }
                }

                entityMap.set(act.recordNumber, actNode);
                generatedEntities.push(actNode);
            }
        });

        // 5. Process Involvements (Perpetrator -> Act)
        appState.esfInvolvementLinks.forEach(inv => {
            const perpNode = entityMap.get(inv.perpetratorId);
            const actNode = entityMap.get(inv.actId);

            if (perpNode && actNode) {
                if (!perpNode.relationships) perpNode.relationships = [];
                perpNode.relationships.push({
                    targetEntityId: inv.actId,
                    targetEntityName: actNode.name,
                    description: inv.involvementRole || 'beteiligt an'
                });
            }
        });

        // 6. Process Information (Source -> Event)
        appState.esfInformationLinks.forEach(info => {
            const sourceNode = entityMap.get(info.sourceId);
            const eventNode = info.eventId ? entityMap.get(info.eventId) : null;

            if (sourceNode && eventNode) {
                if (!sourceNode.relationships) sourceNode.relationships = [];
                sourceNode.relationships.push({
                    targetEntityId: info.eventId!,
                    targetEntityName: eventNode.name,
                    description: `berichtete über (${info.reliability || '?'})`
                });
            }
        });

        // 7. Process Interventions (Intervenor -> Event)
        appState.esfInterventionLinks.forEach(int => {
            const actorNode = entityMap.get(int.intervenorId);
            const eventNode = int.eventId ? entityMap.get(int.eventId) : null;

            if (actorNode && eventNode) {
                if (!actorNode.relationships) actorNode.relationships = [];
                actorNode.relationships.push({
                    targetEntityId: int.eventId!,
                    targetEntityName: eventNode.name,
                    description: `intervenierte (${int.interventionType})`
                });
            }
        });

        return generatedEntities;
    }, [
        appState.caseEntities, 
        appState.esfEvents, 
        appState.esfPersons, 
        appState.esfActLinks, 
        appState.esfInvolvementLinks,
        appState.esfInformationLinks,
        appState.esfInterventionLinks
    ]);

    // --- Type Guards for Rendering ---
    const isEsfEvent = (r: any): r is EsfEventRecord => r && 'eventTitle' in r;
    const isEsfAct = (r: any): r is EsfActRecord => r && 'actType' in r;
    const isEsfPerson = (r: any): r is EsfPersonRecord => r && 'fullNameOrGroupName' in r;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Fall-Graph (ESF Hybrid)</h1>
            <p className="text-gray-400">
                Visualisiert das Beziehungsgeflecht aus Ereignissen (Rot), Personen (Blau/Lila), Handlungen (Orange) und Quellen (Grün).
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-gray-800 p-2 rounded-lg h-[75vh] relative border border-gray-700 shadow-xl overflow-hidden">
                    <InteractiveGraph 
                        entities={hybridEntities} 
                        onSelectEntity={setSelectedEntity}
                        selectedEntityId={selectedEntity?.id || null}
                    />
                 </div>
                 
                 {/* Sidebar Details */}
                 <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-[75vh] overflow-y-auto border border-gray-700 custom-scrollbar">
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Knoten-Details</h2>
                    {selectedEntity ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="font-bold text-lg text-blue-400 break-words">{selectedEntity.name}</h3>
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
                            
                            {/* Generic Description */}
                            <div className="bg-gray-700/30 p-3 rounded border border-gray-600">
                                <h4 className="text-xs uppercase font-bold text-gray-500 mb-1">Allgemein</h4>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedEntity.description || "Keine Beschreibung verfügbar."}</p>
                            </div>

                            {/* ESF Specific Details */}
                            {detailRecord && (
                                <div className="space-y-2">
                                    <h4 className="text-xs uppercase font-bold text-indigo-400 mb-1 border-b border-gray-700 pb-1">HURIDOCS Daten</h4>
                                    
                                    {isEsfEvent(detailRecord) && (
                                        <div className="text-sm text-gray-300 space-y-1">
                                            <p><strong>Start:</strong> {detailRecord.startDate}</p>
                                            <p><strong>Ort:</strong> {detailRecord.geoTerm}</p>
                                            <p><strong>Status:</strong> {detailRecord.violationStatus}</p>
                                        </div>
                                    )}

                                    {isEsfAct(detailRecord) && (
                                        <div className="text-sm text-gray-300 space-y-1">
                                            <p><strong>Typ:</strong> {detailRecord.actType}</p>
                                            <p><strong>Methode:</strong> {detailRecord.method}</p>
                                            {detailRecord.tortureDetails && <p className="text-red-400 text-xs">⚠️ Folter-Details vorhanden</p>}
                                        </div>
                                    )}

                                    {isEsfPerson(detailRecord) && (
                                        <div className="text-sm text-gray-300 space-y-1">
                                            <p><strong>Geburtsdatum:</strong> {detailRecord.dateOfBirth || '-'}</p>
                                            <p><strong>Geschlecht:</strong> {detailRecord.sex || '-'}</p>
                                            <p><strong>Rolle:</strong> {detailRecord.occupation || '-'}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                             {/* Relationships */}
                             {selectedEntity.relationships && selectedEntity.relationships.length > 0 ? (
                                <div>
                                    <h4 className="font-semibold text-gray-300 border-t border-gray-700 pt-3 mt-3 mb-2">Ausgehende Verbindungen:</h4>
                                    <ul className="space-y-2">
                                        {selectedEntity.relationships.map((rel, idx) => (
                                            <li key={`${rel.targetEntityId}-${idx}`} className="bg-gray-900/40 p-2 rounded text-xs border border-gray-700/50 flex items-center justify-between group">
                                                <span className="text-gray-400 italic mr-2 truncate max-w-[100px]" title={rel.description}>{rel.description}</span> 
                                                <span className="text-gray-600 mr-2">➜</span>
                                                <button 
                                                    onClick={() => setSelectedEntity(hybridEntities.find(e => e.id === rel.targetEntityId) || null)} 
                                                    className="font-semibold text-indigo-300 hover:text-white truncate max-w-[120px] text-right"
                                                    title={rel.targetEntityName}
                                                >
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
