import React from 'react';
// Fix: Corrected import path for types.
import type { Contradiction, Document } from '../../types';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ContradictionsTabProps {
    contradictions: Contradiction[];
    documents: Document[];
    onFindContradictions: () => void;
    isLoading: boolean;
    onViewDocument: (docId: string) => void;
    onAddRiskNotification: (contradiction: Contradiction) => void;
}

const ContradictionsTab: React.FC<ContradictionsTabProps> = ({ contradictions, documents, onFindContradictions, isLoading, onViewDocument, onAddRiskNotification }) => {
    
    const getDocName = (docId: string) => documents.find(d => d.id === docId)?.name || 'Unbekanntes Dokument';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-white">Widerspruchsanalyse</h1>
                 <Tooltip text="Analysiert alle klassifizierten Dokumente, um Paare von Aussagen zu finden, die sich direkt widersprechen.">
                     <button 
                        onClick={onFindContradictions}
                        disabled={isLoading} 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading && <LoadingSpinner className="h-4 w-4 mr-2" />}
                            {isLoading ? 'Analysiere...' : 'Analyse starten'}
                    </button>
                </Tooltip>
            </div>
            <p className="text-gray-400">Diese Funktion analysiert alle klassifizierten Dokumente und hebt potenzielle widersprüchliche Aussagen hervor.</p>
            
             {isLoading && (
                 <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Dokumente werden auf Widersprüche analysiert. Dies kann einen Moment dauern...</p>
                </div>
            )}

            {!isLoading && contradictions.length > 0 && (
                <div className="space-y-4">
                    {contradictions.map(item => (
                        <div key={item.id} className="bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-red-400 mb-3">Potenzieller Widerspruch gefunden</h3>
                                </div>
                                <button 
                                    onClick={() => onAddRiskNotification(item)}
                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-xs"
                                    title="Zum Strategie-Tab navigieren und ein Risiko bewerten"
                                >
                                    Mögliches Risiko markieren
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-t border-gray-700 py-4">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Aussage A (aus <button onClick={() => onViewDocument(item.source1DocId)} className="font-semibold text-blue-400 hover:underline">{getDocName(item.source1DocId)}</button>)</p>
                                    <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-300 italic">"{item.statement1}"</blockquote>
                                </div>
                                 <div>
                                    <p className="text-sm text-gray-400 mb-1">Aussage B (aus <button onClick={() => onViewDocument(item.source2DocId)} className="font-semibold text-blue-400 hover:underline">{getDocName(item.source2DocId)}</button>)</p>
                                    <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-300 italic">"{item.statement2}"</blockquote>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-300">Erklärung der KI:</h4>
                                <p className="text-gray-400 mt-1">{item.explanation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             {!isLoading && contradictions.length === 0 && (
                 <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Keine Widersprüche gefunden oder Analyse noch nicht gestartet.</p>
                </div>
            )}
        </div>
    );
};

export default ContradictionsTab;