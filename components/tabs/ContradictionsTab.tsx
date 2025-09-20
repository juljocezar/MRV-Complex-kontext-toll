import React from 'react';
import type { Contradiction, Document } from '../../types';

/**
 * @interface ContradictionsTabProps
 * @description Represents the props for the ContradictionsTab component.
 * @description Stellt die Props für die ContradictionsTab-Komponente dar.
 * @property {Contradiction[]} contradictions - A list of detected contradictions. / Eine Liste der erkannten Widersprüche.
 * @property {Document[]} documents - The list of all documents, used to find document names by ID. / Die Liste aller Dokumente, die verwendet wird, um Dokumentennamen anhand der ID zu finden.
 * @property {() => void} onFindContradictions - Function to trigger the contradiction analysis. / Funktion zum Auslösen der Widerspruchsanalyse.
 * @property {boolean} isLoading - Flag indicating if the analysis is in progress. / Flag, das anzeigt, ob die Analyse läuft.
 */
interface ContradictionsTabProps {
    contradictions: Contradiction[];
    documents: Document[];
    onFindContradictions: () => void;
    isLoading: boolean;
}

/**
 * @component ContradictionsTab
 * @description A tab component for analyzing and displaying potential contradictions between documents.
 * @description Eine Tab-Komponente zur Analyse und Anzeige potenzieller Widersprüche zwischen Dokumenten.
 * @param {ContradictionsTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered contradictions tab. / Der gerenderte Widerspruchs-Tab.
 */
const ContradictionsTab: React.FC<ContradictionsTabProps> = ({ contradictions, documents, onFindContradictions, isLoading }) => {
    
    const getDocName = (docId: string) => documents.find(d => d.id === docId)?.name || 'Unbekanntes Dokument';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-white">Widerspruchsanalyse</h1>
                 <button 
                    onClick={onFindContradictions}
                    disabled={isLoading} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Analysiere...' : 'Analyse starten'}
                </button>
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
                            <h3 className="text-lg font-semibold text-red-400 mb-3">Potenzieller Widerspruch gefunden</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-t border-gray-700 py-4">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Aussage A (aus <span className="font-semibold text-gray-300">{getDocName(item.source1DocId)}</span>)</p>
                                    <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-300 italic">"{item.statement1}"</blockquote>
                                </div>
                                 <div>
                                    <p className="text-sm text-gray-400 mb-1">Aussage B (aus <span className="font-semibold text-gray-300">{getDocName(item.source2DocId)}</span>)</p>
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
