import React, { useCallback } from 'react';
import { useAgentDispatcher } from '../../hooks/useAgentDispatcher';
import type { AppState, AgentActivity } from '../../types';

const CONTRADICTION_SCHEMA = {
    type: "OBJECT",
    properties: {
        contradictions: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    statement1: { type: "STRING" },
                    source1DocId: { type: "STRING" },
                    statement2: { type: "STRING" },
                    source2DocId: { type: "STRING" },
                    explanation: { type: "STRING" }
                },
                required: ["statement1", "source1DocId", "statement2", "source2DocId", "explanation"]
            }
        }
    },
    required: ["contradictions"]
};

interface ContradictionsTabProps {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState | null>>;
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>;
}

const ContradictionsTab: React.FC<ContradictionsTabProps> = ({ appState, setAppState, addAgentActivity }) => {
    const { dispatchAgentTask, isLoading } = useAgentDispatcher(appState, addAgentActivity);
    const { contradictions, documents, documentAnalysisResults, caseDetails } = appState;
    
    const getDocName = (docId: string) => documents.find(d => d.id === docId)?.name || 'Unbekanntes Dokument';

    const handleFindContradictions = useCallback(async () => {
        const analyzedDocs = documents.filter(doc => documentAnalysisResults[doc.id]);
        if (analyzedDocs.length < 2) {
            alert("Es müssen mindestens zwei Dokumente analysiert sein, um Widersprüche zu finden.");
            return;
        }

        let context = `**Case Description:**\n${caseDetails.description}\n\n`;
        context += `**Document Summaries & Key Facts:**\n\n`;
        analyzedDocs.forEach(doc => {
            const analysis = documentAnalysisResults[doc.id];
            context += `--- Document ID: ${doc.id}, Name: ${doc.name} ---\n`;
            // Use 'zentrale_fakten' as the source of truth for contradictions.
            if (analysis && analysis.zentrale_fakten && analysis.zentrale_fakten.length > 0) {
                context += analysis.zentrale_fakten.join('. ');
            }
            context += `\n\n`;
        });

        const prompt = `Analyze the provided document summaries and case description to identify any factual contradictions. List all contradictions you find.`;

        try {
            const result = await dispatchAgentTask(prompt, 'contradiction_detection', CONTRADICTION_SCHEMA);
            if (result && (result as any).contradictions) {
                const newContradictions = (result as any).contradictions.map((c: any) => ({
                    ...c,
                    id: crypto.randomUUID()
                }));
                setAppState(s => s ? { ...s, contradictions: newContradictions } : null);
            } else {
                 setAppState(s => s ? { ...s, contradictions: [] } : null);
                 alert("Keine Widersprüche gefunden.");
            }
        } catch (error) {
            console.error("Failed to find contradictions:", error);
            alert("Ein Fehler ist bei der Widerspruchsanalyse aufgetreten.");
        }

    }, [appState, dispatchAgentTask, setAppState]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-white">Widerspruchsanalyse</h1>
                 <button 
                    onClick={handleFindContradictions}
                    disabled={isLoading} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Analysiere...' : 'Analyse starten'}
                </button>
            </div>
            <p className="text-gray-400">Diese Funktion analysiert alle Dokumente mit einer Tiefenanalyse und hebt potenzielle widersprüchliche Aussagen hervor.</p>
            
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