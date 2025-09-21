import React from 'react';
import type { Contradiction, Document } from '../../types';

/**
 * Props for the ContradictionsTab component.
 */
interface ContradictionsTabProps {
    /** An array of contradiction objects found by the analysis. */
    contradictions: Contradiction[];
    /** The list of all documents, used to find document names by their IDs. */
    documents: Document[];
    /** Callback function to initiate the contradiction finding process. */
    onFindContradictions: () => void;
    /** A boolean indicating if the analysis is currently in progress. */
    isLoading: boolean;
}

/**
 * A UI component that displays potential contradictions found between documents.
 * It provides a button to start the analysis and then renders the results.
 * @param {ContradictionsTabProps} props - The props for the component.
 */
const ContradictionsTab: React.FC<ContradictionsTabProps> = ({ contradictions, documents, onFindContradictions, isLoading }) => {
    
    /**
     * Finds the name of a document from its ID.
     * @param {string} docId - The ID of the document.
     * @returns {string} The name of the document or a default string if not found.
     */
    const getDocName = (docId: string): string => documents.find(d => d.id === docId)?.name || 'Unknown Document';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-white">Contradiction Analysis</h1>
                 <button 
                    onClick={onFindContradictions}
                    disabled={isLoading} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Analyzing...' : 'Start Analysis'}
                </button>
            </div>
            <p className="text-gray-400">This function analyzes all classified documents and highlights potential contradictory statements.</p>
            
             {isLoading && (
                 <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Analyzing documents for contradictions. This may take a moment...</p>
                </div>
            )}

            {!isLoading && contradictions.length > 0 && (
                <div className="space-y-4">
                    {contradictions.map(item => (
                        <div key={item.id} className="bg-gray-800 p-6 rounded-lg shadow">
                            <h3 className="text-lg font-semibold text-red-400 mb-3">Potential Contradiction Found</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-t border-gray-700 py-4">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Statement A (from <span className="font-semibold text-gray-300">{getDocName(item.source1DocId)}</span>)</p>
                                    <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-300 italic">"{item.statement1}"</blockquote>
                                </div>
                                 <div>
                                    <p className="text-sm text-gray-400 mb-1">Statement B (from <span className="font-semibold text-gray-300">{getDocName(item.source2DocId)}</span>)</p>
                                    <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-300 italic">"{item.statement2}"</blockquote>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-300">AI Explanation:</h4>
                                <p className="text-gray-400 mt-1">{item.explanation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             {!isLoading && contradictions.length === 0 && (
                 <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">No contradictions found or analysis has not been run yet.</p>
                </div>
            )}
        </div>
    );
};

export default ContradictionsTab;
