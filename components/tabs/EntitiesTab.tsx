import React, { useState } from 'react';
import type { CaseEntity, SuggestedEntity, Document, Entity } from '../../types';

/**
 * Props for the EntitiesTab component.
 */
interface EntitiesTabProps {
    /** The array of confirmed case entities. */
    entities: CaseEntity[];
    /** Function to update the list of confirmed case entities. */
    setEntities: React.Dispatch<React.SetStateAction<CaseEntity[]>>;
    /** The list of all documents, used for context. */
    documents: Document[];
    /** An array of entities suggested by the AI but not yet confirmed by the user. */
    suggestedEntities: SuggestedEntity[];
    /** Callback to accept a suggested entity and move it to the confirmed list. */
    onAcceptSuggestedEntity: (id: string) => void;
    /** Callback to dismiss a suggested entity. */
    onDismissSuggestedEntity: (id: string) => void;
    /** Callback to trigger an AI analysis of the relationships between confirmed entities. */
    onAnalyzeRelationships: () => void;
    /** A boolean indicating if a process is currently loading. */
    isLoading: boolean;
    /** A string to identify which section is currently loading. */
    loadingSection: string;
}

/**
 * A UI component for managing case entities. It provides tools for manually adding entities,
 * viewing confirmed entities and their relationships, and reviewing AI-suggested entities.
 * @param {EntitiesTabProps} props - The props for the component.
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
                    <h1 className="text-3xl font-bold text-white">Entity Management</h1>
                    <button
                        onClick={onAnalyzeRelationships}
                        disabled={isLoading && loadingSection === 'relationships' || entities.length < 2}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                        title={entities.length < 2 ? "At least two entities are required" : "Analyze relationships"}
                    >
                        {isLoading && loadingSection === 'relationships' ? 'Analyzing...' : 'Analyze Relationships'}
                    </button>
                </div>


                <form onSubmit={handleAddEntity} className="bg-gray-800 p-4 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-white">Add New Entity</h3>
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
                            placeholder="Short Description"
                            value={newEntity.description}
                            onChange={e => setNewEntity(p => ({ ...p, description: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Add</button>
                </form>

                 <div className="bg-gray-800 rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Description & Relationships</th>
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
                        <p className="text-center py-8 text-gray-500">No entities created yet.</p>
                    )}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <h2 className="text-2xl font-semibold text-white">Suggested Entities</h2>
                <div className="space-y-4">
                    {suggestedEntities.map(suggestion => (
                        <div key={suggestion.id} className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-bold text-white">{suggestion.name} <span className="text-sm font-normal text-gray-400">({suggestion.type})</span></h3>
                            <p className="text-sm text-gray-300 my-2">{suggestion.description}</p>
                            <p className="text-xs text-gray-500">Source: {suggestion.sourceDocumentName}</p>
                            <div className="mt-3 flex space-x-2">
                                <button onClick={() => onAcceptSuggestedEntity(suggestion.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs">Accept</button>
                                <button onClick={() => onDismissSuggestedEntity(suggestion.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs">Dismiss</button>
                            </div>
                        </div>
                    ))}
                    {suggestedEntities.length === 0 && (
                         <p className="text-center py-8 text-gray-500">No new suggestions.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntitiesTab;
