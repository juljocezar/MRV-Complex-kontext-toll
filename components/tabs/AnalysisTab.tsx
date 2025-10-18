import React, { useState, useCallback } from 'react';
import type { AppState, AgentActivity } from '../../types';
import { useAgentDispatcher } from '../../hooks/useAgentDispatcher';

interface AnalysisTabProps {
    appState: AppState;
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>;
    setAppState: React.Dispatch<React.SetStateAction<AppState | null>>;
}

const DETAILED_ANALYSIS_SCHEMA = {
    type: "OBJECT",
    properties: {
        beteiligte_parteien: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    type: { type: "STRING", enum: ["Person", "Organisation", "Ort"] },
                    rolle: { type: "STRING" }
                },
                required: ["name", "type", "rolle"]
            }
        },
        zentrale_fakten: {
            type: "ARRAY",
            items: { type: "STRING" }
        },
        timeline_events: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    datum: { type: "STRING" },
                    ereignis: { type: "STRING" }
                },
                required: ["datum", "ereignis"]
            }
        },
        rechtliche_implikationen: { type: "STRING" },
        schluesselwoerter: {
            type: "ARRAY",
            items: { type: "STRING" }
        }
    },
    required: ["beteiligte_parteien", "zentrale_fakten", "timeline_events", "rechtliche_implikationen", "schluesselwoerter"]
};


const AnalysisTab: React.FC<AnalysisTabProps> = ({ appState, addAgentActivity, setAppState }) => {
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const { dispatchAgentTask, isLoading } = useAgentDispatcher(appState, addAgentActivity);
    const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheckboxChange = (docId: string) => {
        setSelectedDocIds(prev =>
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    const handleDetailedAnalysis = useCallback(async () => {
        setError(null);
        if (selectedDocIds.length === 0) {
            alert("Bitte wählen Sie mindestens ein Dokument für die Analyse aus.");
            return;
        }

        for (const docId of selectedDocIds) {
            const doc = appState.documents.find(d => d.id === docId);
            if (!doc || !doc.content) continue;

            try {
                setAnalyzingDocId(doc.id);
                const prompt = `Führe eine detaillierte Analyse des folgenden Dokuments durch. Extrahiere die beteiligten Parteien, zentralen Fakten, Timeline-Ereignisse, rechtliche Implikationen und Schlüsselwörter. Gib das Ergebnis ausschließlich als JSON-Objekt zurück, das dem vorgegebenen Schema entspricht. Dokumenteninhalt: """${doc.content.substring(0, 8000)}"""`;

                const result = await dispatchAgentTask(prompt, 'document_analysis', DETAILED_ANALYSIS_SCHEMA);

                if (result && typeof result === 'object' && result !== null) {
                    const analysisResult = result as any;

                    setAppState(s => {
                        if (!s) return null;

                        const newKnowledgeItems = (analysisResult.zentrale_fakten || []).map((fact: string) => ({
                            id: crypto.randomUUID(), docId, content: fact, tags: analysisResult.schluesselwoerter || [], createdAt: new Date().toISOString(),
                        }));
                        const newTimelineEvents = (analysisResult.timeline_events || []).map((event: any) => ({
                            id: crypto.randomUUID(), docId, date: event.datum, title: event.ereignis, type: 'Analyse-Extraktion',
                        }));
                        const newEntities = (analysisResult.beteiligte_parteien || []).map((party: any) => ({
                            id: crypto.randomUUID(), docId, name: party.name, type: party.type, role: party.rolle,
                        }));

                        return {
                            ...s,
                            documentAnalysisResults: { ...s.documentAnalysisResults, [docId]: analysisResult },
                            knowledgeItems: [...s.knowledgeItems, ...newKnowledgeItems],
                            timelineEvents: [...s.timelineEvents, ...newTimelineEvents],
                            caseEntities: [...s.caseEntities, ...newEntities],
                        };
                    });
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during analysis.';
                setError(`Fehler bei der Analyse von ${doc.name}: ${errorMessage}`);
                // Stop further analysis on error
                break;
            } finally {
                setAnalyzingDocId(null);
            }
        }
        setSelectedDocIds([]);
    }, [dispatchAgentTask, selectedDocIds, appState.documents, setAppState]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Tiefenanalyse</h1>
                <button
                    onClick={handleDetailedAnalysis}
                    disabled={isLoading || selectedDocIds.length === 0}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? `Analysiere...` : 'Tiefenanalyse durchführen'}
                </button>
            </div>
            <p className="text-gray-400">
                Wählen Sie ein oder mehrere Dokumente aus, um eine detaillierte Analyse durchzuführen.
                Die KI extrahiert automatisch Entitäten, Fakten und Ereignisse und speist sie in die Wissensbasis,
                die Chronologie und die Stammdaten ein.
            </p>
            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                    {appState.documents.map(doc => (
                        <li key={doc.id} className="p-4 flex items-center hover:bg-gray-700/50">
                            <input
                                id={`doc-${doc.id}`}
                                type="checkbox"
                                className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={() => handleCheckboxChange(doc.id)}
                            />
                            <label htmlFor={`doc-${doc.id}`} className="ml-3 block text-sm font-medium text-white cursor-pointer w-full">
                                {doc.name} <span className="text-gray-500">({doc.type || 'N/A'})</span>
                                {analyzingDocId === doc.id && <span className="ml-2 text-yellow-400 animate-pulse">wird analysiert...</span>}
                            </label>
                        </li>
                    ))}
                     {appState.documents.length === 0 && <p className="text-center text-gray-500 py-4">Keine Dokumente zum Analysieren vorhanden.</p>}
                </ul>
            </div>
             {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">Fehler: {error}</div>}
        </div>
    );
};

export default AnalysisTab;