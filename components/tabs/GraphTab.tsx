import React from 'react';
import type { AppState } from '../../types';

/**
 * Props for the GraphTab component.
 */
interface GraphTabProps {
    /** The global state of the application, containing entities and their relationships. */
    appState: AppState;
}

/**
 * A placeholder UI component for visualizing the relationships between case entities.
 * Currently, it displays a text-based list of entities and their connections,
 * with a placeholder for a future graphical visualization.
 * @param {GraphTabProps} props - The props for the component.
 */
const GraphTab: React.FC<GraphTabProps> = ({ appState }) => {
    // This is a placeholder for a graph visualization library like D3, Vis.js, or React Flow.
    // For now, it will just list the entities and their relationships.

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Relationship Graph</h1>
            <p className="text-gray-400">
                This section visualizes the relationships between the different entities (people, organizations, locations) in the case.
                The relationship analysis must be initiated from the "Entities" tab.
            </p>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Relationship Data (Text Representation)</h2>
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
                                    <p className="text-sm text-gray-500 ml-4">No analyzed relationships.</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        No entities available to build a graph.
                    </p>
                )}
            </div>
             <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
                <div className="text-center text-gray-500">
                    <h2 className="text-2xl font-semibold">Visualization In Development</h2>
                    <p>A graphical representation of the relationships will be available in a future version.</p>
                </div>
            </div>
        </div>
    );
};

export default GraphTab;
