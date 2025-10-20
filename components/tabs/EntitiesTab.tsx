import React, { useState, useCallback } from 'react';
import { useAgentDispatcher } from '../../hooks/useAgentDispatcher';
import type { AppState, CaseEntity, AgentActivity } from '../../types';

interface EntitiesTabProps {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState | null>>;
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>;
}

const RELATIONSHIP_SCHEMA = {
    type: "OBJECT",
    properties: {
        links: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    source: { type: "STRING", description: "The ID of the source entity." },
                    target: { type: "STRING", description: "The ID of the target entity." },
                    description: { type: "STRING", description: "A brief description of the relationship." }
                },
                required: ["source", "target", "description"]
            }
        }
    },
    required: ["links"]
};

const EntitiesTab: React.FC<EntitiesTabProps> = ({ appState, setAppState, addAgentActivity }) => {
    const { dispatchAgentTask, isLoading } = useAgentDispatcher(appState, addAgentActivity);
    const { entities, knowledgeItems, caseDetails } = appState;
    const [newEntity, setNewEntity] = useState({ name: '', type: 'Person', role: '' });

    const handleAddEntity = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEntity.name && newEntity.type) {
            const entityToAdd: CaseEntity = {
                id: crypto.randomUUID(),
                ...newEntity,
                type: newEntity.type as any,
            };
            setAppState(s => s ? {...s, caseEntities: [...s.caseEntities, entityToAdd]} : null);
            setNewEntity({ name: '', type: 'Person', role: '' });
        }
    };

    const handleAnalyzeRelationships = useCallback(async () => {
        let context = `**Case Description:**\n${caseDetails.description}\n\n`;
        context += `**Key Facts from Knowledge Base:**\n${knowledgeItems.map(i => `- ${i.content}`).join('\n')}\n\n`;
        context += `**List of All Entities (with their IDs):**\n${entities.map(e => `- ${e.name} (ID: ${e.id})`).join('\n')}`;

        const prompt = `Based on the entire case context provided, analyze the relationships between the entities listed. Identify direct connections and describe them with a short label (e.g., 'arbeitet mit', 'ist Mutter von', 'klagt gegen'). Return a list of all identified links. The 'source' and 'target' must be the exact IDs from the list provided.`;

        try {
            const result = await dispatchAgentTask(prompt, 'relationship_analysis', RELATIONSHIP_SCHEMA);
            if (result && (result as any).links) {
                setAppState(s => s ? { ...s, caseEntityLinks: (result as any).links } : null);
                alert(`Analyse abgeschlossen. ${(result as any).links.length} Beziehungen gefunden.`);
            } else {
                alert("Keine neuen Beziehungen gefunden.");
            }
        } catch (error) {
            console.error("Failed to analyze relationships:", error);
            alert("Ein Fehler ist bei der Beziehungsanalyse aufgetreten.");
        }
    }, [appState, dispatchAgentTask, setAppState]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Entitäten-Verwaltung</h1>
                <button
                    onClick={handleAnalyzeRelationships}
                    disabled={isLoading || entities.length < 2}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                    title={entities.length < 2 ? "Mindestens zwei Entitäten benötigt" : "Beziehungsgeflecht analysieren"}
                >
                    {isLoading ? 'Analysiere...' : 'Beziehungen analysieren'}
                </button>
            </div>

            {/* Form for adding new entities manually */}
            <form onSubmit={handleAddEntity} className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h3 className="text-lg font-semibold text-white">Neue Entität manuell hinzufügen</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Name" value={newEntity.name} onChange={e => setNewEntity(p => ({ ...p, name: e.target.value }))} className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600" />
                    <select value={newEntity.type} onChange={e => setNewEntity(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600">
                        <option>Person</option>
                        <option>Organisation</option>
                        <option>Standort</option>
                    </select>
                    <input type="text" placeholder="Rolle im Fall" value={newEntity.role} onChange={e => setNewEntity(p => ({ ...p, role: e.target.value }))} className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600" />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Hinzufügen</button>
            </form>

            {/* Table of existing entities */}
            <div className="bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Typ</th>
                            <th scope="col" className="px-6 py-3">Rolle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entities.map(entity => (
                            <tr key={entity.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white">{entity.name}</td>
                                <td className="px-6 py-4">{entity.type}</td>
                                <td className="px-6 py-4">{entity.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {entities.length === 0 && <p className="text-center py-8 text-gray-500">Noch keine Entitäten erfasst.</p>}
            </div>
        </div>
    );
};

export default EntitiesTab;