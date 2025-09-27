
import React, { useMemo, useRef } from 'react';
import { Document, GeneratedDocument, DocumentAnalysisResults, CaseSummary, ActiveTab, DocumentAnalysisResult, CaseEntity, Notification } from '../../types';
import SimpleDonutChart from '../ui/charts/SimpleDonutChart';
import SimpleBarChart from '../ui/charts/SimpleBarChart';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DashboardTabProps {
    documents: Document[];
    generatedDocuments: GeneratedDocument[];
    documentAnalysisResults: DocumentAnalysisResults;
    caseDescription: string;
    setCaseDescription: (desc: string) => void;
    setActiveTab: (tab: ActiveTab) => void;
    onResetCase: () => void;
    onExportCase: () => void;
    onImportCase: (file: File) => void;
    caseSummary: CaseSummary | null;
    onPerformOverallAnalysis: () => void;
    isLoading: boolean;
    loadingSection: string;
    caseEntities: CaseEntity[];
    addNotification: (message: string, type?: Notification['type'], duration?: number, details?: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    documents, generatedDocuments, documentAnalysisResults, caseDescription, setCaseDescription, setActiveTab,
    onResetCase, onExportCase, onImportCase, caseSummary, onPerformOverallAnalysis, isLoading, loadingSection, caseEntities, addNotification
}) => {

    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportCase(file);
        }
        // Reset the input value to allow re-uploading the same file
        if (e.target) {
            e.target.value = '';
        }
    };

    const docStatusData = useMemo(() => {
        const classified = documents.filter(d => d.classificationStatus === 'classified').length;
        const unclassified = documents.filter(d => d.classificationStatus === 'unclassified').length;
        const error = documents.filter(d => d.classificationStatus === 'error').length;
        return [
            { label: 'Analysiert', value: classified, color: '#3b82f6' },
            { label: 'Unanalysiert', value: unclassified, color: '#6b7280' },
            { label: 'Fehler', value: error, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [documents]);

    const entityTypeData = useMemo(() => {
        const counts = caseEntities.reduce((acc, entity) => {
            acc[entity.type] = (acc[entity.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([label, value]) => ({ label, value }));
    }, [caseEntities]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Dokumente</h3>
                    <p className="text-4xl font-bold text-white">{documents.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Entitäten</h3>
                    <p className="text-4xl font-bold text-white">{caseEntities.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Generierte Dokumente</h3>
                    <p className="text-4xl font-bold text-white">{generatedDocuments.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-gray-300">Fall-Verwaltung</h3>
                     <div className="mt-4 flex flex-wrap gap-2">
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleFileImport} data-testid="import-input" />
                        <Tooltip text="Exportiert den gesamten Fall als JSON-Datei.">
                            <button onClick={onExportCase} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Export</button>
                        </Tooltip>
                        <Tooltip text="Importiert einen Fall aus einer JSON-Datei. Achtung: Der aktuelle Fall wird überschrieben.">
                           <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm">Import</button>
                        </Tooltip>
                         <Tooltip text="Löscht alle Daten des aktuellen Falls unwiderruflich.">
                            <button onClick={onResetCase} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm">Reset</button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg">
                     <h3 className="text-xl font-semibold mb-3 text-white">Dokumenten-Status</h3>
                     {documents.length > 0 ? <SimpleDonutChart data={docStatusData} /> : <p className="text-center text-gray-500 pt-16">Keine Dokumente</p>}
                </div>
                 <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                     <h3 className="text-xl font-semibold mb-3 text-white">Entitäten-Übersicht</h3>
                     {caseEntities.length > 0 ? <SimpleBarChart data={entityTypeData} /> : <p className="text-center text-gray-500 pt-16">Keine Entitäten</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-white">Fallbeschreibung</h3>
                    <textarea
                        value={caseDescription}
                        onChange={(e) => setCaseDescription(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-semibold text-white">KI-Fallzusammenfassung</h3>
                         <Tooltip text="Führt eine KI-basierte Gesamtanalyse des Falls durch, um eine Zusammenfassung, Risiken und nächste Schritte zu identifizieren.">
                            <button
                                onClick={onPerformOverallAnalysis}
                                disabled={isLoading && loadingSection === 'case_analysis'}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading && loadingSection === 'case_analysis' && <LoadingSpinner className="h-4 w-4 mr-2" />}
                                {isLoading && loadingSection === 'case_analysis' ? 'Analysiere...' : 'Analyse durchführen'}
                            </button>
                        </Tooltip>
                    </div>
                    {caseSummary ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-gray-300">Zusammenfassung</h4>
                                <p className="text-gray-400">{caseSummary.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Identifizierte Risiken</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {(caseSummary?.identifiedRisks || []).map((r, i) => <li key={i}><strong>{r.risk}:</strong> {r.description}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Vorgeschlagene nächste Schritte</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {(caseSummary?.suggestedNextSteps || []).map((s, i) => <li key={i}><strong>{s.step}:</strong> {s.justification}</li>)}
                                </ul>
                            </div>
                            <p className="text-xs text-gray-500 text-right pt-2">Generiert am: {new Date(caseSummary.generatedAt).toLocaleString()}</p>
                        </div>
                    ) : (
                         <div className="text-center py-8 text-gray-500">
                             {isLoading && loadingSection === 'case_analysis' 
                                ? <p>Analyse wird durchgeführt...</p>
                                : <p>Noch keine Zusammenfassung erstellt. Klicken Sie auf "Analyse durchführen".</p>
                             }
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardTab;
