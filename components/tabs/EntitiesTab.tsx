import React, { useState } from 'react';
import type { CaseEntity, SuggestedEntity, Document, Entity } from '../../types';

/**
 * @interface EntitiesTabProps
 * @description Represents the props for the EntitiesTab component.
 * @description Stellt die Props für die EntitiesTab-Komponente dar.
 * @property {CaseEntity[]} entities - The list of confirmed entities in the case. / Die Liste der bestätigten Entitäten im Fall.
 * @property {React.Dispatch<React.SetStateAction<CaseEntity[]>>} setEntities - Function to update the list of entities. / Funktion zum Aktualisieren der Entitätenliste.
 * @property {Document[]} documents - The list of all documents. / Die Liste aller Dokumente.
 * @property {SuggestedEntity[]} suggestedEntities - A list of entities suggested by the AI. / Eine Liste von von der KI vorgeschlagenen Entitäten.
 * @property {(id: string) => void} onAcceptSuggestedEntity - Function to accept a suggested entity. / Funktion zum Akzeptieren einer vorgeschlagenen Entität.
 * @property {(id: string) => void} onDismissSuggestedEntity - Function to dismiss a suggested entity. / Funktion zum Ablehnen einer vorgeschlagenen Entität.
 * @property {() => void} onAnalyzeRelationships - Function to trigger the analysis of relationships between entities. / Funktion zum Auslösen der Analyse von Beziehungen zwischen Entitäten.
 * @property {boolean} isLoading - Flag indicating if a process is running. / Flag, das anzeigt, ob ein Prozess läuft.
 * @property {string} loadingSection - The specific section that is currently loading. / Der spezifische Bereich, der gerade lädt.
 */
interface EntitiesTabProps {
    entities: CaseEntity[];
    setEntities: React.Dispatch<React.SetStateAction<CaseEntity[]>>;
    documents: Document[];
    suggestedEntities: SuggestedEntity[];
    onAcceptSuggestedEntity: (id: string) => void;
    onDismissSuggestedEntity: (id: string) => void;
    onAnalyzeRelationships: () => void;
    isLoading: boolean;
    loadingSection: string;
}

/**
 * @component EntitiesTab
 * @description A tab for managing case entities (people, organizations, etc.), viewing AI suggestions, and analyzing relationships.
 * @description Ein Tab zur Verwaltung von Fallentitäten (Personen, Organisationen usw.), zur Anzeige von KI-Vorschlägen und zur Analyse von Beziehungen.
 * @param {EntitiesTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered entities tab. / Der gerenderte Entitäten-Tab.
 */
const EntitiesTab: React.FC<EntitiesTabProps> = ({ entities, setEntities, documents, suggestedEntities, onAcceptSuggestedEntity, onDismissSuggestedEntity, onAnalyzeRelationships, isLoading, loadingSection }) => {
    const [newEntity, setNewEntity] = useState({ name: '', type: 'Person', description: '' });

    const handleAddEntity = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEntity.name && newEntity.type) {
            const entityToAdd: CaseEntity = {
                id: crypto.randomUUID(),
                ...newEntity,
                type: newEntity.type as 'Person' | 'Organisation' | 'Standort' | 'Unbekannt',
            };
            setEntities(prev => [...prev, entityToAdd]);
            setNewEntity({ name: '', type: 'Person', description: '' });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Entitäten-Verwaltung</h1>
                    <button
                        onClick={onAnalyzeRelationships}
                        disabled={isLoading && loadingSection === 'relationships' || entities.length < 2}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={entities.length < 2 ? "Mindestens zwei Entitäten benötigt" : "Beziehungsgeflecht analysieren"}
                    >
                        {isLoading && loadingSection === 'relationships' ? 'Analysiere...' : 'Beziehungen analysieren'}
                    </button>
                </div>


                <form onSubmit={handleAddEntity} className="bg-gray-800 p-4 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-white">Neue Entität hinzufügen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            type="text"
                            placeholder="Name"
                            value={newEntity.name}
                            onChange={e => setNewEntity(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                        <select
                            value={newEntity.type}
                            onChange={e => setNewEntity(p => ({ ...p, type: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        >
                            <option>Person</option>
                            <option>Organisation</option>
                            <option>Standort</option>
                            <option>Unbekannt</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Kurzbeschreibung"
                            value={newEntity.description}
                            onChange={e => setNewEntity(p => ({ ...p, description: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Hinzufügen</button>
                </form>

                 <div className="bg-gray-800 rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Typ</th>
                                <th scope="col" className="px-6 py-3">Beschreibung & Beziehungen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entities.map(entity => (
                                <tr key={entity.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-white">{entity.name}</td>
                                    <td className="px-6 py-4">{entity.type}</td>
                                    <td className="px-6 py-4">
                                        {entity.description}
                                        {entity.relationships && entity.relationships.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-700/50">
                                                <ul className="list-disc list-inside space-y-1 text-xs">
                                                    {entity.relationships.map(rel => (
                                                        <li key={rel.targetEntityId}>
                                                            <span className="text-gray-400">{rel.description}</span> <span className="font-semibold text-indigo-300">{rel.targetEntityName}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {entities.length === 0 && (
                        <p className="text-center py-8 text-gray-500">Noch keine Entitäten erfasst.</p>
                    )}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <h2 className="text-2xl font-semibold text-white">Vorgeschlagene Entitäten</h2>
                <div className="space-y-4">
                    {suggestedEntities.map(suggestion => (
                        <div key={suggestion.id} className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-bold text-white">{suggestion.name} <span className="text-sm font-normal text-gray-400">({suggestion.type})</span></h3>
                            <p className="text-sm text-gray-300 my-2">{suggestion.description}</p>
                            <p className="text-xs text-gray-500">Quelle: {suggestion.sourceDocumentName}</p>
                            <div className="mt-3 flex space-x-2">
                                <button onClick={() => onAcceptSuggestedEntity(suggestion.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs">Akzeptieren</button>
                                <button onClick={() => onDismissSuggestedEntity(suggestion.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs">Ablehnen</button>
                            </div>
                        </div>
                    ))}
                    {suggestedEntities.length === 0 && (
                         <p className="text-center py-8 text-gray-500">Keine neuen Vorschläge.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntitiesTab;
